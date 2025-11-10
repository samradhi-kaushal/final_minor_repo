# CryptoVault-backend\backend\api\urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SecureFileViewSet

# 1. Manually map the List/Create View
upload_list_view = SecureFileViewSet.as_view({
    'get': 'list',    # Allows GET requests 
    'post': 'create'  
})
router = DefaultRouter(trailing_slash=False) 
router.register(r'files', SecureFileViewSet, basename='securefile')

# Note: The router below is now optional for other endpoints, but not used for the upload.
# router = DefaultRouter(trailing_slash=False) 
# router.register(r'uploadfiles', SecureFileViewSet, basename='securefile')

urlpatterns = [
    #Map the final, working path directly to the view with POST enabled.
    path('uploadfiles/', upload_list_view, name='file-upload-list'),
    path('', include(router.urls)),
    # Example: Detail View mapping (Optional, but good practice)
    path('uploadfiles/<int:pk>/', SecureFileViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='file-detail'),
]
