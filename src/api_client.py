import re
from typing import List, Dict, Any
import requests


class APIClient:
    """ZJMF API 客户端"""
    
    def __init__(self, base_url: str, admin_path: str):
        self.base_url = base_url.rstrip('/')
        self.admin_path = admin_path.strip('/')
        self.api_base = f"{self.base_url}/{self.admin_path}"
        self.jwt_token: str = ""
        self.session = requests.Session()
    
    def _get_headers(self) -> Dict[str, str]:
        """获取请求头"""
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'ZJMF-Product-Importer/1.0'
        }
        if self.jwt_token:
            headers['Authorization'] = f'Bearer {self.jwt_token}'
        return headers
    
    def login(self, username: str, password: str) -> tuple[bool, str]:
        """登录获取 JWT"""
        url = f"{self.api_base}/v1/login"
        data = {
            "name": username,
            "password": password,
            "remember_password": 0
        }
        
        try:
            response = self.session.post(url, json=data, headers={'Content-Type': 'application/json'})
            result = response.json()
            
            if result.get('status') == 200:
                self.jwt_token = result.get('data', {}).get('jwt', '')
                return True, "登录成功"
            else:
                return False, result.get('msg', '登录失败')
        except Exception as e:
            return False, f"请求失败：{str(e)}"
    
    def get_first_level_groups(self) -> tuple[bool, str, List[Dict]]:
        """获取一级分组"""
        url = f"{self.api_base}/v1/product/group/first"
        
        try:
            response = self.session.get(url, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                groups = result.get('data', {}).get('list', [])
                return True, "获取成功", groups
            else:
                return False, result.get('msg', '获取失败'), []
        except Exception as e:
            return False, f"请求失败：{str(e)}", []
    
    def get_second_level_groups(self) -> tuple[bool, str, List[Dict]]:
        """获取二级分组"""
        url = f"{self.api_base}/v1/product/group/second"
        
        try:
            response = self.session.get(url, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                groups = result.get('data', {}).get('list', [])
                return True, "获取成功", groups
            else:
                return False, result.get('msg', '获取失败'), []
        except Exception as e:
            return False, f"请求失败：{str(e)}", []
    
    def get_suppliers(self, page: int = 1, limit: int = 1000) -> tuple[bool, str, List[Dict]]:
        """获取供应商列表"""
        url = f"{self.api_base}/v1/supplier"
        params = {"page": page, "limit": limit}
        
        try:
            response = self.session.get(url, params=params, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                suppliers = result.get('data', {}).get('list', [])
                return True, "获取成功", suppliers
            else:
                return False, result.get('msg', '获取失败'), []
        except Exception as e:
            return False, f"请求失败：{str(e)}", []
    
    def check_supplier_status(self, supplier_id: int) -> tuple[bool, str]:
        """检查供应商状态"""
        url = f"{self.api_base}/v1/supplier/{supplier_id}/status"
        
        try:
            response = self.session.get(url, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                return True, "供应商可用"
            else:
                return False, result.get('msg', '供应商不可用')
        except Exception as e:
            return False, f"请求失败：{str(e)}"
    
    def get_supplier_products(self, supplier_id: int) -> tuple[bool, str, List[Dict], str]:
        """获取供应商产品列表"""
        url = f"{self.api_base}/v1/supplier/{supplier_id}/product"
        
        try:
            response = self.session.get(url, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                products = result.get('data', {}).get('list', [])
                currency_code = result.get('data', {}).get('currency_code', 'CNY')
                return True, "获取成功", products, currency_code
            else:
                return False, result.get('msg', '获取失败'), [], 'CNY'
        except Exception as e:
            return False, f"请求失败：{str(e)}", [], 'CNY'
    
    def import_product(self, product_data: Dict[str, Any]) -> tuple[bool, str]:
        """导入单个产品"""
        url = f"{self.api_base}/v1/upstream/product"
        
        try:
            response = self.session.post(url, json=product_data, headers=self._get_headers())
            result = response.json()
            
            if result.get('status') == 200:
                return True, "导入成功"
            else:
                return False, result.get('msg', '导入失败')
        except Exception as e:
            return False, f"请求失败：{str(e)}"
    
    def import_products_batch(self, products: List[Dict[str, Any]], callback=None) -> Dict[str, Any]:
        """批量导入产品（倒序导入）"""
        total = len(products)
        success_count = 0
        failed_count = 0
        results = []
        
        # 倒序导入
        for index, product in enumerate(reversed(products)):
            success, msg = self.import_product(product)
            
            if success:
                success_count += 1
            else:
                failed_count += 1
            
            results.append({
                'product_name': product.get('name', 'Unknown'),
                'success': success,
                'message': msg
            })
            
            # 回调更新进度
            if callback:
                callback(index + 1, total, success_count, failed_count)
        
        return {
            'total': total,
            'success_count': success_count,
            'failed_count': failed_count,
            'results': results
        }
