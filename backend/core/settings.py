"""
Django settings for core project.
Optimized for Medical Management System (Render + GitHub Deployment)
"""

import os
from pathlib import Path
import dj_database_url
from dotenv import load_dotenv
import sys

# 1. INITIALIZATION & DEBUGGING
# Load .env for local Linux dev. Render uses its own "Environment" tab.
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# [DEBUGGING] Simple startup check to see where the server is running
print("--- [SYSTEM STARTUP] Loading Django Settings ---")

# 2. SECURITY CONFIGURATION
# Root Cause Fix: Never hardcode the SECRET_KEY in a GitHub repo.
SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-insecure-key-for-dev-only')

# Logic: If DEBUG is True, we are likely on your Linux laptop.
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
print(f"--- [DEBUG MODE]: {DEBUG} ---")

# ALLOWED_HOSTS: Add your Render URL and local IPs
ALLOWED_HOSTS = [
    'localhost', 
    '127.0.0.1', 
    'nvm-medical-management.onrender.com'
]

# If Render provides a RENDER_EXTERNAL_HOSTNAME, add it automatically
render_host = os.getenv('RENDER_EXTERNAL_HOSTNAME')
if render_host:
    ALLOWED_HOSTS.append(render_host)


# 3. APPLICATION DEFINITION
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third Party Apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Your Apps
    'accounts',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Essential for Render static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', 
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'


# 4. DATABASE CONFIGURATION (PostgreSQL)
# dj_database_url parses the DATABASE_URL environment variable from Render
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600,
        # Render Postgres requires SSL. This ensures it's on in production.
        ssl_require=not DEBUG 
    )
}

# [DB DEBUG] Verify database connectivity string exists
if not DATABASES['default'].get('NAME'):
    print("[CRITICAL] DATABASE_URL not found. Check your .env or Render Config!")
else:
    print(f"--- [DATABASE] Configured for: {DATABASES['default'].get('ENGINE')} ---")


# 5. AUTHENTICATION & USER MODEL
# Root Cause Fix: Removed duplicate AUTH_USER_MODEL
AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# 6. INTERNATIONALIZATION
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# 7. STATIC FILES (WhiteNoise Config)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Root Cause Fix: CompressedStaticFilesStorage is more stable for Render 
# than 'CompressedManifestStaticFilesStorage' which crashes on missing files.
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'


# 8. CORS CONFIGURATION (Frontend-Backend Communication)
# Add your local Vite port and your future Render frontend URL
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173", 
    "https://nvm-medical-management-1.onrender.com",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = ["authorization", "content-type"]
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]


# 9. DJANGO REST FRAMEWORK CONFIG
# Root Cause Fix: Set default to IsAuthenticated for medical data security.
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', # Secure by default
    ],
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

print("--- [SYSTEM STARTUP] Settings Loaded Successfully ---")
