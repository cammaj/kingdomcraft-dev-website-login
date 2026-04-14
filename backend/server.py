from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import uuid
import bcrypt
import jwt
import httpx
import aiofiles
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional

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
def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
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

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    username: str
    role: str
    profile_picture: Optional[str] = None
    created_at: str

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

class NewsResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title_pl: str
    title_en: str
    content_pl: str
    content_en: str
    author_id: str
    author_name: str
    created_at: str

# ===================
# AUTH ENDPOINTS
# ===================
@api_router.post("/auth/register")
async def register(data: UserRegister):
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
    
    access_token = create_access_token(user_id, email)
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
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    access_token = create_access_token(user["id"], email)
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
        
        access_token = create_access_token(user["id"], user["email"])
        response = JSONResponse(content={"message": "Token refreshed"})
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return response
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Google OAuth callback
@api_router.post("/auth/google/session")
async def google_session(request: Request):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        google_data = resp.json()
    
    email = google_data["email"].lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if not user:
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
        # Update profile picture if changed
        if google_data.get("picture") and user.get("profile_picture") != google_data["picture"]:
            await db.users.update_one({"id": user_id}, {"$set": {"profile_picture": google_data["picture"]}})
            user["profile_picture"] = google_data["picture"]
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    
    response = JSONResponse(content={
        "id": user_id,
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
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create uploads directory
    uploads_dir = Path("/app/frontend/public/uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if file.filename else "png"
    filename = f"{user['id']}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = uploads_dir / filename
    
    # Save file
    async with aiofiles.open(filepath, "wb") as f:
        content = await file.read()
        await f.write(content)
    
    # Update user profile
    avatar_url = f"/uploads/{filename}"
    await db.users.update_one({"id": user["id"]}, {"$set": {"profile_picture": avatar_url}})
    
    return {"profile_picture": avatar_url}

# ===================
# ADMIN ENDPOINTS
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
    news_doc = {
        "id": news_id,
        "title_pl": data.title_pl,
        "title_en": data.title_en,
        "content_pl": data.content_pl,
        "content_en": data.content_en,
        "author_id": admin["id"],
        "author_name": admin["username"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.news.insert_one(news_doc)
    
    # Return without _id
    return {
        "id": news_id,
        "title_pl": data.title_pl,
        "title_en": data.title_en,
        "content_pl": data.content_pl,
        "content_en": data.content_en,
        "author_id": admin["id"],
        "author_name": admin["username"],
        "created_at": news_doc["created_at"]
    }

@api_router.delete("/admin/news/{news_id}")
async def delete_news(news_id: str, request: Request):
    await get_admin_user(request)
    result = await db.news.delete_one({"id": news_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News not found")
    return {"message": "News deleted"}

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
- POST /api/auth/refresh
- POST /api/auth/google/session

## Admin Endpoints
- GET /api/admin/users
- POST /api/admin/users
- PUT /api/admin/users/:id
- DELETE /api/admin/users/:id
- PUT /api/admin/settings
- POST /api/admin/news
- DELETE /api/admin/news/:id
""")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
