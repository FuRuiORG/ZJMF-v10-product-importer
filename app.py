from flask import Flask, render_template, request, jsonify, session
from src.config_manager import ConfigManager
from src.api_client import APIClient
import threading
import time
import re
import html

app = Flask(__name__)
app.secret_key = 'zjmf-product-importer-secret-key-2024'

config_manager = ConfigManager()
api_client: APIClient = None

# 全局导入进度
import_progress = {
    'is_importing': False,
    'current': 0,
    'total': 0,
    'success_count': 0,
    'failed_count': 0,
    'results': []
}


def progress_callback(current, total, success_count, failed_count):
    """进度回调"""
    global import_progress
    import_progress['current'] = current
    import_progress['total'] = total
    import_progress['success_count'] = success_count
    import_progress['failed_count'] = failed_count


def convert_html_description(text):
    """将 <li>xxx</li> 转换为 xxx<br/>"""
    if not text:
        return ''
    decoded = html.unescape(text)
    converted = re.sub(r'<li\s*>([\s\S]*?)</li>', r'\1<br/>', decoded)
    converted = re.sub(r'(<br\/>) +', r'\1', converted)
    return converted


def convert_newlines_to_br(text):
    """将换行符转换为 <br/>"""
    if not text:
        return ''
    decoded = html.unescape(text)
    normalized = re.sub(r'[\r\n\t]+', '\n', decoded)
    normalized = normalized.strip()
    converted = normalized.replace('\n', '<br/>')
    converted = re.sub(r'(<br\/>)+', r'\1', converted)
    return converted


@app.route('/')
def index():
    """主页"""
    return render_template('index.html')


@app.route('/api/config', methods=['GET'])
def get_config():
    """获取配置"""
    config = config_manager.get_config()
    return jsonify({'status': 200, 'data': config})


@app.route('/api/config', methods=['POST'])
def save_config():
    """保存配置"""
    data = request.json
    is_valid, msg = config_manager.validate_config(data)
    
    if not is_valid:
        return jsonify({'status': 400, 'msg': msg})
    
    if config_manager.save_config(data):
        return jsonify({'status': 200, 'msg': '保存成功'})
    else:
        return jsonify({'status': 500, 'msg': '保存失败'})


