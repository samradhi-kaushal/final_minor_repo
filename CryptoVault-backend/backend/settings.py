from pathlib import Path
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# BASE_DIR is the 'backend' folder
BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_ROOT = BASE_DIR.parent / 'media' 
MEDIA_URL = '/media/'

# --- Path Calculation FIX ---
# Go up one level to ProjectRoot (Finalaf/)
PROJECT_ROOT = BASE_DIR.parent

# The path to the built frontend files
FRONTEND_DIST_DIR = PROJECT_ROOT / 'dist'

# 🛑 CRITICAL DEBUG STEP: Check the calculated path
print(f"\n--- DEBUG PATH CHECK ---")
print(f"Project Root (2 up): {PROJECT_ROOT}")
print(f"Frontend Dist Dir: {FRONTEND_DIST_DIR}")
print(f"------------------------\n")

# -------------------------------------------------------------
# 🎯 CORE CONFIGURATION
# -------------------------------------------------------------

SECRET_KEY = 'django-insecure-=b+@@!^crnxvo3#dx(bi_07w@(%3)onzqkffsdl&(-bzk+(3_5'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party Apps
    'rest_framework',
    'corsheaders', 
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    # Your Apps
    'users',
    'api',
]

# 🛑 CRITICAL DEBUG LINE
print(f"*** DEBUG MEDIA ROOT: {MEDIA_ROOT}")

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware', # MUST be placed high up
    'django.contrib.sessions.middleware.SessionMiddleware', 
    'django.middleware.common.CommonMiddleware', 
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

# -------------------------------------------------------------
# 🎯 TEMPLATES (Serving index.html)
# -------------------------------------------------------------

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        
        # This is where Django looks for index.html
        'DIRS': [FRONTEND_DIST_DIR], 
        
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

WSGI_APPLICATION = 'backend.wsgi.application'

# -------------------------------------------------------------
# 🎯 STATIC FILES (Serving CSS, JS, Images)
# -------------------------------------------------------------

STATIC_URL = '/static/'

# STATICFILES_DIRS must also point to the 'dist' folder
STATICFILES_DIRS = [
    FRONTEND_DIST_DIR,
]

# STATIC_ROOT is where collectstatic will gather all static files for production
STATIC_ROOT = BASE_DIR / 'staticfiles'

# -------------------------------------------------------------
# 🎯 DRF & CORS (unchanged)
# -------------------------------------------------------------

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.BasicAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny',
        'rest_framework.permissions.IsAuthenticated',
    )
}

CORS_ALLOWED_ORIGINS = [
    # Allow the frontend development server (Vite default port)
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    
    # Backend's own loopback addresses
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Allow credentials for CORS
CORS_ALLOW_CREDENTIALS = True

# -------------------------------------------------------------
# 🎯 DATABASE & DEFAULTS (unchanged)
# -------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# -------------------------------------------------------------
# 🎯 SIMPLE JWT SETTINGS
# -------------------------------------------------------------

from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# -------------------------------------------------------------
# 🛑 MEDIA FILES SERVING
# -------------------------------------------------------------
# Media files are served via urlpatterns in urls.py