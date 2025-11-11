from rest_framework import generics, parsers, viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .serializers import UserRegistrationSerializer, VaultFileSerializer
from .models import VaultFile
import hashlib


# File upload/list API for authenticated users, secured with JWT Authentication
class FileUploadView(generics.ListCreateAPIView):
    queryset = VaultFile.objects.all().order_by('-uploaded_at')
    serializer_class = VaultFileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def perform_create(self, serializer):
        uploaded_file = self.request.FILES.get('uploaded_file')
        instance = serializer.save(
            user=self.request.user,
            file_name=uploaded_file.name if uploaded_file else ""
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
    queryset = VaultFile.objects.all()
    serializer_class = VaultFileSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save(
            user=self.request.user,
            file_name=self.request.FILES['uploaded_file'].name if 'uploaded_file' in self.request.FILES else ""
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
