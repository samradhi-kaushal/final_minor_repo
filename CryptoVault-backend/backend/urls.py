# CryptoVault-backend\backend\urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from . import views # Import the index view from backend/views.py
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static 

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # 1. 🎯 FIX: Explicitly serve the root path (/)
    path('', TemplateView.as_view(template_name='index.html')), 
    
    # 2. API ENDPOINTS
    path('api/', include('api.urls')),
    path('api/v1/', include('api.urls')), 
    # 3. REACT ROUTER CATCH-ALL (for deep links like /login)
    path('<path:resource>', TemplateView.as_view(template_name='index.html')), 
    re_path(r'^(?:.*)/?$', views.index, name='index'),
]

# CRITICAL: This serves media and static files in development mode. 
# This placement is correct and should not be altered.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
# File: backend/urls.py


    
