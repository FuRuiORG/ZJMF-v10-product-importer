// 全局状态
let selectedSupplier = null;
let selectedProducts = [];
let allProducts = [];

// DOM 元素
const configMessage = document.getElementById('config_message');
const loginStatus = document.getElementById('login_status');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    loadConfig();
    setupEventListeners();
    hidePageLoader();
});

// 隐藏页面加载动画
function hidePageLoader() {
    var loader = document.getElementById('page-loader');
    var body = document.body;
    
    setTimeout(function() {
        if (loader) {
            loader.classList.add('loaded');
        }
        if (body) {
            body.classList.remove('loading');
        }
    }, 1000);
}

// 按钮加载状态控制
function setButtonLoading(buttonId, loading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    if (loading) {
        btn.classList.add('btn-loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('btn-loading');
        btn.disabled = false;
    }
}

// 加载配置
async function loadConfig() {
    try {
        const response = await fetch('/api/config');
        const result = await response.json();
        
        if (result.status === 200 && result.data) {
            document.getElementById('site_url').value = result.data.site_url || '';
            document.getElementById('admin_path').value = result.data.admin_path || '';
            document.getElementById('username').value = result.data.username || '';
            document.getElementById('password').value = result.data.password || '';
        }
    } catch (error) {
        console.error('加载配置失败:', error);
    }
}

// 设置事件监听
function setupEventListeners() {
    document.getElementById('save_config_btn').addEventListener('click', saveConfig);
    document.getElementById('login_btn').addEventListener('click', login);
    document.getElementById('load_suppliers_btn').addEventListener('click', loadSuppliers);
    document.getElementById('load_products_btn').addEventListener('click', loadProducts);
    document.getElementById('select_all_btn').addEventListener('click', selectAllProducts);
    document.getElementById('deselect_all_btn').addEventListener('click', deselectAllProducts);
    document.getElementById('import_selected_btn').addEventListener('click', importSelectedProducts);
    document.getElementById('first_level_select').addEventListener('change', filterSecondLevelGroups);
}

// 保存配置
async function saveConfig() {
    setButtonLoading('save_config_btn', true);
    
    const config = {
        site_url: document.getElementById('site_url').value.trim(),
        admin_path: document.getElementById('admin_path').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };
    
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            showMessage('配置保存成功', 'success');
        } else {
            showMessage(result.msg || '保存失败', 'error');
        }
    } catch (error) {
        showMessage('保存失败：' + error.message, 'error');
    } finally {
        setButtonLoading('save_config_btn', false);
    }
}

// 登录
async function login() {
    setButtonLoading('login_btn', true);
    
    const config = {
        site_url: document.getElementById('site_url').value.trim(),
        admin_path: document.getElementById('admin_path').value.trim(),
        username: document.getElementById('username').value.trim(),
        password: document.getElementById('password').value
    };
    
    if (!config.site_url || !config.admin_path || !config.username || !config.password) {
        showMessage('请填写完整的配置信息', 'error');
        setButtonLoading('login_btn', false);
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            showMessage('登录成功', 'success');
            loginStatus.style.display = 'block';
            loginStatus.textContent = `已登录：${config.site_url}`;
            document.getElementById('groups_section').style.display = 'block';
            loadGroups();
        } else {
            showMessage(result.msg || '登录失败', 'error');
        }
    } catch (error) {
        showMessage('登录失败：' + error.message, 'error');
    } finally {
        setButtonLoading('login_btn', false);
    }
}

// 加载分组
async function loadGroups() {
    try {
        const response = await fetch('/api/groups');
        const result = await response.json();
        
        if (result.status === 200) {
            const firstLevelSelect = document.getElementById('first_level_select');
            const secondLevelSelect = document.getElementById('second_level_select');
            
            result.data.first_level.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                option.dataset.type = group.type || '';
                firstLevelSelect.appendChild(option);
            });
            
            result.data.second_level.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                option.dataset.parentId = group.parent_id;
                option.dataset.type = group.type || '';
                secondLevelSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载分组失败:', error);
    }
}

// 过滤二级分组
function filterSecondLevelGroups() {
    const firstLevelId = document.getElementById('first_level_select').value;
    const secondLevelOptions = document.querySelectorAll('#second_level_select option');
    
    secondLevelOptions.forEach(option => {
        if (!firstLevelId || option.dataset.parentId == firstLevelId) {
            option.style.display = '';
        } else {
            option.style.display = 'none';
        }
    });
    
    document.getElementById('second_level_select').value = '';
}

