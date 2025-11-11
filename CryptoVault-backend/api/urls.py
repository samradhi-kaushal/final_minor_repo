from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SecureFileViewSet, FileUploadView, CustomAuthToken, UserRegistrationView

# For router-based viewset handling
router = DefaultRouter(trailing_slash=False)
router.register(r'files', SecureFileViewSet, basename='securefile')

# List/Create view from ViewSet (for uploadfiles/)
upload_list_view = SecureFileViewSet.as_view({
    'get': 'list',
    'post': 'create'
})

urlpatterns = [
    # Auth endpoints (from your first file, preserved naming)
    path('auth/', include('users.urls')),

    # File upload and listing
    path('uploadfiles/', upload_list_view, name='file-upload-list'),
    path('', include(router.urls)),  # DRF router patterns for /files/...

    # File detail view (retrieve, update, delete)
    path('uploadfiles/<int:pk>/', SecureFileViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='file-detail'),
]
