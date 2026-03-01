from flask import Flask, render_template, request, jsonify, session
from src.config_manager import ConfigManager
from src.api_client import APIClient
import threading
import time

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


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
