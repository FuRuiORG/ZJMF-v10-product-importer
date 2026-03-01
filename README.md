# ZJMF v10 上游产品批量导入工具

[![Python](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License](https://img.shields.io/badge/license-AGPL--3.0-green.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/FuRuiORG/ZJMF-Product-Importer)

## 📖 项目简介

**ZJMF v10 上游产品批量导入工具** 是专为 [智简魔方业务管理系统 V10](https://www.idcsmart.com/business.html) 开发的 Python 批量导入脚本。

### ✨ 核心特性

- 🚀 **批量导入** - 支持上游产品批量导入，解决官方批量导入无法导入产品介绍的痛点
- 🔌 **API 驱动** - 基于 ZJMF v10 官方开放 API，安全稳定
- 📦 **自动化处理** - 自动处理产品描述、价格、配置等完整信息
- 🔧 **灵活配置** - 支持自定义配置文件，适配不同业务场景
- 📊 **数据校验** - 导入前自动校验数据完整性，避免错误数据
- 📝 **详细日志** - 完整的操作日志记录，便于问题追踪

## 🎯 适用场景

- IDC 服务商批量导入上游云产品
- 云代理商批量管理产品库
- 需要批量导入产品详细介绍的场景
- 定时同步上游产品数据

## 📋 环境要求

- **Python**: 3.8 或更高版本
- **依赖库**: 详见 `requirements.txt`
- **ZJMF v10**: 已部署的智简魔方业务管理系统 V10

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置参数

复制配置文件模板：

```bash
cp config.example.yaml config.yaml
```

编辑 `config.yaml` 配置以下信息：

```yaml
# ZJMF v10 系统配置
zjmf:
  base_url: "http://your-domain.com"
  api_token: "your-api-token"
  
# 上游产品数据源
source:
  type: "excel"  # 支持 excel/csv/api
  file_path: "products.xlsx"
  
# 导入配置
import:
  batch_size: 50  # 每批次导入数量
  skip_existing: true  # 跳过已存在产品
  update_description: true  # 更新产品介绍
```

### 3. 准备产品数据

支持 Excel/CSV 格式，包含以下字段：

| 字段 | 说明 | 必填 |
|------|------|------|
| product_name | 产品名称 | ✅ |
| product_group | 产品分组 | ✅ |
| price | 价格 | ✅ |
| description | 产品介绍 | ✅ |
| specifications | 产品规格 | ❌ |
| stock | 库存 | ❌ |

### 4. 执行导入

```bash
python main.py
```

### 5. 查看日志

导入日志保存在 `logs/` 目录，包含：

- ✅ 成功导入记录
- ❌ 失败记录及原因
- ⚠️ 警告信息

## 📁 项目结构

```
ZJMF-Product-Importer/
├── main.py                 # 主程序入口
├── config.example.yaml     # 配置文件模板
├── requirements.txt        # Python 依赖
├── src/
│   ├── importer.py        # 核心导入逻辑
│   ├── api_client.py      # ZJMF API 客户端
│   ├── data_parser.py     # 数据解析器
│   └── validator.py       # 数据校验器
├── logs/                   # 日志目录
├── samples/                # 示例数据文件
└── tests/                  # 测试用例
```

## 🔧 高级用法

### 命令行参数

```bash
# 指定配置文件
python main.py --config ./my-config.yaml

# 仅验证数据，不执行导入
python main.py --validate-only

# 导入特定分组
python main.py --group "云服务器"

# 详细输出模式
python main.py --verbose
```

### 定时任务

使用 cron 定时同步上游产品：

```bash
# 每天凌晨 2 点执行
0 2 * * * cd /path/to/ZJMF-Product-Importer && python main.py >> logs/cron.log 2>&1
```

### Docker 部署

```bash
# 构建镜像
docker build -t zjmf-importer .

# 运行容器
docker run --rm \
  -v $(pwd)/config.yaml:/app/config.yaml \
  -v $(pwd)/products.xlsx:/app/products.xlsx \
  zjmf-importer
```

## 🛠️ 开发指南

### 添加新的数据源

继承 `BaseDataSource` 类：

```python
from src.data_parser import BaseDataSource

class MyDataSource(BaseDataSource):
    def parse(self, file_path):
        # 实现你的解析逻辑
        pass
```

### 自定义数据转换

```python
def custom_transform(product_data):
    # 在导入前处理数据
    product_data['name'] = f"[定制] {product_data['name']}"
    return product_data
```

## 📚 API 文档

### ZJMF v10 相关 API

- [产品管理 API](https://www.idcsmart.com/wiki_list/930.html)
- [插件开发文档](https://www.idcsmart.com/wiki_list/1257.html)
- [Hook 文档](https://www.idcsmart.com/wiki_list/925.html)

### 核心方法

#### `Importer.batch_import(products)`

批量导入产品列表

**参数:**
- `products` (list): 产品数据列表

**返回:**
- `dict`: 导入结果统计

#### `Validator.validate_product(product)`

校验单个产品数据

**参数:**
- `product` (dict): 产品数据

**返回:**
- `tuple`: (是否有效，错误信息)

## 🐛 常见问题

### 1. API Token 获取

登录 ZJMF v10 后台，在 **系统设置 > API 管理** 中生成 API Token。

### 2. 导入失败

检查日志文件 `logs/import.log`，常见原因：
- API Token 无效
- 网络连接问题
- 产品数据格式错误
- 产品分组不存在

### 3. 产品介绍未导入

确保配置文件中设置 `update_description: true`，并检查产品描述字段是否为空。

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 开源协议

本项目采用 **AGPL-3.0** 协议开源。详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [智简魔方业务管理系统](https://www.idcsmart.com/business.html) - 提供强大的业务管理核心
- [ZJMF-CBAP](https://github.com/idcsmart/ZJMF-CBAP) - 开源业务管理系统源码

## 📬 联系方式

- **GitHub**: [@FuRuiORG](https://github.com/FuRuiORG)
- **项目地址**: [https://github.com/FuRuiORG/ZJMF-Product-Importer](https://github.com/FuRuiORG/ZJMF-Product-Importer)

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=FuRuiORG/ZJMF-Product-Importer&type=Date)](https://star-history.com/#FuRuiORG/ZJMF-Product-Importer&Date)

---

**⚠️ 免责声明**: 本项目为第三方开发工具，与智简魔方官方无关。使用本工具造成的任何数据丢失或系统问题，由使用者自行承担。建议在生产环境使用前先备份数据。
