import requests
import sys
import json
from datetime import datetime

class KingdomCraftAdminTester:
    def __init__(self, base_url="https://service-pause-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.cookies = {}
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Use cookies for authentication (as per the backend implementation)
        kwargs = {'headers': headers, 'cookies': self.cookies}
        if data:
            kwargs['json'] = data

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, **kwargs)
            elif method == 'POST':
                response = requests.post(url, **kwargs)
            elif method == 'PUT':
                response = requests.put(url, **kwargs)
            elif method == 'DELETE':
                response = requests.delete(url, **kwargs)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.content:
                    try:
                        response_data = response.json()
                        if isinstance(response_data, dict) and len(response_data) <= 5:
                            print(f"   Response: {response_data}")
                        elif isinstance(response_data, list) and len(response_data) <= 3:
                            print(f"   Response: {len(response_data)} items")
                    except:
                        print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    print(f"   Error: {response.text[:200]}")

            return success, response

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, None

    def test_admin_login(self):
        """Test admin login and get authentication cookies"""
        print("\n🔐 Testing Admin Authentication...")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@kingdomcraft.pl", "password": "Admin123!"},
            auth_required=False
        )
        
        if success and response:
            # Store cookies for subsequent requests
            self.cookies.update(response.cookies)
            print(f"   Cookies received: {list(self.cookies.keys())}")
            return True
        return False

    def test_analytics_summary(self):
        """Test analytics summary endpoint for admin dashboard"""
        success, response = self.run_test(
            "Analytics Summary",
            "GET",
            "admin/analytics/summary",
            200
        )
        
        if success and response:
            data = response.json()
            required_fields = ['total_users', 'total_pages', 'views_this_week', 'chart_data', 'top_pages', 'recent_users']
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print(f"   ⚠️  Missing fields: {missing_fields}")
            else:
                print(f"   ✅ All required analytics fields present")
                print(f"   📊 Users: {data.get('total_users')}, Pages: {data.get('total_pages')}, Views: {data.get('views_this_week')}")
        
        return success

    def test_pageview_tracking(self):
        """Test page view tracking endpoint"""
        success, response = self.run_test(
            "Page View Tracking",
            "POST",
            "analytics/pageview",
            200,
            data={"path": "/admin"},
            auth_required=False
        )
        return success

    def test_seo_sitemap(self):
        """Test SEO sitemap.xml endpoint"""
        success, response = self.run_test(
            "SEO Sitemap XML",
            "GET",
            "seo/sitemap.xml",
            200,
            auth_required=False
        )
        
        if success and response:
            content = response.text
            if '<?xml version="1.0"' in content and '<urlset' in content:
                print(f"   ✅ Valid XML sitemap structure")
            else:
                print(f"   ⚠️  Invalid XML structure")
        
        return success

    def test_seo_robots(self):
        """Test SEO robots.txt endpoint"""
        success, response = self.run_test(
            "SEO Robots.txt",
            "GET",
            "seo/robots.txt",
            200,
            auth_required=False
        )
        
        if success and response:
            content = response.text
            if 'User-agent:' in content and 'Sitemap:' in content:
                print(f"   ✅ Valid robots.txt structure")
            else:
                print(f"   ⚠️  Invalid robots.txt structure")
        
        return success

    def test_admin_users_list(self):
        """Test admin users list endpoint"""
        success, response = self.run_test(
            "Admin Users List",
            "GET",
            "admin/users",
            200
        )
        
        if success and response:
            users = response.json()
            admin_users = [u for u in users if u.get('role') == 'admin']
            print(f"   👥 Found {len(users)} total users, {len(admin_users)} admins")
        
        return success

    def test_settings_get(self):
        """Test getting site settings"""
        success, response = self.run_test(
            "Get Site Settings",
            "GET",
            "settings",
            200,
            auth_required=False
        )
        
        if success and response:
            settings = response.json()
            if 'maintenance_mode' in settings:
                print(f"   ⚙️  Maintenance mode: {settings.get('maintenance_mode')}")
            else:
                print(f"   ⚠️  Missing maintenance_mode setting")
        
        return success

    def test_admin_settings_update(self):
        """Test updating admin settings (maintenance mode toggle)"""
        # First get current settings
        _, response = self.run_test(
            "Get Current Settings",
            "GET",
            "settings",
            200,
            auth_required=False
        )
        
        if response:
            current_settings = response.json()
            current_maintenance = current_settings.get('maintenance_mode', True)
            
            # Toggle maintenance mode
            success, response = self.run_test(
                "Update Maintenance Mode",
                "PUT",
                "admin/settings",
                200,
                data={"maintenance_mode": not current_maintenance}
            )
            
            if success:
                print(f"   🔄 Toggled maintenance mode: {current_maintenance} → {not current_maintenance}")
                
                # Toggle back to original state
                self.run_test(
                    "Restore Maintenance Mode",
                    "PUT",
                    "admin/settings",
                    200,
                    data={"maintenance_mode": current_maintenance}
                )
            
            return success
        
        return False

    def test_pages_endpoints(self):
        """Test pages endpoints for SEO page status"""
        success, response = self.run_test(
            "Get All Pages",
            "GET",
            "pages",
            200,
            auth_required=False
        )
        
        if success and response:
            pages = response.json()
            special_pages = [p for p in pages if p.get('is_special')]
            menu_pages = [p for p in pages if p.get('show_in_menu')]
            print(f"   📄 Found {len(pages)} total pages, {len(special_pages)} special, {len(menu_pages)} in menu")
        
        return success

def main():
    print("🏰 KingdomCraft Admin Panel Backend Testing")
    print("=" * 50)
    
    tester = KingdomCraftAdminTester()
    
    # Test authentication first
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test admin dashboard analytics
    print("\n📊 Testing Admin Dashboard Analytics...")
    tester.test_analytics_summary()
    tester.test_pageview_tracking()
    
    # Test SEO endpoints
    print("\n🔍 Testing SEO Endpoints...")
    tester.test_seo_sitemap()
    tester.test_seo_robots()
    
    # Test admin user management
    print("\n👥 Testing User Management...")
    tester.test_admin_users_list()
    
    # Test settings management
    print("\n⚙️  Testing Settings Management...")
    tester.test_settings_get()
    tester.test_admin_settings_update()
    
    # Test pages for SEO status
    print("\n📄 Testing Pages for SEO...")
    tester.test_pages_endpoints()
    
    # Print final results
    print(f"\n📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())