from rest_framework import generics, parsers, viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
from django.db import models
from .serializers import UserRegistrationSerializer, VaultFileSerializer
from .models import VaultFile
import hashlib

User = get_user_model()


# File upload/list API for authenticated users, secured with JWT Authentication
class FileUploadView(generics.ListCreateAPIView):
    serializer_class = VaultFileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    
    def get_queryset(self):
        """Filter to show only files owned by the logged-in user (personal vault)"""
        return VaultFile.objects.filter(
            user=self.request.user,
            receiving_user__isnull=True
        ).order_by('-uploaded_at')

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('uploaded_file')
        receiving_user_id = self.request.data.get('receiving_user')
        receiving_username = self.request.data.get('receiving_username')
        
        # If username is provided, look up the user
        receiving_user = None
        if receiving_username:
            try:
                receiving_user = User.objects.get(username=receiving_username)
                receiving_user_id = receiving_user.id
            except User.DoesNotExist:
                pass  # receiving_user will remain None
        elif receiving_user_id:
            try:
                receiving_user = User.objects.get(id=receiving_user_id)
            except User.DoesNotExist:
                receiving_user = None
                receiving_user_id = None
        
        instance = serializer.save(
            user=self.request.user,
            file_name=uploaded_file.name if uploaded_file else "",
            receiving_user=receiving_user
        )
        # Blockchain hash calculation (SHA256)
        if uploaded_file and instance.uploaded_file:
            try:
                file_path = instance.uploaded_file.path
                with open(file_path, 'rb') as f:
                    hash_val = hashlib.sha256(f.read()).hexdigest()
                instance.blockchain_hash = hash_val
                instance.save()
            except Exception as e:
                print(f"Hash calculation failed: {e}")


# ViewSet for router-based file APIs (router URL: /files/)
@method_decorator(csrf_exempt, name='dispatch')
class SecureFileViewSet(viewsets.ModelViewSet):
    serializer_class = VaultFileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Filter files to show only:
        - Files owned by the logged-in user (user=self.request.user)
        - Files received by the logged-in user (receiving_user=self.request.user)
        """
        user = self.request.user
        return VaultFile.objects.filter(
            models.Q(user=user) | models.Q(receiving_user=user)
        ).order_by('-uploaded_at')
    
    def get_queryset_for_vault(self):
        """Get only files owned by user (not shared files)"""
        return VaultFile.objects.filter(
            user=self.request.user,
            receiving_user__isnull=True
        ).order_by('-uploaded_at')
    
    def get_queryset_for_shared(self):
        """Get only files received by user"""
        return VaultFile.objects.filter(
            receiving_user=self.request.user
        ).order_by('-uploaded_at')

    def perform_create(self, serializer):
        receiving_user_id = self.request.data.get('receiving_user')
        receiving_username = self.request.data.get('receiving_username')
        
        # If username is provided, look up the user
        receiving_user = None
        if receiving_username:
            try:
                receiving_user = User.objects.get(username=receiving_username)
                receiving_user_id = receiving_user.id
            except User.DoesNotExist:
                pass  # receiving_user will remain None
        elif receiving_user_id:
            try:
                receiving_user = User.objects.get(id=receiving_user_id)
            except User.DoesNotExist:
                receiving_user = None
                receiving_user_id = None
        
        instance = serializer.save(
            user=self.request.user,
            file_name=self.request.FILES['uploaded_file'].name if 'uploaded_file' in self.request.FILES else "",
            receiving_user=receiving_user
        )
        try:
            file_path = instance.uploaded_file.path
            with open(file_path, 'rb') as f:
                hash_val = hashlib.sha256(f.read()).hexdigest()
            instance.blockchain_hash = hash_val
            instance.save()
        except Exception as e:
            print(f"Hash calculation failed: {e}")

    def perform_update(self, serializer):
        instance = serializer.save()
        try:
            file_path = instance.uploaded_file.path
            with open(file_path, 'rb') as f:
                hash_val = hashlib.sha256(f.read()).hexdigest()
            instance.blockchain_hash = hash_val
            instance.save()
        except Exception as e:
            print(f"Hash calculation failed (update): {e}")
    
    def vault_files(self, request, *args, **kwargs):
        """Get only files owned by user (personal vault files)"""
        queryset = self.get_queryset_for_vault()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def shared_files(self, request, *args, **kwargs):
        """Get only files received by user (shared files)"""
        queryset = self.get_queryset_for_shared()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    def received_files(self, request, *args, **kwargs):
        """Get files received by user (alias for shared_files)"""
        queryset = self.get_queryset_for_shared()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


# Token authentication endpoint (optional - if you use DRF Token auth separately)
# You can remove this if you fully switch to JWT
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })


# User registration endpoint
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