@app.route('/api/login', methods=['POST'])
def login():
    """登录"""
    global api_client
    
    data = request.json
    site_url = data.get('site_url', '')
    admin_path = data.get('admin_path', '')
    username = data.get('username', '')
    password = data.get('password', '')
    
    if not all([site_url, admin_path, username, password]):
        return jsonify({'status': 400, 'msg': '参数不完整'})
    
    api_client = APIClient(site_url, admin_path)
    success, msg = api_client.login(username, password)
    
    if success:
        session['logged_in'] = True
        return jsonify({'status': 200, 'msg': msg})
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/groups', methods=['GET'])
def get_groups():
    """获取分组"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    # 异步获取一级和二级分组
    first_level = []
    second_level = []
    
    success1, msg1, first_level = api_client.get_first_level_groups()
    success2, msg2, second_level = api_client.get_second_level_groups()
    
    return jsonify({
        'status': 200,
        'data': {
            'first_level': first_level,
            'second_level': second_level
        }
    })


@app.route('/api/suppliers', methods=['GET'])
def get_suppliers():
    """获取供应商列表"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    success, msg, suppliers = api_client.get_suppliers()
    
    if success:
        return jsonify({'status': 200, 'data': suppliers})
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/products', methods=['GET'])
def get_products():
    """获取产品列表"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    supplier_id = request.args.get('supplier_id', type=int)
    if not supplier_id:
        return jsonify({'status': 400, 'msg': '缺少供应商 ID'})
    
    # 先检查供应商状态
    success, msg = api_client.check_supplier_status(supplier_id)
    if not success:
        return jsonify({'status': 400, 'msg': msg})
    
    # 获取产品列表
    success, msg, products, currency = api_client.get_supplier_products(supplier_id)
    
    if success:
        return jsonify({
            'status': 200,
            'data': {
                'products': products,
                'currency': currency
            }
        })
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/import', methods=['POST'])
def import_products():
    """导入产品"""
    global import_progress, api_client
    
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    data = request.json
    products = data.get('products', [])
    product_group_id = int(data.get('product_group_id', 0))
    price_basis = data.get('price_basis', 'standard')
    supplier_id = int(data.get('supplier_id', 0))
    
    if not products or not product_group_id or not supplier_id:
        return jsonify({'status': 400, 'msg': '参数不完整'})
    
    # 直接使用前端处理好的产品数据（已转换 HTML 标签）
    import_data = products
    
    # 重置进度
    import_progress = {
        'is_importing': True,
        'current': 0,
        'total': len(import_data),
        'success_count': 0,
        'failed_count': 0,
        'results': []
    }
    
    # 在后台线程中执行导入
    def do_import():
        global import_progress
        result = api_client.import_products_batch(import_data, progress_callback)
        import_progress['results'] = result['results']
        import_progress['is_importing'] = False
    
    thread = threading.Thread(target=do_import)
    thread.start()
    
    return jsonify({
        'status': 200,
        'msg': '开始导入',
        'data': {'total': len(import_data)}
    })


@app.route('/api/import/progress', methods=['GET'])
def get_import_progress():
    """获取导入进度"""
    return jsonify({
        'status': 200,
        'data': import_progress
    })


@app.route('/api/upstream/fetch', methods=['POST'])
def fetch_upstream_products():
    """获取上游产品数据"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    data = request.json
    upstream_url = data.get('upstream_url', '')
    
    if not upstream_url:
        return jsonify({'status': 400, 'msg': '缺少上游 URL'})
    
    success, msg, upstream_data = api_client.get_upstream_products(upstream_url)
    
    if success:
        return jsonify({
            'status': 200,
            'msg': '获取成功',
            'data': upstream_data
        })
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/upstream/suppliers', methods=['GET'])
def get_upstream_suppliers():
    """获取上游供应商列表（用于全自动导入）"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    success, msg, suppliers = api_client.get_suppliers()
    
    if success:
        upstream_suppliers = []
        for supplier in suppliers:
            supplier_url = supplier.get('url', '')
            if supplier_url:
                products_url = supplier_url.rstrip('/') + '/v1/products'
                upstream_suppliers.append({
                    'id': supplier.get('id'),
                    'name': supplier.get('name', ''),
                    'url': products_url,
                    'product_num': supplier.get('product_num', 0)
                })
        
        return jsonify({
            'status': 200,
            'data': upstream_suppliers
        })
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/upstream/create_group', methods=['POST'])
def create_group():
    """创建产品分组"""
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    data = request.json
    name = data.get('name', '')
    parent_id = data.get('parent_id', 0)
    
    if not name:
        return jsonify({'status': 400, 'msg': '分组名称不能为空'})
    
    success, msg, group_id = api_client.create_product_group(name, parent_id)
    
    if success:
        return jsonify({
            'status': 200,
            'msg': '创建成功',
            'data': {'id': group_id}
        })
    else:
        return jsonify({'status': 400, 'msg': msg})


@app.route('/api/upstream/import_auto', methods=['POST'])
def import_upstream_auto():
    """全自动导入上游产品"""
    global import_progress, api_client
    
    if not api_client:
        return jsonify({'status': 400, 'msg': '请先登录'})
    
    data = request.json
    upstream_url = data.get('upstream_url', '')
    supplier_id = data.get('supplier_id', 0)
    selected_groups = data.get('selected_groups', [])
    first_level_group_id = data.get('first_level_group_id', 0)
    price_basis = data.get('price_basis', 'standard')
    convert_html = data.get('convert_html', True)
    auto_convert_newlines = data.get('auto_convert_newlines', True)
    
    profit_type = data.get('profit_type', 0)
    profit_percent = data.get('profit_percent', 0)
    renew_profit_type = data.get('renew_profit_type', 0)
    renew_profit_percent = data.get('renew_profit_percent', 0)
    upgrade_profit_type = data.get('upgrade_profit_type', 0)
    upgrade_profit_percent = data.get('upgrade_profit_percent', 0)
    auto_setup = data.get('auto_setup', 1)
    certification = data.get('certification', 1)
    sync = data.get('sync', 0)
    mode = data.get('mode', 'only_api')
    
    if not upstream_url or not selected_groups:
        return jsonify({'status': 400, 'msg': '参数不完整'})
    
    # 重置进度
    import_progress = {
        'is_importing': True,
        'current': 0,
        'total': 0,
        'success_count': 0,
        'failed_count': 0,
        'results': []
    }
    
    # 在后台线程中执行导入
    def do_import():
        global import_progress
        
        # 1. 获取上游产品数据
        success, msg, upstream_data = api_client.get_upstream_products(upstream_url)
        if not success:
            import_progress['is_importing'] = False
            import_progress['results'].append({
                'product_name': '获取上游数据',
                'success': False,
                'message': msg
            })
            return
        
        # 2. 解析分组和产品
        first_groups = upstream_data.get('first_group', [])
        
        # 根据用户选择的分组来筛选
        selected_second_ids = [str(g['second_id']) for g in selected_groups if g.get('second_id')]
        selected_first_ids = [str(g['first_id']) for g in selected_groups if g.get('first_id') and not g.get('second_id')]
        
        # 分组ID映射：上游ID -> 本地ID
        first_group_mapping = {}
        second_group_mapping = {}
        
        # 3. 先创建所有需要的一级分组
        if not first_level_group_id:
            for first_group in first_groups:
                upstream_first_id = str(first_group.get('id', ''))
                if upstream_first_id in selected_first_ids:
                    success, msg, group_id = api_client.create_product_group(first_group.get('name', ''), 0)
                    if success:
                        first_group_mapping[upstream_first_id] = group_id
                    else:
                        import_progress['results'].append({
                            'product_name': f"[{first_group.get('name', '')}] 创建一级分组失败",
                            'success': False,
                            'message': msg
                        })
        else:
            for first_id in selected_first_ids:
                first_group_mapping[first_id] = first_level_group_id
        
        # 4. 创建所有需要的二级分组
        for first_group in first_groups:
            upstream_first_id = str(first_group.get('id', ''))
            second_groups = first_group.get('group', [])
            
            for second_group in second_groups:
                upstream_second_id = str(second_group.get('id', ''))
                
                should_create_second = False
                parent_id = None
                
                if upstream_second_id in selected_second_ids:
                    should_create_second = True
                    parent_id = first_group_mapping.get(upstream_first_id, first_level_group_id)
                elif upstream_first_id in selected_first_ids:
                    should_create_second = True
                    parent_id = first_group_mapping.get(upstream_first_id)
                
                if should_create_second and parent_id:
                    success, msg, group_id = api_client.create_product_group(
                        second_group.get('name', ''), 
                        parent_id
                    )
                    if success:
                        second_group_mapping[upstream_second_id] = group_id
                    else:
                        import_progress['results'].append({
                            'product_name': f"[{second_group.get('name', '')}] 创建二级分组失败",
                            'success': False,
                            'message': msg
                        })
        
        # 5. 收集所有需要导入的产品
        all_products = []
        for first_group in first_groups:
            upstream_first_id = str(first_group.get('id', ''))
            should_process_first = upstream_first_id in selected_first_ids
            
            second_groups = first_group.get('group', [])
            for second_group in second_groups:
                upstream_second_id = str(second_group.get('id', ''))
                
                if upstream_second_id not in selected_second_ids and not should_process_first:
                    continue
                
                products = second_group.get('products', [])
                for product in products:
                    all_products.append({
                        'product': product,
                        'upstream_first_id': upstream_first_id,
                        'upstream_second_id': upstream_second_id
                    })
        
        # 倒序导入（和手动导入一样）
        all_products = list(reversed(all_products))
        
        import_progress['total'] = len(all_products)
        
        # 6. 导入产品
        for item in all_products:
            product = item['product']
            upstream_first_id = item['upstream_first_id']
            upstream_second_id = item['upstream_second_id']
            
            # 确定目标分组ID
            if upstream_second_id in second_group_mapping:
                target_group_id = second_group_mapping[upstream_second_id]
            elif upstream_first_id in first_group_mapping:
                target_group_id = first_group_mapping[upstream_first_id]
            else:
                target_group_id = first_level_group_id
            
            if not target_group_id:
                import_progress['current'] += 1
                import_progress['failed_count'] += 1
                import_progress['results'].append({
                    'product_name': product.get('name', ''),
                    'success': False,
                    'message': '无法确定目标分组'
                })
                continue
            
            # 处理描述文本
            description = product.get('description', '')
            if convert_html:
                description = convert_html_description(description)
            if auto_convert_newlines:
                description = convert_newlines_to_br(description)
            
            # 准备产品数据
            product_data = {
                'id': '',
                'supplier_id': supplier_id,
                'mode': mode,
                'upstream_product_id': product.get('id', ''),
                'name': product.get('name', ''),
                'profit_type': profit_type,
                'profit_percent': profit_percent,
                'renew_profit_type': renew_profit_type,
                'renew_profit_percent': renew_profit_percent,
                'upgrade_profit_type': upgrade_profit_type,
                'upgrade_profit_percent': upgrade_profit_percent,
                'auto_setup': auto_setup,
                'certification': certification,
                'sync': sync,
                'product_group_id': target_group_id,
                'description': description,
                'price_basis': price_basis
            }
            
            # 导入产品
            success, msg = api_client.import_product(product_data)
            
            import_progress['current'] += 1
            if success:
                import_progress['success_count'] += 1
            else:
                import_progress['failed_count'] += 1
            
            import_progress['results'].append({
                'product_name': product.get('name', ''),
                'success': success,
                'message': msg
            })
        
        import_progress['is_importing'] = False
    
    thread = threading.Thread(target=do_import)
    thread.start()
    
    return jsonify({
        'status': 200,
        'msg': '开始导入',
        'data': {'total': import_progress['total']}
    })


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
