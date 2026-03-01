import os
import yaml
from typing import Dict, Any, Optional


class ConfigManager:
    """配置管理器"""
    
    def __init__(self, config_file: str = "config.yaml"):
        self.config_file = config_file
        self.config: Dict[str, Any] = {}
        self.load_config()
    
    def load_config(self) -> Dict[str, Any]:
        """加载配置文件"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    self.config = yaml.safe_load(f) or {}
            except Exception as e:
                print(f"加载配置文件失败：{e}")
                self.config = {}
        else:
            self.config = {}
        return self.config
    
    def save_config(self, config: Dict[str, Any]) -> bool:
        """保存配置文件"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                yaml.dump(config, f, allow_unicode=True, default_flow_style=False)
            self.config = config
            return True
        except Exception as e:
            print(f"保存配置文件失败：{e}")
            return False
    
    def get_config(self) -> Dict[str, Any]:
        """获取配置"""
        return self.config
    
    def validate_config(self, config: Dict[str, Any]) -> tuple[bool, str]:
        """验证配置"""
        if not config.get('site_url'):
            return False, "站点 URL 不能为空"
        
        if not config.get('admin_path'):
            return False, "后台路径不能为空"
        
        if not config.get('username'):
            return False, "用户名不能为空"
        
        if not config.get('password'):
            return False, "密码不能为空"
        
        # 验证 URL 格式
        site_url = config.get('site_url', '')
        if not site_url.startswith('http://') and not site_url.startswith('https://'):
            return False, "站点 URL 必须以 http:// 或 https:// 开头"
        
        return True, ""
