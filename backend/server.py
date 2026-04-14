from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import aiofiles
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

# Create the main app
app = FastAPI()

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================
# PASSWORD HELPERS
# ===================
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ===================
# JWT HELPERS
# ===================
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ===================
# AUTH DEPENDENCY
# ===================
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(request: Request) -> Optional[dict]:
    """Returns user if authenticated, None otherwise"""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def get_admin_user(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ===================
# PYDANTIC MODELS
# ===================
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None

class SiteSettingsUpdate(BaseModel):
    maintenance_mode: Optional[bool] = None
    maintenance_text_pl: Optional[str] = None
    maintenance_text_en: Optional[str] = None
    maintenance_description_pl: Optional[str] = None
    maintenance_description_en: Optional[str] = None
    countdown_date: Optional[str] = None

class SiteSettings(BaseModel):
    maintenance_mode: bool = True
    maintenance_text_pl: str = "PRZERWA KONSERWACYJNA"
    maintenance_text_en: str = "SERVER MAINTENANCE"
    maintenance_description_pl: str = "Serwer KingdomCraft jest obecnie w trakcie przerwy technicznej. Tworzymy dla Was epickie nowości. Wracamy wkrótce!"
    maintenance_description_en: str = "KingdomCraft is currently undergoing scheduled maintenance. We are building epic new features for you. We will be back soon!"
    countdown_date: str = "2026-04-17T20:30:00"

class NewsCreate(BaseModel):
    title_pl: str
    title_en: str
    content_pl: str
    content_en: str

# Page Builder Models
class PageBlock(BaseModel):
    id: str
    type: str  # text, image, button, container, gallery, video
    content: Dict[str, Any] = {}
    children: List[Any] = []
    style: Dict[str, Any] = {}

class PageContent(BaseModel):
    blocks: List[Dict[str, Any]] = []

class PageCreate(BaseModel):
    slug: str
    is_special: bool = False  # maintenance, home are special
    languages: Dict[str, Dict[str, Any]]  # {pl: {title, blocks}, en: {title, blocks}}

class PageUpdate(BaseModel):
    slug: Optional[str] = None
    languages: Optional[Dict[str, Dict[str, Any]]] = None
    show_in_menu: Optional[bool] = None
    menu_order: Optional[int] = None

# ===================
# AUTH ENDPOINTS
# ===================
@api_router.post("/auth/register")
async def register(data: UserRegister, request: Request):
    # Check if in maintenance mode - only allow admin registration
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if settings and settings.get("maintenance_mode", True):
        raise HTTPException(status_code=403, detail="Registration disabled during maintenance")
    
    email = data.email.lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "id": user_id,
        "email": email,
        "username": data.username,
        "password_hash": hash_password(data.password),
        "role": "user",
        "profile_picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    access_token = create_access_token(user_id, email, "user")
    refresh_token = create_refresh_token(user_id)
    
    response = JSONResponse(content={
        "id": user_id,
        "email": email,
        "username": data.username,
        "role": "user",
        "profile_picture": None
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return response

@api_router.post("/auth/login")
async def login(data: UserLogin, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempts = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempts and attempts.get("count", 0) >= 5:
        lockout_time = attempts.get("locked_until")
        if lockout_time:
            if isinstance(lockout_time, str):
                lockout_time = datetime.fromisoformat(lockout_time)
            if lockout_time.tzinfo is None:
                lockout_time = lockout_time.replace(tzinfo=timezone.utc)
            if lockout_time > datetime.now(timezone.utc):
                raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check maintenance mode - only admins can login
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if settings and settings.get("maintenance_mode", True) and user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Login disabled during maintenance. Only administrators can log in.")
    
    await db.login_attempts.delete_one({"identifier": identifier})
    
    access_token = create_access_token(user["id"], email, user["role"])
    refresh_token = create_refresh_token(user["id"])
    
    response = JSONResponse(content={
        "id": user["id"],
        "email": user["email"],
        "username": user["username"],
        "role": user["role"],
        "profile_picture": user.get("profile_picture")
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return response

@api_router.post("/auth/logout")
async def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return response

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(user["id"], user["email"], user["role"])
        response = JSONResponse(content={"message": "Token refreshed"})
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return response
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/google/session")
async def google_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        google_data = resp.json()
    
    email = google_data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    # Check maintenance mode for new users
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    is_maintenance = settings and settings.get("maintenance_mode", True)
    
    if not user:
        if is_maintenance:
            raise HTTPException(status_code=403, detail="Registration disabled during maintenance")
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "id": user_id,
            "email": email,
            "username": google_data.get("name", email.split("@")[0]),
            "password_hash": "",
            "role": "user",
            "profile_picture": google_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    else:
        user_id = user["id"]
        # Check if non-admin trying to login during maintenance
        if is_maintenance and user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Login disabled during maintenance")
        if google_data.get("picture") and user.get("profile_picture") != google_data["picture"]:
            await db.users.update_one({"id": user_id}, {"$set": {"profile_picture": google_data["picture"]}})
            user["profile_picture"] = google_data["picture"]
    
    access_token = create_access_token(user["id"], email, user["role"])
    refresh_token = create_refresh_token(user["id"])
    
    response = JSONResponse(content={
        "id": user["id"],
        "email": email,
        "username": user["username"],
        "role": user["role"],
        "profile_picture": user.get("profile_picture")
    })
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return response

# ===================
# USER PROFILE ENDPOINTS
# ===================
@api_router.put("/users/me")
async def update_my_profile(data: UserUpdate, request: Request):
    user = await get_current_user(request)
    update_data = {}
    
    if data.username:
        existing = await db.users.find_one({"username": data.username, "id": {"$ne": user["id"]}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update_data["username"] = data.username
    
    if data.email:
        email = data.email.lower()
        existing = await db.users.find_one({"email": email, "id": {"$ne": user["id"]}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        update_data["email"] = email
    
    if update_data:
        await db.users.update_one({"id": user["id"]}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.post("/users/me/avatar")
async def upload_avatar(request: Request, file: UploadFile = File(...)):
    user = await get_current_user(request)
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    uploads_dir = Path("/app/frontend/public/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = uploads_dir / filename
    
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    avatar_url = f"/uploads/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"profile_picture": avatar_url}})
    
    return {"profile_picture": avatar_url}

# ===================
# ADMIN USER ENDPOINTS
# ===================
@api_router.get("/admin/users")
async def get_all_users(request: Request):
    await get_admin_user(request)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/admin/users/{user_id}")
async def get_user(user_id: str, request: Request):
    await get_admin_user(request)
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/admin/users/{user_id}")
async def update_user(user_id: str, data: UserUpdate, request: Request):
    await get_admin_user(request)
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {}
    if data.username:
        existing = await db.users.find_one({"username": data.username, "id": {"$ne": user_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        update_data["username"] = data.username
    
    if data.email:
        email = data.email.lower()
        existing = await db.users.find_one({"email": email, "id": {"$ne": user_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
        update_data["email"] = email
    
    if data.role and data.role in ["user", "admin"]:
        update_data["role"] = data.role
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    return updated_user

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, request: Request):
    admin = await get_admin_user(request)
    
    if admin["id"] == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted"}

@api_router.post("/admin/users")
async def create_user(data: UserRegister, request: Request):
    await get_admin_user(request)
    
    email = data.email.lower()
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": data.username}, {"_id": 0})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "id": user_id,
        "email": email,
        "username": data.username,
        "password_hash": hash_password(data.password),
        "role": "user",
        "profile_picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    return {
        "id": user_id,
        "email": email,
        "username": data.username,
        "role": "user",
        "profile_picture": None,
        "created_at": user_doc["created_at"]
    }

# ===================
# SITE SETTINGS ENDPOINTS
# ===================
@api_router.get("/settings")
async def get_settings():
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if not settings:
        default_settings = SiteSettings().model_dump()
        default_settings["type"] = "site"
        await db.settings.insert_one(default_settings)
        del default_settings["type"]
        return default_settings
    del settings["type"]
    return settings

@api_router.put("/admin/settings")
async def update_settings(data: SiteSettingsUpdate, request: Request):
    await get_admin_user(request)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if update_data:
        await db.settings.update_one(
            {"type": "site"},
            {"$set": update_data},
            upsert=True
        )
    
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    del settings["type"]
    return settings

# ===================
# NEWS ENDPOINTS
# ===================
@api_router.get("/news")
async def get_news():
    news = await db.news.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return news

@api_router.post("/admin/news")
async def create_news(data: NewsCreate, request: Request):
    admin = await get_admin_user(request)
    
    news_id = f"news_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    await db.news.insert_one({
        "id": news_id,
        "title_pl": data.title_pl,
        "title_en": data.title_en,
        "content_pl": data.content_pl,
        "content_en": data.content_en,
        "author_id": admin["id"],
        "author_name": admin["username"],
        "created_at": created_at
    })
    
    return {
        "id": news_id,
        "title_pl": data.title_pl,
        "title_en": data.title_en,
        "content_pl": data.content_pl,
        "content_en": data.content_en,
        "author_id": admin["id"],
        "author_name": admin["username"],
        "created_at": created_at
    }

@api_router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, request: Request):
    await get_admin_user(request)
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

# ===================
# PAGE BUILDER ENDPOINTS
# ===================
@api_router.get("/pages")
async def get_all_pages():
    """Get all pages for navigation menu"""
    pages = await db.pages.find({}, {"_id": 0}).sort("menu_order", 1).to_list(100)
    return pages

@api_router.get("/pages/menu")
async def get_menu_pages():
    """Get pages that should appear in navigation menu"""
    pages = await db.pages.find({"show_in_menu": True}, {"_id": 0, "id": 1, "slug": 1, "languages": 1, "menu_order": 1}).sort("menu_order", 1).to_list(50)
    return pages

@api_router.get("/pages/{page_id}")
async def get_page(page_id: str):
    """Get a single page by ID"""
    page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.get("/pages/slug/{slug}")
async def get_page_by_slug(slug: str):
    """Get a single page by slug"""
    page = await db.pages.find_one({"slug": slug}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@api_router.post("/admin/pages")
async def create_page(data: PageCreate, request: Request):
    await get_admin_user(request)
    
    # Check if slug already exists
    existing = await db.pages.find_one({"slug": data.slug}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Page with this slug already exists")
    
    page_id = f"page_{uuid.uuid4().hex[:12]}"
    created_at = datetime.now(timezone.utc).isoformat()
    
    page_doc = {
        "id": page_id,
        "slug": data.slug,
        "is_special": data.is_special,
        "languages": data.languages,
        "show_in_menu": True,
        "menu_order": 0,
        "created_at": created_at,
        "updated_at": created_at
    }
    
    await db.pages.insert_one(page_doc)
    
    return {
        "id": page_id,
        "slug": data.slug,
        "is_special": data.is_special,
        "languages": data.languages,
        "show_in_menu": True,
        "menu_order": 0,
        "created_at": created_at,
        "updated_at": created_at
    }

@api_router.put("/admin/pages/{page_id}")
async def update_page(page_id: str, data: PageUpdate, request: Request):
    await get_admin_user(request)
    
    page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if data.slug is not None:
        # Check if new slug already exists (excluding this page)
        existing = await db.pages.find_one({"slug": data.slug, "id": {"$ne": page_id}}, {"_id": 0})
        if existing:
            raise HTTPException(status_code=400, detail="Page with this slug already exists")
        update_data["slug"] = data.slug
    
    if data.languages is not None:
        update_data["languages"] = data.languages
    
    if data.show_in_menu is not None:
        update_data["show_in_menu"] = data.show_in_menu
    
    if data.menu_order is not None:
        update_data["menu_order"] = data.menu_order
    
    await db.pages.update_one({"id": page_id}, {"$set": update_data})
    
    updated_page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    return updated_page

@api_router.delete("/admin/pages/{page_id}")
async def delete_page(page_id: str, request: Request):
    await get_admin_user(request)
    
    page = await db.pages.find_one({"id": page_id}, {"_id": 0})
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    
    # Prevent deletion of special pages
    if page.get("is_special"):
        raise HTTPException(status_code=400, detail="Cannot delete special pages (maintenance, home)")
    
    await db.pages.delete_one({"id": page_id})
    return {"message": "Page deleted"}

# Image upload for page builder
@api_router.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    await get_admin_user(request)
    
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    uploads_dir = Path("/app/frontend/public/uploads/pages")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{uuid.uuid4().hex[:16]}.{ext}"
    filepath = uploads_dir / filename
    
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    return {"url": f"/uploads/pages/{filename}"}

# ===================
# HEALTH CHECK
# ===================
@api_router.get("/")
async def root():
    return {"message": "KingdomCraft API"}

# Include router
app.include_router(api_router)

# CORS
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===================
# STARTUP EVENT
# ===================
@app.on_event("startup")
async def startup():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("username", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.pages.create_index("id", unique=True)
    await db.pages.create_index("slug", unique=True)
    
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@kingdomcraft.pl")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    
    existing = await db.users.find_one({"email": admin_email}, {"_id": 0})
    if existing is None:
        admin_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "id": admin_id,
            "email": admin_email,
            "username": "Admin",
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "profile_picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info(f"Admin password updated: {admin_email}")
    
    # Seed default settings
    settings = await db.settings.find_one({"type": "site"}, {"_id": 0})
    if not settings:
        default_settings = SiteSettings().model_dump()
        default_settings["type"] = "site"
        await db.settings.insert_one(default_settings)
        logger.info("Default site settings created")
    
    # Seed special pages (maintenance and home)
    maintenance_page = await db.pages.find_one({"slug": "maintenance"}, {"_id": 0})
    if not maintenance_page:
        await db.pages.insert_one({
            "id": "page_maintenance",
            "slug": "maintenance",
            "is_special": True,
            "show_in_menu": False,
            "menu_order": -1,
            "languages": {
                "pl": {
                    "title": "Przerwa konserwacyjna",
                    "blocks": [
                        {"id": "b1", "type": "container", "style": {"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "2rem", "padding": "2rem"}, "children": [
                            {"id": "b2", "type": "image", "content": {"src": "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png", "alt": "Logo"}, "style": {"width": "150px", "height": "auto"}},
                            {"id": "b3", "type": "text", "content": {"text": "PRZERWA KONSERWACYJNA", "tag": "h1"}, "style": {"fontSize": "3rem", "fontWeight": "900", "textAlign": "center"}},
                            {"id": "b4", "type": "text", "content": {"text": "Serwer KingdomCraft jest obecnie w trakcie przerwy technicznej.", "tag": "p"}, "style": {"fontSize": "1.125rem", "textAlign": "center", "opacity": "0.8"}}
                        ]}
                    ]
                },
                "en": {
                    "title": "Server Maintenance",
                    "blocks": [
                        {"id": "b1", "type": "container", "style": {"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "2rem", "padding": "2rem"}, "children": [
                            {"id": "b2", "type": "image", "content": {"src": "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png", "alt": "Logo"}, "style": {"width": "150px", "height": "auto"}},
                            {"id": "b3", "type": "text", "content": {"text": "SERVER MAINTENANCE", "tag": "h1"}, "style": {"fontSize": "3rem", "fontWeight": "900", "textAlign": "center"}},
                            {"id": "b4", "type": "text", "content": {"text": "KingdomCraft is currently undergoing scheduled maintenance.", "tag": "p"}, "style": {"fontSize": "1.125rem", "textAlign": "center", "opacity": "0.8"}}
                        ]}
                    ]
                }
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Maintenance page created")
    
    home_page = await db.pages.find_one({"slug": "home"}, {"_id": 0})
    if not home_page:
        await db.pages.insert_one({
            "id": "page_home",
            "slug": "home",
            "is_special": True,
            "show_in_menu": False,
            "menu_order": -1,
            "languages": {
                "pl": {
                    "title": "Strona główna",
                    "blocks": [
                        {"id": "h1", "type": "container", "style": {"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "2rem", "padding": "2rem"}, "children": [
                            {"id": "h2", "type": "image", "content": {"src": "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png", "alt": "Logo"}, "style": {"width": "150px", "height": "auto"}},
                            {"id": "h3", "type": "text", "content": {"text": "Witaj na KingdomCraft!", "tag": "h1"}, "style": {"fontSize": "3rem", "fontWeight": "900", "textAlign": "center"}},
                            {"id": "h4", "type": "text", "content": {"text": "Serwer jest aktywny. Dołącz do naszej społeczności!", "tag": "p"}, "style": {"fontSize": "1.125rem", "textAlign": "center", "opacity": "0.8"}}
                        ]}
                    ]
                },
                "en": {
                    "title": "Home",
                    "blocks": [
                        {"id": "h1", "type": "container", "style": {"display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "2rem", "padding": "2rem"}, "children": [
                            {"id": "h2", "type": "image", "content": {"src": "https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png", "alt": "Logo"}, "style": {"width": "150px", "height": "auto"}},
                            {"id": "h3", "type": "text", "content": {"text": "Welcome to KingdomCraft!", "tag": "h1"}, "style": {"fontSize": "3rem", "fontWeight": "900", "textAlign": "center"}},
                            {"id": "h4", "type": "text", "content": {"text": "The server is active. Join our community!", "tag": "p"}, "style": {"fontSize": "1.125rem", "textAlign": "center", "opacity": "0.8"}}
                        ]}
                    ]
                }
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info("Home page created")
    
    # Write test credentials
    creds_dir = Path("/app/memory")
    creds_dir.mkdir(parents=True, exist_ok=True)
    with open(creds_dir / "test_credentials.md", "w") as f:
        f.write(f"""# Test Credentials

## Admin Account
- Email: {admin_email}
- Password: {admin_password}
- Role: admin

## Auth Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

## Page Builder Endpoints
- GET /api/pages
- GET /api/pages/menu
- GET /api/pages/:id
- GET /api/pages/slug/:slug
- POST /api/admin/pages
- PUT /api/admin/pages/:id
- DELETE /api/admin/pages/:id
- POST /api/admin/upload
""")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
