#!/usr/bin/env python3
"""
KingdomCraft Page Builder API Testing
Tests all page builder functionality including special pages and maintenance mode
"""

import requests
import sys
import json
from datetime import datetime

class PageBuilderAPITester:
    def __init__(self, base_url="https://service-pause-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.admin_cookies = None
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

    def test_admin_login(self):
        """Test admin login"""
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

    def test_get_all_pages(self):
        """Test GET /api/pages - should return all pages including special ones"""
        try:
            response = self.session.get(f"{self.base_url}/api/pages")
            success = response.status_code == 200
            if success:
                pages = response.json()
                success = isinstance(pages, list)
                special_pages = [p for p in pages if p.get('is_special')]
                regular_pages = [p for p in pages if not p.get('is_special')]
                details = f"Found {len(pages)} total pages ({len(special_pages)} special, {len(regular_pages)} regular)"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get All Pages", success, details)
            return success, pages if success else []
        except Exception as e:
            self.log_test("Get All Pages", False, str(e))
            return False, []

    def test_special_pages_exist(self, pages):
        """Test that special pages (maintenance, home) exist"""
        try:
            special_pages = [p for p in pages if p.get('is_special')]
            maintenance_page = next((p for p in special_pages if p.get('slug') == 'maintenance'), None)
            home_page = next((p for p in special_pages if p.get('slug') == 'home'), None)
            
            maintenance_success = maintenance_page is not None
            home_success = home_page is not None
            
            self.log_test("Maintenance Page Exists", maintenance_success, 
                         f"Found: {maintenance_page.get('id') if maintenance_page else 'None'}")
            self.log_test("Home Page Exists", home_success, 
                         f"Found: {home_page.get('id') if home_page else 'None'}")
            
            return maintenance_page, home_page
        except Exception as e:
            self.log_test("Special Pages Check", False, str(e))
            return None, None

    def test_get_page_by_id(self, page_id, page_name):
        """Test GET /api/pages/:id"""
        try:
            response = self.session.get(f"{self.base_url}/api/pages/{page_id}")
            success = response.status_code == 200
            if success:
                page = response.json()
                success = page.get('id') == page_id
                details = f"Retrieved {page_name}: {page.get('slug')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test(f"Get {page_name} by ID", success, details)
            return success
        except Exception as e:
            self.log_test(f"Get {page_name} by ID", False, str(e))
            return False

    def test_get_page_by_slug(self, slug, page_name):
        """Test GET /api/pages/slug/:slug"""
        try:
            response = self.session.get(f"{self.base_url}/api/pages/slug/{slug}")
            success = response.status_code == 200
            if success:
                page = response.json()
                success = page.get('slug') == slug
                details = f"Retrieved {page_name}: {page.get('id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test(f"Get {page_name} by Slug", success, details)
            return success
        except Exception as e:
            self.log_test(f"Get {page_name} by Slug", False, str(e))
            return False

    def test_create_page(self):
        """Test POST /api/admin/pages - create new page"""
        try:
            page_data = {
                "slug": f"test-page-{datetime.now().strftime('%H%M%S')}",
                "is_special": False,
                "languages": {
                    "pl": {
                        "title": "Test Strona",
                        "blocks": [
                            {
                                "id": "test_block_1",
                                "type": "text",
                                "content": {"text": "Test content", "tag": "p"},
                                "style": {"fontSize": "1rem"}
                            }
                        ]
                    },
                    "en": {
                        "title": "Test Page",
                        "blocks": [
                            {
                                "id": "test_block_1_en",
                                "type": "text",
                                "content": {"text": "Test content EN", "tag": "p"},
                                "style": {"fontSize": "1rem"}
                            }
                        ]
                    }
                }
            }
            
            response = self.session.post(
                f"{self.base_url}/api/admin/pages",
                json=page_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                created_page = response.json()
                success = created_page.get("slug") == page_data["slug"]
                details = f"Created page: {created_page.get('id')} ({created_page.get('slug')})"
                page_id = created_page.get("id")
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
                page_id = None
            
            self.log_test("Create New Page", success, details)
            return success, page_id
        except Exception as e:
            self.log_test("Create New Page", False, str(e))
            return False, None

    def test_update_page(self, page_id):
        """Test PUT /api/admin/pages/:id - update page"""
        if not page_id:
            self.log_test("Update Page", False, "No page ID provided")
            return False
            
        try:
            update_data = {
                "languages": {
                    "pl": {
                        "title": "Updated Test Strona",
                        "blocks": [
                            {
                                "id": "updated_block_1",
                                "type": "text",
                                "content": {"text": "Updated content", "tag": "h2"},
                                "style": {"fontSize": "2rem", "fontWeight": "bold"}
                            }
                        ]
                    }
                },
                "show_in_menu": True,
                "menu_order": 1
            }
            
            response = self.session.put(
                f"{self.base_url}/api/admin/pages/{page_id}",
                json=update_data,
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                updated_page = response.json()
                success = updated_page.get("languages", {}).get("pl", {}).get("title") == "Updated Test Strona"
                details = f"Updated page: {updated_page.get('id')}"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Update Page", success, details)
            return success
        except Exception as e:
            self.log_test("Update Page", False, str(e))
            return False

    def test_delete_special_page_protection(self, special_page_id):
        """Test that special pages cannot be deleted"""
        if not special_page_id:
            self.log_test("Delete Special Page Protection", False, "No special page ID provided")
            return False
            
        try:
            response = self.session.delete(
                f"{self.base_url}/api/admin/pages/{special_page_id}",
                cookies=self.admin_cookies
            )
            # Should fail with 400 status
            success = response.status_code == 400
            if success:
                details = "Special page deletion correctly blocked"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Delete Special Page Protection", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Special Page Protection", False, str(e))
            return False

    def test_delete_regular_page(self, page_id):
        """Test DELETE /api/admin/pages/:id - delete regular page"""
        if not page_id:
            self.log_test("Delete Regular Page", False, "No page ID provided")
            return False
            
        try:
            response = self.session.delete(
                f"{self.base_url}/api/admin/pages/{page_id}",
                cookies=self.admin_cookies
            )
            success = response.status_code == 200
            if success:
                details = f"Page {page_id} deleted successfully"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Delete Regular Page", success, details)
            return success
        except Exception as e:
            self.log_test("Delete Regular Page", False, str(e))
            return False

    def test_maintenance_mode_restrictions(self):
        """Test maintenance mode restrictions for non-admin users"""
        try:
            # Test user registration during maintenance (should fail)
            test_user = {
                "email": f"testuser_{datetime.now().strftime('%H%M%S')}@test.com",
                "password": "TestPass123!",
                "username": f"testuser_{datetime.now().strftime('%H%M%S')}"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=test_user
            )
            # Should fail with 403 during maintenance
            success = response.status_code == 403
            details = f"Registration correctly blocked during maintenance: {response.status_code}"
            
            self.log_test("Maintenance Mode - Registration Blocked", success, details)
            return success
        except Exception as e:
            self.log_test("Maintenance Mode - Registration Blocked", False, str(e))
            return False

    def test_get_menu_pages(self):
        """Test GET /api/pages/menu - get pages for navigation menu"""
        try:
            response = self.session.get(f"{self.base_url}/api/pages/menu")
            success = response.status_code == 200
            if success:
                menu_pages = response.json()
                success = isinstance(menu_pages, list)
                details = f"Found {len(menu_pages)} menu pages"
            else:
                details = f"Status: {response.status_code}, Response: {response.text}"
            
            self.log_test("Get Menu Pages", success, details)
            return success
        except Exception as e:
            self.log_test("Get Menu Pages", False, str(e))
            return False

    def run_all_tests(self):
        """Run comprehensive Page Builder API tests"""
        print("🚀 Starting KingdomCraft Page Builder API Tests")
        print("=" * 60)
        
        # Admin login required for most operations
        if not self.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return False
        
        # Test basic page operations
        pages_success, pages = self.test_get_all_pages()
        if not pages_success:
            print("❌ Cannot get pages list, stopping tests")
            return False
        
        # Test special pages
        maintenance_page, home_page = self.test_special_pages_exist(pages)
        
        if maintenance_page:
            self.test_get_page_by_id(maintenance_page['id'], "Maintenance Page")
            self.test_get_page_by_slug("maintenance", "Maintenance Page")
            self.test_delete_special_page_protection(maintenance_page['id'])
        
        if home_page:
            self.test_get_page_by_id(home_page['id'], "Home Page")
            self.test_get_page_by_slug("home", "Home Page")
        
        # Test menu pages
        self.test_get_menu_pages()
        
        # Test page CRUD operations
        create_success, new_page_id = self.test_create_page()
        if create_success and new_page_id:
            self.test_update_page(new_page_id)
            self.test_delete_regular_page(new_page_id)
        
        # Test maintenance mode restrictions
        self.test_maintenance_mode_restrictions()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Page Builder Tests completed: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All Page Builder tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = PageBuilderAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/page_builder_test_results.json", "w") as f:
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