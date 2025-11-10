from django.urls import path,include
from .views import FileUploadView # <<< FIX: REMOVE FileDownloadView
from .views import CustomAuthToken
from .views import UserRegistrationView
urlpatterns = [
    # 1. Upload and List Files (GET/POST)
   path('auth/', include('users.urls')), 
]