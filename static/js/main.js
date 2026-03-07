// 全局状态
let selectedSupplier = null;
let selectedProducts = [];
let allProducts = [];

// 全自动导入相关状态
let upstreamData = null;
let selectedUpstreamGroups = [];
let selectedUpstreamSupplier = null;
let upstreamSuppliersList = [];

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
    document.getElementById('load_products_btn').addEventListener('click', loadProducts);
    document.getElementById('select_all_btn').addEventListener('click', selectAllProducts);
    document.getElementById('deselect_all_btn').addEventListener('click', deselectAllProducts);
    document.getElementById('import_selected_btn').addEventListener('click', importSelectedProducts);
    document.getElementById('first_level_select').addEventListener('change', filterSecondLevelGroups);
    
    // 导入方式选择
    const autoImportCard = document.getElementById('auto_import_card');
    const supplierImportCard = document.getElementById('supplier_import_card');
    
    if (autoImportCard) {
        autoImportCard.addEventListener('click', selectAutoImport);
    }
    
    if (supplierImportCard) {
        supplierImportCard.addEventListener('click', selectSupplierImport);
    }
    
    // 全自动导入相关事件监听
    const importUpstreamBtn = document.getElementById('import_upstream_btn');
    if (importUpstreamBtn) {
        importUpstreamBtn.addEventListener('click', importUpstreamAuto);
    }
    
    // 搜索功能
    const searchInput = document.getElementById('product_search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterProducts(this.value);
        });
    }
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
            document.getElementById('suppliers_section').style.display = 'block';
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

// 显示浮动操作栏
function showFloatingActionBar() {
    const floatingBar = document.getElementById('floating_action_bar');
    const floatingGroupSelect = document.getElementById('floating_product_group_select');
    
    if (floatingBar) {
        floatingBar.style.display = 'block';
    }
    
    // 同步分组选择
    if (floatingGroupSelect) {
        const mainSelect = document.getElementById('second_level_select');
        if (mainSelect) {
            floatingGroupSelect.innerHTML = mainSelect.innerHTML;
            floatingGroupSelect.value = mainSelect.value;
            
            // 监听浮动栏的分组选择变化
            floatingGroupSelect.addEventListener('change', function() {
                mainSelect.value = this.value;
            });
        }
    }
}

// 隐藏浮动操作栏
function hideFloatingActionBar() {
    const floatingBar = document.getElementById('floating_action_bar');
    if (floatingBar) {
        floatingBar.style.display = 'none';
    }
}

