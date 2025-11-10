# CryptoVault-backend\backend\urls.py

from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static 
from django.views.static import serve

MEDIA_ROOT_ABSOLUTE = settings.MEDIA_ROOT
urlpatterns = [
    # 1. 🎯 FIX: ADMIN MUST BE LISTED FIRST
    path('admin/', admin.site.urls),
    
    # 2. API ENDPOINTS (Priority for POST/AJAX requests)
    path('api/', include('api.urls')), 
    
    # 3. FRONTEND PRIORITY: Serves the compiled index.html for the root URL
    path('', TemplateView.as_view(template_name='index.html')), 
    
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': MEDIA_ROOT_ABSOLUTE}),
    
    # 5. REACT ROUTER CATCH-ALL (MUST BE LAST)
    re_path(r'^(?P<resource>.*)$', TemplateView.as_view(template_name='index.html')),
]

