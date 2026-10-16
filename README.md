# ZJMF v10 上游产品批量导入工具

> [!NOTE]
>本项目采用 Vibe Coding 方式开发，即通过自然语言提示驱动 AI 生成与迭代代码。
>请酌情使用

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/FuRuiORG/ZJMF-Product-Importer)

## 项目简介

**ZJMF v10 上游产品批量导入工具 Web 版** 是专为 [智简魔方业务管理系统 V10](https://www.idcsmart.com/business.html) 开发的可视化批量导入工具。
由于官方默认的批量导入会导致产品简介为空，故开发此应用
若有问题，欢迎提交issues

### 核心特性

- 可视化界面 - 基于 Web 的直观操作界面，无需命令行
- 双模式导入 - 支持供应商模式和全自动导入模式
- 批量导入 - 支持上游产品批量导入，自动处理产品描述、价格、配置
- API 驱动 - 基于 ZJMF v10 官方开放 API，安全稳定
- 自动化处理 - 自动转换 HTML 标签（`<li>` → `<br/>`）和换行符
- 灵活定价 - 支持原价/成本价模式，可设置利润百分比
- 实时进度 - 实时显示导入进度和结果
- 配置持久化 - 配置自动保存，下次使用无需重新填写
- 自动分组 - 全自动模式下可自动创建产品分组

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

#### 第二步：选择导入模式

登录成功后，可选择两种导入模式：

**模式一：供应商导入模式**
1. 选择目标分组（一级分组 + 二级分组）
2. 点击"加载供应商"按钮
3. 在供应商列表中选择要导入的供应商
4. 点击"加载产品"按钮
5. 选择要导入的产品（支持全选/取消全选）
6. 选择定价模式和导入选项
7. 点击"导入选中产品"

**模式二：全自动导入模式**
1. 选择上游供应商（系统自动获取供应商列表）
2. 系统自动加载上游产品分组和产品列表
3. 选择要导入的分组（支持按一级/二级分组筛选）
4. 选择目标分组位置：
   - 选择已有的一级分组作为父分组
   - 或让系统自动创建新分组
5. 配置定价和利润设置：
   - 定价模式：上游原价 / 成本价
   - 利润设置：支持一次性、续费、升级三种利润类型
   - 利润百分比：可自定义利润比例
6. 配置导入选项：
   - 转换 HTML 标签（`<li>` → `<br/>`）
   - 自动转换换行符（换行 → `<br/>`）
   - 自动开通、实名认证、同步模式等
7. 点击"开始导入"

#### 第三步：查看导入结果

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
│   │   └── style.css      # 样式文件
│   └── js/
│       └── main.js        # 前端交互逻辑
└── logs/                  # 日志目录
```

## 核心功能说明

### 已实现功能

#### 基础功能
- 可视化配置界面
- 自动登录和 JWT 管理
- 产品分组树形展示（一级/二级分组）
- 供应商列表展示
- 产品列表预览和选择
- 批量导入产品（倒序导入）
- 实时导入进度显示
- 配置自动保存

#### 全自动导入功能
- 从上游 URL 自动获取产品数据
- 自动创建产品分组（一级/二级）
- 按分组批量导入产品
- 支持分组筛选和选择

#### 文本处理功能
- HTML 标签自动转换（`<li>` → `<br/>`）
- 换行符自动转换（`\n` → `<br/>`）
- HTML 实体解码

#### 定价功能
- 定价模式选择（原价/成本价）
- 利润百分比设置
- 续费利润设置
- 升级利润设置

### 导入参数说明
导入产品时支持以下参数：
- `auto_setup`: 自动开通（默认 1）
- `certification`: 需要实名认证（默认 1）
- `sync`: 同步模式（默认 0）
- `mode`: 导入模式（默认 only_api）

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
6. **全自动导入**：需要上游供应商开放产品 API 接口

## API 接口文档

### 配置与登录
- `GET/POST /api/config` - 配置管理
- `POST /api/login` - 登录

### 分组管理
- `GET /api/groups` - 获取分组（一级/二级）
- `POST /api/upstream/create_group` - 创建产品分组

### 供应商与产品
- `GET /api/suppliers` - 获取供应商列表
- `GET /api/products?supplier_id=xxx` - 获取供应商产品列表
- `GET /api/upstream/suppliers` - 获取上游供应商列表（全自动导入）

### 导入功能
- `POST /api/import` - 导入产品（供应商模式）
- `GET /api/import/progress` - 获取导入进度
- `POST /api/upstream/fetch` - 获取上游产品数据
- `POST /api/upstream/import_auto` - 全自动导入

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
- 勾选"自动转换换行符"选项
- 系统会自动处理 `<li>` 等 HTML 标签和换行符

### 全自动导入无法获取产品
- 确认上游供应商已配置正确的产品 API URL
- 检查网络是否能访问上游 API
- 确认上游 API 返回数据格式正确

## 开发说明

### 运行开发服务器
```bash
python app.py
```

应用会在 `http://0.0.0.0:5000` 启动（支持局域网访问）

### 配置文件格式
```yaml
site_url: "https://xxx.furll.cn"
admin_path: "/zduzslsr/"
username: "your_username"
password: "your_password"
```

### 技术栈
- **后端**: Python + Flask
- **前端**: HTML + Tailwind CSS + Vanilla JavaScript
- **API**: RESTful API + JWT 认证
- **配置**: YAML

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

[![Star History Chart](https://api.star-history.com/image?repos=FuRuiORG/ZJMF-v10-product-importer&type=date&legend=top-left)](https://www.star-history.com/?repos=FuRuiORG%2FZJMF-v10-product-importer&type=date&legend=bottom-right)
---

**免责声明**: 本项目为第三方开发工具，与智简魔方官方无关。使用本工具造成的任何数据丢失或系统问题，由使用者自行承担。建议在生产环境使用前先备份数据。