// 加载供应商
async function loadSuppliers() {
    setButtonLoading('load_suppliers_btn', true);
    
    try {
        const response = await fetch('/api/suppliers');
        const result = await response.json();
        
        if (result.status === 200) {
            const suppliersList = document.getElementById('suppliers_list');
            suppliersList.innerHTML = '';
            
            result.data.forEach(supplier => {
                const card = document.createElement('div');
                card.className = 'card p-5 cursor-pointer';
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
    document.querySelectorAll('#suppliers_list .card').forEach(c => {
        c.classList.remove('card-selected');
        c.style.borderColor = '';
        c.style.backgroundColor = '';
    });
    
    card.classList.add('card-selected');
    card.style.borderColor = '#525252';
    card.style.backgroundColor = '#f5f5f5';
    
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
                card.className = 'card p-5 cursor-pointer';
                card.dataset.productIndex = index;
                card.innerHTML = `
                    <div class="flex items-start gap-3 mb-3">
                        <input type="checkbox" class="product-checkbox mt-1 checkbox-field" data-index="${index}">
                        <div class="flex-1">
                            <h4 class="text-sm font-semibold text-neutral-900 mb-2">${product.name}</h4>
                            <div class="flex items-center justify-between">
                                <span class="text-base font-semibold text-neutral-900">¥${product.price}</span>
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
            
            // 显示浮动操作栏
            showFloatingActionBar();
        } else {
            showMessage(result.msg || '加载失败', 'error');
        }
    } catch (error) {
        showMessage('加载失败：' + error.message, 'error');
    } finally {
        setButtonLoading('load_products_btn', false);
    }
}

// 格式化描述（用于显示）
function formatDescription(desc) {
    if (!desc) return '';
    return desc.replace(/<br\/>/g, '\n').replace(/<[^>]+>/g, '');
}

// 转换描述格式：将换行符转换为 <br/>
function convertNewlinesToBr(text) {
    if (!text) return '';
    // 先解码 HTML 实体
    let decoded = decodeHtmlEntities(text);
    // 将连续的换行符和制表符统一替换为单个换行（不处理普通空格）
    let normalized = decoded.replace(/[\r\n\t]+/g, '\n');
    // 去除首尾的空白字符
    normalized = normalized.trim();
    // 将换行符转换为 <br/>
    let converted = normalized.replace(/\n/g, '<br/>');
    // 去除连续的多个 <br/>，只保留一个
    converted = converted.replace(/(<br\/>)+/g, '<br/>');
    // 重新编码 HTML 实体（但保留 <br/>）
    return encodeHtmlEntities(converted).replace(/&lt;br\/&gt;/g, '<br/>');
}

// 切换产品选择
function toggleProductSelection(index, isSelected, card) {
    if (isSelected) {
        card.classList.add('card-selected');
        if (!selectedProducts.includes(index)) {
            selectedProducts.push(index);
        }
    } else {
        card.classList.remove('card-selected');
        selectedProducts = selectedProducts.filter(i => i !== index);
    }
}

// 全选
function selectAllProducts() {
    document.querySelectorAll('.product-checkbox').forEach((checkbox, index) => {
        checkbox.checked = true;
        const card = checkbox.closest('#products_list .card');
        if (card) {
            card.classList.add('card-selected');
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
        const card = checkbox.closest('#products_list .card');
        if (card) {
            card.classList.remove('card-selected');
        }
    });
    selectedProducts = [];
}

function filterProducts(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    const productCards = document.querySelectorAll('#products_list .card');
    
    productCards.forEach((card, index) => {
        const productName = card.querySelector('h4').textContent.toLowerCase();
        const checkbox = card.querySelector('.product-checkbox');
        
        if (productName.includes(term)) {
            card.style.display = '';
            if (checkbox) checkbox.disabled = false;
        } else {
            card.style.display = 'none';
            if (checkbox) {
                checkbox.disabled = true;
                checkbox.checked = false;
                card.classList.remove('card-selected');
                const cardIndex = parseInt(card.dataset.productIndex);
                selectedProducts = selectedProducts.filter(i => i !== cardIndex);
            }
        }
    });
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
    // 去除连续的多个 <br/>，只保留一个
    converted = converted.replace(/(<br\/>) +/g, '<br/>');
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
    
    // 优先使用浮动栏的分组选择
    let productGroupId = document.getElementById('floating_product_group_select')?.value;
    if (!productGroupId) {
        productGroupId = document.getElementById('second_level_select').value;
    }
    
    if (!productGroupId) {
        showMessage('请选择目标分组', 'error');
        return;
    }
    
    const priceBasis = document.getElementById('price_basis').value;
    const convertHtml = document.getElementById('convert_html_checkbox').checked;
    const autoConvertNewlines = document.getElementById('auto_convert_newlines_checkbox')?.checked || true;
    
    const profitType = parseInt(document.getElementById('profit_type').value) || 0;
    const profitPercent = parseFloat(document.getElementById('profit_percent').value) || 0;
    const renewProfitType = parseInt(document.getElementById('renew_profit_type').value) || 0;
    const renewProfitPercent = parseFloat(document.getElementById('renew_profit_percent').value) || 0;
    const upgradeProfitType = parseInt(document.getElementById('upgrade_profit_type').value) || 0;
    const upgradeProfitPercent = parseFloat(document.getElementById('upgrade_profit_percent').value) || 0;
    const autoSetup = document.getElementById('auto_setup_checkbox').checked ? 1 : 0;
    const certification = document.getElementById('certification_checkbox').checked ? 1 : 0;
    const sync = document.getElementById('sync_checkbox').checked ? 1 : 0;
    const mode = document.getElementById('mode').value || 'only_api';
    
    console.log('导入配置:', {
        convertHtml: convertHtml,
        autoConvertNewlines: autoConvertNewlines,
        productCount: selectedProducts.length,
        priceBasis: priceBasis,
        productGroupId: productGroupId,
        profitType: profitType,
        profitPercent: profitPercent,
        autoSetup: autoSetup,
        certification: certification,
        sync: sync,
        mode: mode
    });
    
    // 在前端处理 HTML 标签转换
    const importProducts = selectedProducts.map(index => {
        const product = allProducts[index];
        let description = product.description || '';
        
        // 根据用户选择决定是否转换 HTML 标签
        if (convertHtml) {
            description = convertHtmlDescription(description);
        }
        
        // 自动检测并转换换行符为 <br/>
        if (autoConvertNewlines) {
            description = convertNewlinesToBr(description);
        }
        
        return {
            id: '',
            supplier_id: selectedSupplier,
            mode: mode,
            upstream_product_id: product.id,
            name: product.name,
            profit_type: profitType,
            profit_percent: profitPercent,
            renew_profit_type: renewProfitType,
            renew_profit_percent: renewProfitPercent,
            upgrade_profit_type: upgradeProfitType,
            upgrade_profit_percent: upgradeProfitPercent,
            auto_setup: autoSetup,
            certification: certification,
            sync: sync,
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
                        item.className = `p-3 border text-sm ${result.success ? 'bg-neutral-50 border-neutral-200 text-neutral-700' : 'bg-neutral-100 border-neutral-300 text-neutral-900'}`;
                        item.textContent = `${result.success ? '✓' : '✗'} ${result.product_name}: ${result.message}`;
                        resultsDiv.appendChild(item);
                    });
                }
                
                // 如果还在导入中，继续轮询
                if (data.is_importing) {
                    setTimeout(poll, 1000);
                } else {
                    // 重置所有导入按钮状态
                    setButtonLoading('import_selected_btn', false);
                    setButtonLoading('import_upstream_btn', false);
                    
                    const msg = `导入完成！成功：${data.success_count}, 失败：${data.failed_count}`;
                    showMessage(msg + ' 如需导入到其他分组，请修改目标分组后再次点击导入即可', 'success');
                    
                    // 重置选择状态
                    deselectAllProducts();
                    document.getElementById('products_section').style.display = 'none';
                    
                    // 隐藏浮动操作栏
                    hideFloatingActionBar();
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
    configMessage.className = `message-box mt-4 ${type === 'success' ? 'success' : 'error'}`;
    configMessage.style.display = 'block';
    
    setTimeout(() => {
        configMessage.style.display = 'none';
        configMessage.textContent = '';
    }, 5000);
}

// ==================== 导入方式选择 ====================

// 选择全自动导入
function selectAutoImport() {
    const autoImportCard = document.getElementById('auto_import_card');
    const supplierImportCard = document.getElementById('supplier_import_card');
    const autoImportSection = document.getElementById('auto_import_section');
    const suppliersListSection = document.getElementById('suppliers_list_section');
    
    supplierImportCard.classList.remove('card-selected');
    supplierImportCard.style.borderColor = '';
    supplierImportCard.style.backgroundColor = '';
    
    autoImportCard.classList.add('card-selected');
    autoImportCard.style.borderColor = '#525252';
    autoImportCard.style.backgroundColor = '#f5f5f5';
    
    autoImportSection.classList.remove('hidden');
    suppliersListSection.classList.add('hidden');
    
    // 清除供应商导入的状态
    selectedSupplier = null;
    selectedProducts = [];
    allProducts = [];
    document.getElementById('products_section').style.display = 'none';
    document.getElementById('suppliers_list').innerHTML = '';
    hideFloatingActionBar();
    
    fetchUpstreamSuppliers();
}

// 选择供应商导入
function selectSupplierImport() {
    const autoImportCard = document.getElementById('auto_import_card');
    const supplierImportCard = document.getElementById('supplier_import_card');
    const autoImportSection = document.getElementById('auto_import_section');
    const suppliersListSection = document.getElementById('suppliers_list_section');
    
    autoImportCard.classList.remove('card-selected');
    autoImportCard.style.borderColor = '';
    autoImportCard.style.backgroundColor = '';
    
    supplierImportCard.classList.add('card-selected');
    supplierImportCard.style.borderColor = '#525252';
    supplierImportCard.style.backgroundColor = '#f5f5f5';
    
    suppliersListSection.classList.remove('hidden');
    autoImportSection.classList.add('hidden');
    
    // 清除全自动导入的状态
    selectedUpstreamGroups = [];
    selectedUpstreamSupplier = null;
    upstreamData = null;
    document.getElementById('upstream_suppliers_list').innerHTML = '';
    document.getElementById('upstream_first_groups_list').innerHTML = '';
    document.getElementById('upstream_second_groups_list').innerHTML = '';
    document.getElementById('upstream_groups_section').classList.add('hidden');
    
    // 加载供应商列表
    loadSuppliers();
}

// ==================== 全自动导入功能 ====================

// 获取上游供应商列表
async function fetchUpstreamSuppliers() {
    const loadingIndicator = document.getElementById('upstream_loading_indicator');
    const suppliersSection = document.getElementById('upstream_suppliers_section');
    const groupsSection = document.getElementById('upstream_groups_section');
    
    loadingIndicator.classList.remove('hidden');
    suppliersSection.classList.add('hidden');
    groupsSection.classList.add('hidden');
    
    try {
        const response = await fetch('/api/upstream/suppliers');
        const result = await response.json();
        
        if (result.status === 200) {
            upstreamSuppliersList = result.data || [];
            renderUpstreamSuppliers(upstreamSuppliersList);
            suppliersSection.classList.remove('hidden');
            showUpstreamMessage('获取成功', 'success');
        } else {
            showUpstreamMessage(result.msg || '获取失败', 'error');
        }
    } catch (error) {
        showUpstreamMessage('获取失败：' + error.message, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// 渲染上游供应商列表
function renderUpstreamSuppliers(suppliers) {
    const suppliersList = document.getElementById('upstream_suppliers_list');
    if (!suppliersList) return;
    
    suppliersList.innerHTML = '';
    
    suppliers.forEach(supplier => {
        const card = document.createElement('div');
        card.className = 'card p-5 cursor-pointer';
        card.dataset.supplierUrl = supplier.url;
        card.innerHTML = `
            <h4 class="text-sm font-semibold text-neutral-900 mb-2">${supplier.name}</h4>
            <p class="text-xs text-neutral-500 mb-1 break-all">URL: ${supplier.url}</p>
            <p class="text-xs text-neutral-500">已导入产品数：${supplier.product_num || 0}</p>
        `;
        
        card.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            selectUpstreamSupplier(supplier, this);
        });
        
        suppliersList.appendChild(card);
    });
}

// 选择上游供应商
function selectUpstreamSupplier(supplier, card) {
    selectedUpstreamSupplier = supplier;
    selectedUpstreamGroups = [];
    
    document.querySelectorAll('#upstream_suppliers_list .card').forEach(c => {
        c.classList.remove('card-selected');
        c.style.borderColor = '';
        c.style.backgroundColor = '';
    });
    
    card.classList.add('card-selected');
    card.style.borderColor = '#525252';
    card.style.backgroundColor = '#f5f5f5';
    
    fetchUpstreamProducts(supplier.url);
}

// 获取上游产品数据
async function fetchUpstreamProducts(upstreamUrl) {
    const loadingIndicator = document.getElementById('upstream_loading_indicator');
    const groupsSection = document.getElementById('upstream_groups_section');
    
    loadingIndicator.classList.remove('hidden');
    groupsSection.classList.add('hidden');
    
    try {
        const response = await fetch('/api/upstream/fetch', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({upstream_url: upstreamUrl})
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            upstreamData = result.data;
            renderUpstreamGroups(upstreamData);
            groupsSection.classList.remove('hidden');
            showUpstreamMessage('获取成功', 'success');
            
            loadLocalFirstLevelGroups();
        } else {
            showUpstreamMessage(result.msg || '获取失败', 'error');
        }
    } catch (error) {
        showUpstreamMessage('获取失败：' + error.message, 'error');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

// 加载本地一级分组
async function loadLocalFirstLevelGroups() {
    try {
        const response = await fetch('/api/groups');
        const result = await response.json();
        
        if (result.status === 200) {
            const select = document.getElementById('upstream_first_level_select');
            select.innerHTML = '<option value="0">不选择（将自动创建一级分组）</option>';
            
            result.data.first_level.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('加载本地分组失败:', error);
    }
}

// 渲染上游分组
function renderUpstreamGroups(data) {
    const firstGroupsList = document.getElementById('upstream_first_groups_list');
    const secondGroupsList = document.getElementById('upstream_second_groups_list');
    
    if (!firstGroupsList || !secondGroupsList) return;
    
    firstGroupsList.innerHTML = '';
    secondGroupsList.innerHTML = '';
    
    const firstGroups = data.first_group || [];
    
    firstGroups.forEach(firstGroup => {
        const secondGroups = firstGroup.group || [];
        
        const firstCard = document.createElement('div');
        firstCard.className = 'p-3 border border-neutral-200 bg-white hover:border-neutral-400 cursor-pointer transition-colors';
        firstCard.dataset.firstId = firstGroup.id;
        firstCard.innerHTML = `
            <div class="flex items-center gap-2">
                <input type="checkbox" class="upstream-first-checkbox checkbox-field" data-first-id="${firstGroup.id}">
                <span class="text-sm font-medium text-neutral-900">${firstGroup.name}</span>
                <span class="text-xs text-neutral-500">(${secondGroups.length} 个二级分组)</span>
            </div>
        `;
        
        const checkbox = firstCard.querySelector('.upstream-first-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleUpstreamFirstGroup(firstGroup.id, firstGroup.name, e.target.checked, firstCard);
        });
        
        firstCard.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
                checkbox.checked = !checkbox.checked;
                toggleUpstreamFirstGroup(firstGroup.id, firstGroup.name, checkbox.checked, firstCard);
            }
        });
        
        firstGroupsList.appendChild(firstCard);
        
        secondGroups.forEach(secondGroup => {
            const secondCard = document.createElement('div');
            secondCard.className = 'p-3 border border-neutral-200 bg-white hover:border-neutral-400 cursor-pointer transition-colors';
            secondCard.dataset.secondId = secondGroup.id;
            secondCard.dataset.firstId = firstGroup.id;
            secondCard.innerHTML = `
                <div class="flex items-center gap-2">
                    <input type="checkbox" class="upstream-second-checkbox checkbox-field" data-second-id="${secondGroup.id}" data-first-id="${firstGroup.id}">
                    <span class="text-sm font-medium text-neutral-900">${secondGroup.name}</span>
                    <span class="text-xs text-neutral-500">(${(secondGroup.products || []).length} 个产品)</span>
                </div>
            `;
            
            const secCheckbox = secondCard.querySelector('.upstream-second-checkbox');
            secCheckbox.addEventListener('change', (e) => {
                e.stopPropagation();
                toggleUpstreamSecondGroup(
                    secondGroup.id, 
                    secondGroup.name, 
                    firstGroup.id, 
                    firstGroup.name, 
                    e.target.checked, 
                    secondCard
                );
            });
            
            secondCard.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    secCheckbox.checked = !secCheckbox.checked;
                    toggleUpstreamSecondGroup(
                        secondGroup.id, 
                        secondGroup.name, 
                        firstGroup.id, 
                        firstGroup.name, 
                        secCheckbox.checked, 
                        secondCard
                    );
                }
            });
            
            secondGroupsList.appendChild(secondCard);
        });
    });
}

// 切换一级分组选择
function toggleUpstreamFirstGroup(firstId, firstName, isSelected, card) {
    const firstLevelSelect = document.getElementById('upstream_first_level_select');
    
    if (isSelected) {
        document.querySelectorAll('.upstream-second-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.p-3').classList.remove('card-selected');
            cb.closest('.p-3').style.borderColor = '';
            cb.closest('.p-3').style.backgroundColor = '';
        });
        selectedUpstreamGroups = selectedUpstreamGroups.filter(g => g.second_id);
        
        card.classList.add('card-selected');
        card.style.borderColor = '#525252';
        card.style.backgroundColor = '#f5f5f5';
        if (!selectedUpstreamGroups.find(g => g.first_id === firstId && !g.second_id)) {
            selectedUpstreamGroups.push({first_id: firstId, first_name: firstName});
        }
        
        firstLevelSelect.value = '0';
        firstLevelSelect.disabled = true;
    } else {
        card.classList.remove('card-selected');
        card.style.borderColor = '';
        card.style.backgroundColor = '';
        selectedUpstreamGroups = selectedUpstreamGroups.filter(g => !(g.first_id === firstId && !g.second_id));
        
        if (selectedUpstreamGroups.length === 0) {
            firstLevelSelect.disabled = false;
        }
    }
}

// 切换二级分组选择
function toggleUpstreamSecondGroup(secondId, secondName, firstId, firstName, isSelected, card) {
    const firstLevelSelect = document.getElementById('upstream_first_level_select');
    
    if (isSelected) {
        document.querySelectorAll('.upstream-first-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.p-3').classList.remove('card-selected');
            cb.closest('.p-3').style.borderColor = '';
            cb.closest('.p-3').style.backgroundColor = '';
        });
        selectedUpstreamGroups = selectedUpstreamGroups.filter(g => !g.second_id);
        
        card.classList.add('card-selected');
        card.style.borderColor = '#525252';
        card.style.backgroundColor = '#f5f5f5';
        if (!selectedUpstreamGroups.find(g => g.second_id === secondId)) {
            selectedUpstreamGroups.push({
                first_id: firstId, 
                first_name: firstName,
                second_id: secondId, 
                second_name: secondName
            });
        }
        
        firstLevelSelect.disabled = false;
    } else {
        card.classList.remove('card-selected');
        card.style.borderColor = '';
        card.style.backgroundColor = '';
        selectedUpstreamGroups = selectedUpstreamGroups.filter(g => g.second_id !== secondId);
        
        if (selectedUpstreamGroups.length === 0) {
            firstLevelSelect.disabled = false;
        }
    }
}

// 全自动导入
async function importUpstreamAuto() {
    if (selectedUpstreamGroups.length === 0) {
        showUpstreamMessage('请至少选择一个分组', 'error');
        return;
    }
    
    if (!selectedUpstreamSupplier || !selectedUpstreamSupplier.url) {
        showUpstreamMessage('请选择上游供应商', 'error');
        return;
    }
    
    const upstreamUrl = selectedUpstreamSupplier.url;
    const supplierId = selectedUpstreamSupplier.id;
    const firstLevelGroupId = parseInt(document.getElementById('upstream_first_level_select').value) || 0;
    const priceBasis = document.getElementById('upstream_price_basis').value;
    const convertHtml = document.getElementById('upstream_convert_html_checkbox')?.checked ?? true;
    const autoConvertNewlines = document.getElementById('upstream_auto_convert_newlines_checkbox')?.checked ?? true;
    
    const profitType = parseInt(document.getElementById('upstream_profit_type').value) || 0;
    const profitPercent = parseFloat(document.getElementById('upstream_profit_percent').value) || 0;
    const renewProfitType = parseInt(document.getElementById('upstream_renew_profit_type').value) || 0;
    const renewProfitPercent = parseFloat(document.getElementById('upstream_renew_profit_percent').value) || 0;
    const upgradeProfitType = parseInt(document.getElementById('upstream_upgrade_profit_type').value) || 0;
    const upgradeProfitPercent = parseFloat(document.getElementById('upstream_upgrade_profit_percent').value) || 0;
    const autoSetup = document.getElementById('upstream_auto_setup_checkbox').checked ? 1 : 0;
    const certification = document.getElementById('upstream_certification_checkbox').checked ? 1 : 0;
    const sync = document.getElementById('upstream_sync_checkbox').checked ? 1 : 0;
    const mode = document.getElementById('upstream_mode').value || 'only_api';
    
    const importBtn = document.getElementById('import_upstream_btn');
    setButtonLoading('import_upstream_btn', true);
    
    try {
        const response = await fetch('/api/upstream/import_auto', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                upstream_url: upstreamUrl,
                supplier_id: supplierId,
                selected_groups: selectedUpstreamGroups,
                first_level_group_id: firstLevelGroupId,
                price_basis: priceBasis,
                convert_html: convertHtml,
                auto_convert_newlines: autoConvertNewlines,
                profit_type: profitType,
                profit_percent: profitPercent,
                renew_profit_type: renewProfitType,
                renew_profit_percent: renewProfitPercent,
                upgrade_profit_type: upgradeProfitType,
                upgrade_profit_percent: upgradeProfitPercent,
                auto_setup: autoSetup,
                certification: certification,
                sync: sync,
                mode: mode
            })
        });
        
        const result = await response.json();
        
        if (result.status === 200) {
            // 显示进度区域
            const progressSection = document.getElementById('progress_section');
            if (progressSection) {
                progressSection.style.display = 'block';
                progressSection.scrollIntoView({ behavior: 'smooth' });
            }
            
            showUpstreamMessage('开始导入，请稍候...', 'success');
            
            // 轮询进度
            pollImportProgress();
        } else {
            showUpstreamMessage(result.msg || '导入失败', 'error');
            setButtonLoading('import_upstream_btn', false);
        }
    } catch (error) {
        showUpstreamMessage('导入失败：' + error.message, 'error');
        setButtonLoading('import_upstream_btn', false);
    }
}

function showUpstreamMessage(msg, type) {
    const messageDiv = document.getElementById('upstream_message');
    if (!messageDiv) return;
    
    messageDiv.textContent = msg;
    messageDiv.className = `message-box mt-4 ${type === 'success' ? 'success' : 'error'}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
        messageDiv.textContent = '';
    }, 5000);
}
