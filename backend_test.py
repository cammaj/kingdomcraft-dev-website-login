#!/usr/bin/env python3
"""
KingdomCraft Backend API Testing
Tests all authentication, admin, and user management endpoints
"""

import requests
import sys
import json
from datetime import datetime

class KingdomCraftAPITester:
    def __init__(self, base_url="https://service-pause-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_cookies = None
        self.user_cookies = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{self.base_url}/api/")
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            if success:
                details += f", Response: {response.json()}"
            self.log_test("API Health Check", success, details)
            return success
        except Exception as e:
            self.log_test("API Health Check", False, str(e))
            return False

    def test_admin_login(self):
        """Test admin login with credentials from test_credentials.md"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": "admin@kingdomcraft.pl", "password": "Admin123!"}
            )
            success = response.status_code == 200
            if success:
                self.admin_cookies = response.cookies
                admin_data = response.json()
                success = admin_data.get("role") == "admin"
                details = f"Admin role verified: {admin_data.get('role')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Admin Login", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Login", False, str(e))
            return False

    def test_user_registration(self):
        """Test user registration"""
        try:
            test_user = {
                "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=test_user
            )
            success = response.status_code == 200
            if success:
                self.user_cookies = response.cookies
                user_data = response.json()
                success = user_data.get("email") == test_user["email"]
                details = f"User created: {user_data.get('username')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Registration", success, details)
            return success, test_user if success else None
        except Exception as e:
            self.log_test("User Registration", False, str(e))
            return False, None

    def test_user_login(self, user_data):
        """Test user login"""
        if not user_data:
            self.log_test("User Login", False, "No user data provided")
            return False
            
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json={"email": user_data["email"], "password": user_data["password"]}
            )
            success = response.status_code == 200
            if success:
                login_data = response.json()
                success = login_data.get("email") == user_data["email"]
                details = f"User logged in: {login_data.get('username')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("User Login", success, details)
            return success
        except Exception as e:
            self.log_test("User Login", False, str(e))
            return False

    def test_auth_me(self):
        """Test /auth/me endpoint with admin cookies"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/auth/me",
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                user_data = response.json()
                success = user_data.get("role") == "admin"
                details = f"Current user: {user_data.get('username')} ({user_data.get('role')})"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Auth Me Endpoint", success, details)
            return success
        except Exception as e:
            self.log_test("Auth Me Endpoint", False, str(e))
            return False

    def test_admin_users_list(self):
        """Test admin users list endpoint"""
        try:
            response = self.session.get(
                f"{self.base_url}/api/admin/users",
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                users = response.json()
                success = isinstance(users, list) and len(users) > 0
                details = f"Found {len(users)} users"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Admin Users List", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Users List", False, str(e))
            return False

    def test_admin_create_user(self):
        """Test admin user creation"""
        try:
            new_user = {
                "email": f"adminuser_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "AdminUser123!",
                "username": f"adminuser_{datetime.now().strftime('%H%M%S')}"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin/users",
                json=new_user,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                user_data = response.json()
                success = user_data.get("email") == new_user["email"]
                details = f"Admin created user: {user_data.get('username')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Admin Create User", success, details)
            return success, user_data.get("id") if success else None
        except Exception as e:
            self.log_test("Admin Create User", False, str(e))
            return False, None

    def test_admin_update_user(self, user_id):
        """Test admin user update"""
        if not user_id:
            self.log_test("Admin Update User", False, "No user ID provided")
            return False
            
        try:
            update_data = {
                "username": f"updated_user_{datetime.now().strftime('%H%M%S')}",
                "role": "user"
            }
            
            response = self.session.put(
                f"{self.base_url}/api/admin/users/{user_id}",
                json=update_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                user_data = response.json()
                success = user_data.get("username") == update_data["username"]
                details = f"Updated user: {user_data.get('username')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Admin Update User", success, details)
            return success
        except Exception as e:
            self.log_test("Admin Update User", False, str(e))
            return False

    def test_settings_endpoints(self):
        """Test settings endpoints"""
        try:
            # Get settings
            response = self.session.get(f"{self.base_url}/api/settings")
            success = response.status_code == 200
            if not success:
                self.log_test("Get Settings", False, f"Status: {response.status_code}")
                return False
            
            settings = response.json()
            self.log_test("Get Settings", True, f"Maintenance mode: {settings.get('maintenance_mode')}")
            
            # Update settings (admin only)
            update_data = {
                "maintenance_mode": not settings.get("maintenance_mode", True),
                "maintenance_text_pl": "Test PL",
                "maintenance_text_en": "Test EN"
            }
            
            response = self.session.put(
                f"{self.base_url}/api/admin/settings",
                json=update_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                updated_settings = response.json()
                success = updated_settings.get("maintenance_mode") == update_data["maintenance_mode"]
                details = f"Settings updated, maintenance mode: {updated_settings.get('maintenance_mode')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Update Settings", success, details)
            return success
        except Exception as e:
            self.log_test("Settings Endpoints", False, str(e))
            return False

    def test_news_endpoints(self):
        """Test news endpoints"""
        try:
            # Get news (public)
            response = self.session.get(f"{self.base_url}/api/news")
            success = response.status_code == 200
            if success:
                news = response.json()
                details = f"Found {len(news)} news items"
            else:
                details = f"Status: {response.status_code}"
            
            self.log_test("Get News", success, details)
            
            # Create news (admin only)
            news_data = {
                "title_pl": "Test News PL",
                "title_en": "Test News EN",
                "content_pl": "Test content PL",
                "content_en": "Test content EN"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin/news",
                json=news_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                created_news = response.json()
                success = created_news.get("title_pl") == news_data["title_pl"]
                details = f"Created news: {created_news.get('title_en')}"
                news_id = created_news.get("id")
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                news_id = None
            
            self.log_test("Create News", success, details)
            return success, news_id
        except Exception as e:
            self.log_test("News Endpoints", False, str(e))
            return False, None

    def test_profile_update(self):
        """Test profile update endpoint"""
        try:
            update_data = {
                "username": f"updated_admin_{datetime.now().strftime('%H%M%S')}",
                "email": "admin@kingdomcraft.pl"  # Keep same email
            }
            
            response = self.session.put(
                f"{self.base_url}/api/users/me",
                json=update_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                user_data = response.json()
                success = user_data.get("username") == update_data["username"]
                details = f"Profile updated: {user_data.get('username')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Profile Update", success, details)
            return success
        except Exception as e:
            self.log_test("Profile Update", False, str(e))
            return False

    def test_logout(self):
        """Test logout endpoint"""
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/logout",
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            details = f"Status: {response.status_code}"
            
            self.log_test("Logout", success, details)
            return success
        except Exception as e:
            self.log_test("Logout", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive backend API tests"""
        print("🚀 Starting KingdomCraft Backend API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_health():
            print("❌ API is not accessible, stopping tests")
            return False
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return False
        
        self.test_auth_me()
        
        # User management tests
        user_success, user_data = self.test_user_registration()
        if user_success:
            self.test_user_login(user_data)
        
        # Admin functionality tests
        self.test_admin_users_list()
        admin_user_success, admin_user_id = self.test_admin_create_user()
        if admin_user_success:
            self.test_admin_update_user(admin_user_id)
        
        # Settings and news tests
        self.test_settings_endpoints()
        news_success, news_id = self.test_news_endpoints()
        
        # Profile tests
        self.test_profile_update()
        
        # Logout test
        self.test_logout()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = KingdomCraftAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total_tests": tester.tests_run,
            "passed_tests": tester.tests_passed,
            "success_rate": f"{(tester.tests_passed/tester.tests_run)*100:.1f}%" if tester.tests_run > 0 else "0%",
            "results": tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())