# ZJMF-v10-product-importer

智简魔方业务管理系统V10的上游产品批量导入Web工具，解决官方批量导入后产品简介为空的问题。

## 环境

- Python 3.8+
- 已部署的ZJMF V10系统

## 运行

```bash
pip install -r requirements.txt
python app.py
```

监听`0.0.0.0:5000`，浏览器打开`http://localhost:5000`。

## 使用

1. 填写站点URL、后台路径、用户名与密码，保存配置并登录。
2. 选择供应商导入或全自动导入。
3. 选择目标分组、上游供应商与产品。
4. 设置定价模式、利润比例和导入选项后开始导入。

导入按倒序处理；可自动转换`<li>`标签与换行符。配置保存在`config.yaml`。

## 接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET/POST | `/api/config` | 配置管理 |
| POST | `/api/login` | 登录 |
| GET | `/api/groups` | 获取分组 |
| GET | `/api/suppliers` | 供应商列表 |
| GET | `/api/products` | 供应商产品列表 |
| POST | `/api/import` | 供应商模式导入 |
| GET | `/api/import/progress` | 导入进度 |
| POST | `/api/upstream/fetch` | 获取上游产品 |
| POST | `/api/upstream/import_auto` | 全自动导入 |

## License

AGPL-3.0，见`LICENSE`。