// 加载供应商
async function loadSuppliers() {
    const productGroupId = document.getElementById('second_level_select').value;
    
    if (!productGroupId) {
        showMessage('请先选择目标分组', 'error');
        return;
    }
    
    setButtonLoading('load_suppliers_btn', true);
    
    try {
        const response = await fetch('/api/suppliers');
        const result = await response.json();
        
        if (result.status === 200) {
            const suppliersList = document.getElementById('suppliers_list');
            suppliersList.innerHTML = '';
            
            result.data.forEach(supplier => {
                const card = document.createElement('div');
                card.className = 'feature-card bg-white p-5 border border-neutral-200 cursor-pointer';
                card.dataset.supplierId = supplier.id;
                card.innerHTML = `
                    <h4 class="text-sm font-semibold text-neutral-900 mb-2">${supplier.name}</h4>
                    <p class="text-xs text-neutral-500 mb-1 break-all">URL: ${supplier.url}</p>
                    <p class="text-xs text-neutral-500">已导入产品数：${supplier.product_num || 0}</p>
                `;
                
                card.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    selectSupplier(supplier.id, this);
                });
                suppliersList.appendChild(card);
            });
            
            document.getElementById('suppliers_section').style.display = 'block';
        } else {
            showMessage(result.msg || '加载失败', 'error');
        }
    } catch (error) {
        showMessage('加载失败：' + error.message, 'error');
    } finally {
        setButtonLoading('load_suppliers_btn', false);
    }
}

// 选择供应商
function selectSupplier(supplierId, card) {
    selectedSupplier = supplierId;
    
    // 移除所有供应商卡片的选中状态
    document.querySelectorAll('#suppliers_list .feature-card').forEach(c => {
        c.classList.remove('selected-card');
        c.style.borderColor = '';
        c.style.backgroundColor = '';
    });
    
    // 添加当前卡片的选中状态
    card.classList.add('selected-card');
    card.style.borderColor = '#10b981';
    card.style.backgroundColor = '#d1fae5';
    
    console.log('已选择供应商:', supplierId, card);
}

// 加载产品
async function loadProducts() {
    if (!selectedSupplier) {
        showMessage('请选择供应商', 'error');
        return;
    }
    
    setButtonLoading('load_products_btn', true);
    
    try {
        const response = await fetch(`/api/products?supplier_id=${selectedSupplier}`);
        const result = await response.json();
        
        if (result.status === 200) {
            allProducts = result.data.products;
            selectedProducts = [];
            
            const productsList = document.getElementById('products_list');
            productsList.innerHTML = '';
            
            result.data.products.forEach((product, index) => {
                const card = document.createElement('div');
                card.className = 'feature-card bg-white p-5 border border-neutral-200 cursor-pointer';
                card.dataset.productIndex = index;
                card.innerHTML = `
                    <div class="flex items-start gap-3 mb-3">
                        <input type="checkbox" class="product-checkbox mt-1 w-4 h-4" data-index="${index}">
                        <div class="flex-1">
                            <h4 class="text-sm font-semibold text-neutral-900 mb-2">${product.name}</h4>
                            <div class="flex items-center justify-between">
                                <span class="text-lg font-bold text-green-600">¥${product.price}</span>
                                <span class="text-xs text-neutral-500">${product.billingcycle_zh || '月'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="text-xs text-neutral-500 line-clamp-3">${formatDescription(product.description)}</div>
                `;
                
                const checkbox = card.querySelector('.product-checkbox');
                checkbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    toggleProductSelection(index, e.target.checked, card);
                });
                
                card.addEventListener('click', (e) => {
                    if (e.target.tagName !== 'INPUT') {
                        checkbox.checked = !checkbox.checked;
                        toggleProductSelection(index, checkbox.checked, card);
                    }
                });
                
                productsList.appendChild(card);
            });
            
            document.getElementById('products_section').style.display = 'block';
        } else {
            showMessage(result.msg || '加载失败', 'error');
        }
    } catch (error) {
        showMessage('加载失败：' + error.message, 'error');
    } finally {
        setButtonLoading('load_products_btn', false);
    }
}

// 格式化描述
function formatDescription(desc) {
    if (!desc) return '';
    return desc.replace(/<br\/>/g, '\n').replace(/<[^>]+>/g, '');
}

// 切换产品选择
function toggleProductSelection(index, isSelected, card) {
    if (isSelected) {
        card.classList.add('selected-card');
        if (!selectedProducts.includes(index)) {
            selectedProducts.push(index);
        }
    } else {
        card.classList.remove('selected-card');
        selectedProducts = selectedProducts.filter(i => i !== index);
    }
}

// 全选
function selectAllProducts() {
    document.querySelectorAll('.product-checkbox').forEach((checkbox, index) => {
        checkbox.checked = true;
        const card = checkbox.closest('#products_list .feature-card');
        if (card) {
            card.classList.add('selected-card');
            if (!selectedProducts.includes(index)) {
                selectedProducts.push(index);
            }
        }
    });
}

// 取消全选
function deselectAllProducts() {
    document.querySelectorAll('.product-checkbox').forEach((checkbox, index) => {
        checkbox.checked = false;
        const card = checkbox.closest('#products_list .feature-card');
        if (card) {
            card.classList.remove('selected-card');
        }
    });
    selectedProducts = [];
}

