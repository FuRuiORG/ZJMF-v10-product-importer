# ZJMF v10 上游产品批量导入工具（Web 版）

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/FuRuiORG/ZJMF-Product-Importer)

## 项目简介

**ZJMF v10 上游产品批量导入工具 Web 版** 是专为 [智简魔方业务管理系统 V10](https://www.idcsmart.com/business.html) 开发的可视化批量导入工具。
由于官方默认的批量导入会导致产品简介为空，故开发此应用
若有问题，欢迎提交issues

### 核心特性

- 可视化界面 - 基于 Web 的直观操作界面，无需命令行
- 批量导入 - 支持上游产品批量导入，自动处理产品描述、价格、配置
- API 驱动 - 基于 ZJMF v10 官方开放 API，安全稳定
- 自动化处理 - 自动转换 HTML 标签（`<li>` → `<br/>`）
- 灵活配置 - 支持自定义定价模式（原价/成本价）
- 实时进度 - 实时显示导入进度和结果
- 配置持久化 - 配置自动保存，下次使用无需重新填写

## 适用场景

- IDC 服务商批量导入上游云产品
- 云代理商批量管理产品库
- 需要可视化操作界面的场景
- 定时同步上游产品数据

## 环境要求

- **Python**: 3.8 或更高版本
- **依赖库**: 详见 `requirements.txt`
- **ZJMF v10**: 已部署的智简魔方业务管理系统 V10

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动 Web 应用

```bash
python app.py
```

应用将在 `http://localhost:5000` 启动

### 3. 使用向导

#### 第一步：配置系统
1. 打开浏览器访问 `http://localhost:5000`
2. 填写配置信息：
   - **站点 URL**：例如 `https://xxx.furll.cn`
   - **后台路径**：例如 `/xxxx/`
   - **用户名**：你的后台用户名
   - **密码**：你的后台密码
3. 点击"保存配置"按钮
4. 点击"登录"按钮登录系统

#### 第二步：选择目标分组
1. 登录成功后，系统会自动加载分组列表
2. 从下拉框选择一级分组
3. 选择对应的二级分组（产品将导入到此分组）
4. 点击"加载供应商"按钮

#### 第三步：选择供应商
1. 在供应商列表中选择要导入的供应商
2. 点击供应商卡片即可选中（绿色边框表示已选中）
3. 点击"加载产品"按钮

#### 第四步：选择产品
1. 在产品列表中选择要导入的产品
2. 支持多选：
   - 点击产品卡片勾选/取消勾选
   - 使用"全选"按钮选择所有产品
   - 使用"取消全选"按钮清除所有选择
3. 选择定价模式：
   - **上游原价（standard）**：按上游原价销售
   - **成本价（agent）**：按成本价销售
4. 可选：勾选"转换 HTML 标签"自动处理产品描述

#### 第五步：导入产品
1. 点击"导入选中产品"按钮
2. 系统会显示导入进度：
   - 进度条显示当前进度
   - 成功/失败计数
   - 每个产品的导入结果
3. **导入顺序**：系统会从你选择的最后一个产品开始向前倒序导入

### 4. 查看导入结果

导入完成后，可在页面底部查看：
- 成功导入数量
- 失败数量
- 详细导入结果列表

## 项目结构

```
ZJMF-Product-Importer/
├── app.py                  # Flask 主应用
├── config.yaml            # 配置文件（自动生成）
├── requirements.txt       # Python 依赖
├── src/
│   ├── config_manager.py  # 配置管理器
│   └── api_client.py      # API 客户端
├── templates/
│   └── index.html         # 主页面模板
├── static/
│   ├── css/
│   │   └── style.css      # 样式文件（可选）
│   └── js/
│       └── main.js        # 前端交互逻辑
└── logs/                  # 日志目录
```

## 核心功能说明

### 已实现功能
- 可视化配置界面
- 自动登录和 JWT 管理
- 产品分组树形展示（一级/二级分组）
- 供应商列表展示
- 产品列表预览和选择
- 批量导入产品（倒序导入）
- HTML 标签自动转换（`<li>` → `<br/>`）
- 实时导入进度显示
- 定价模式选择
- 配置自动保存

### 导入参数说明
导入产品时自动使用以下参数：
- `auto_setup`: 1（自动开通）
- `certification`: 1（需要实名认证）

## 访问地址

启动应用后，可以通过以下地址访问：
- 本地访问：`http://localhost:5000`
- 局域网访问：`http://你的IP:5000`

## 注意事项

1. **首次使用**：请先保存配置再登录
2. **网络要求**：确保能访问你的 ZJMF v10 系统
3. **导入顺序**：批量导入采用倒序方式（从后往前，v10产品页面排序为正序）
4. **HTML 转换**：自动将 `<li>xxx</li>` 转换为 `xxx<br/>`，避免格式问题
5. **配置文件**：保存在 `config.yaml`，可手动编辑

## API 接口文档

### 主要接口
- `GET/POST /api/config` - 配置管理
- `POST /api/login` - 登录
- `GET /api/groups` - 获取分组（一级/二级）
- `GET /api/suppliers` - 获取供应商列表
- `GET /api/products?supplier_id=xxx` - 获取供应商产品列表
- `POST /api/import` - 导入产品
- `GET /api/import/progress` - 获取导入进度

## 常见问题

### 登录失败
- 检查站点 URL 和后台路径是否正确
- 确认用户名密码正确
- 确保网络能访问您的 V10 业务系统

### 无法加载分组/供应商/产品
- 确认已成功登录
- 检查 JWT 是否有效
- 查看浏览器控制台错误信息

### 导入失败
- 确认选择了目标分组
- 确认选择了供应商
- 查看导入结果中的具体错误信息

### 产品介绍显示异常
- 勾选"转换 HTML 标签"选项
- 系统会自动处理 `<li>` 等 HTML 标签

## 开发说明

### 运行开发服务器
```bash
python app.py
```

应用会在 `http://0.0.0.0:5000` 启动（支持局域网访问）

### 配置文件格式
```yaml
site_url: "https://mofang.furll.cn"
admin_path: "/zduzslsr/"
username: "your_username"
password: "your_password"
```

### 技术栈
- **后端**: Python + Flask
- **前端**: HTML + Tailwind CSS + Vanilla JavaScript
- **API**: RESTful API + JWT 认证

## 开源协议

本项目采用 **AGPL-3.0** 协议开源。详见 [LICENSE](LICENSE) 文件。

## 致谢

- [智简魔方业务管理系统](https://www.idcsmart.com/business.html) - 提供强大的业务管理核心
- [ZJMF-CBAP](https://github.com/idcsmart/ZJMF-CBAP) - 开源业务管理系统源码
- [FurryCloud](https://cloud.furll.cn) - 提供技术支持

## 联系方式

- **GitHub**: [@FuRuiORG](https://github.com/FuRuiORG)
- **项目地址**: [https://github.com/FuRuiORG/ZJMF-Product-Importer](https://github.com/FuRuiORG/ZJMF-Product-Importer)
- **QQ群**: [311971756](https://qm.qq.com/cgi-bin/qm/qr?k=9eDc6BRGgWBY-MVvMHNeqbbZ0Lm06TLK&jump_from=webapi&authKey=MHaSMvyIX2syGkEPKxtR3poK+0GhivmwDgieEWEiT5bBIRI+yLpRtoz2WzJvWQVA)
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=FuRuiORG/ZJMF-Product-Importer&type=Date)](https://star-history.com/#FuRuiORG/ZJMF-Product-Importer&Date)

---

**免责声明**: 本项目为第三方开发工具，与智简魔方官方无关。使用本工具造成的任何数据丢失或系统问题，由使用者自行承担。建议在生产环境使用前先备份数据。