// HTML 实体解码函数
function decodeHtmlEntities(text) {
    const entities = {
        '&lt;': '<',
        '&gt;': '>',
        '&amp;': '&',
        '&quot;': '"',
        '&apos;': "'",
        '&#39;': "'",
        '&nbsp;': ' '
    };
    
    return text.replace(/&lt;|&gt;|&amp;|&quot;|&apos;|&#39;|&nbsp;/g, match => entities[match]);
}

// HTML 标签转换函数：将 <li>xxx</li> 转换为 xxx<br/>
function convertHtmlDescription(html) {
    // 先解码 HTML 实体
    let decoded = decodeHtmlEntities(html);
    // 再转换 <li> 标签
    let converted = decoded.replace(/<li\s*>([\s\S]*?)<\/li>/g, '$1<br/>');
    // 最后重新编码 HTML 实体
    return encodeHtmlEntities(converted);
}

// HTML 实体编码函数
function encodeHtmlEntities(text) {
    const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    return text.replace(/[<>&"']/g, match => entities[match]);
}

// 导入选中产品
async function importSelectedProducts() {
    if (selectedProducts.length === 0) {
        showMessage('请选择要导入的产品', 'error');
        return;
    }
    
    const productGroupId = document.getElementById('second_level_select').value;
    if (!productGroupId) {
        showMessage('请选择目标分组', 'error');
        return;
    }
    
    const priceBasis = document.getElementById('price_basis').value;
    const convertHtml = document.getElementById('convert_html_checkbox').checked;
    
    console.log('导入配置:', {
        convertHtml: convertHtml,
        productCount: selectedProducts.length,
        priceBasis: priceBasis
    });
    
    // 在前端处理 HTML 标签转换
    const importProducts = selectedProducts.map(index => {
        const product = allProducts[index];
        // 根据用户选择决定是否转换 HTML 标签
        const description = convertHtml ? convertHtmlDescription(product.description || '') : (product.description || '');
        
        return {
            id: '',
            supplier_id: selectedSupplier,
            mode: 'only_api',
            upstream_product_id: product.id,
            name: product.name,
            profit_type: 0,
            profit_percent: 0,
            renew_profit_type: 0,
            renew_profit_percent: 0,
            upgrade_profit_type: 0,
            upgrade_profit_percent: 0,
            auto_setup: 1,
            certification: 1,
            sync: 0,
            product_group_id: parseInt(productGroupId),
            description: description,
            price_basis: priceBasis
        };
    });
    
    setButtonLoading('import_selected_btn', true);
    
    try {
        const response = await fetch('/api/import', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                products: importProducts,
                product_group_id: parseInt(productGroupId),
                price_basis: priceBasis,
                supplier_id: selectedSupplier
            })
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            document.getElementById('progress_section').style.display = 'block';
            showMessage('开始导入，请稍候...', 'success');
            
            // 滚动到进度区域
            setTimeout(() => {
                document.getElementById('progress_section').scrollIntoView({ behavior: 'smooth' });
            }, 100);
            
            // 轮询进度
            pollImportProgress();
        } else {
            showMessage(result.msg || '导入失败', 'error');
            setButtonLoading('import_selected_btn', false);
        }
    } catch (error) {
        showMessage('导入失败：' + error.message, 'error');
        setButtonLoading('import_selected_btn', false);
    }
}

// 轮询导入进度
async function pollImportProgress() {
    const poll = async () => {
        try {
            const response = await fetch('/api/import/progress');
            const result = await response.json();
            
            if (result.status === 200) {
                const data = result.data;
                
                document.getElementById('progress_current').textContent = data.current;
                document.getElementById('progress_total').textContent = data.total;
                document.getElementById('progress_success').textContent = data.success_count;
                document.getElementById('progress_failed').textContent = data.failed_count;
                
                const percentage = data.total > 0 ? (data.current / data.total * 100) : 0;
                document.getElementById('progress_fill').style.width = percentage + '%';
                
                // 显示结果
                if (data.results && data.results.length > 0) {
                    const resultsDiv = document.getElementById('import_results');
                    resultsDiv.innerHTML = '';
                    
                    data.results.forEach(result => {
                        const item = document.createElement('div');
                        item.className = `p-3 rounded text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`;
                        item.textContent = `${result.success ? '✓' : '✗'} ${result.product_name}: ${result.message}`;
                        resultsDiv.appendChild(item);
                    });
                }
                
                // 如果还在导入中，继续轮询
                if (data.is_importing) {
                    setTimeout(poll, 1000);
                } else {
                    setButtonLoading('import_selected_btn', false);
                    showMessage(`导入完成！成功：${data.success_count}, 失败：${data.failed_count}`, 'success');
                }
            }
        } catch (error) {
            console.error('轮询进度失败:', error);
            setTimeout(poll, 1000);
        }
    };
    
    setTimeout(poll, 1000);
}

// 显示消息
function showMessage(msg, type) {
    if (!configMessage) return;
    
    configMessage.textContent = msg;
    configMessage.className = `mt-4 p-3 rounded text-sm ${type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`;
    configMessage.style.display = 'block';
    
    setTimeout(() => {
        configMessage.style.display = 'none';
        configMessage.textContent = '';
    }, 5000);
}
