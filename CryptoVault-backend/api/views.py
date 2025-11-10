from rest_framework import generics , parsers # Use generics for simple C/L
from rest_framework.permissions import IsAuthenticated # Security enforcement
from rest_framework.authentication import TokenAuthentication 
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from .serializers import UserRegistrationSerializer
from rest_framework.permissions import AllowAny
# Authentication method
# Standard imports for linking to the model
from .models import VaultFile # 🛑 FIX 1: Import the CORRECT model name
from .serializers import VaultFileSerializer # 🛑 FIX 2: Import the CORRECT serializer name

class FileUploadView(generics.ListCreateAPIView):
    """
    Handles secure file uploads (POST) and listing (GET) for authenticated users.
    """
    # 🛑 FIX 3: Use the CORRECT model in the queryset
    queryset = VaultFile.objects.all().order_by('-uploaded_at')
    # 🛑 FIX 4: Use the CORRECT serializer
    serializer_class = VaultFileSerializer
    
    # 🛑 SECURITY FIX: Enforce Token Authentication (REPLACES csrf_exempt and authentication_classes=[])
    authentication_classes = [TokenAuthentication] 
    permission_classes = [IsAuthenticated] 

    # Allows multipart form data necessary for file uploads
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    # Override perform_create to link the file to the user
    def perform_create(self, serializer):
        # 🛑 FIX 5: Link the file to the authenticated user
        # The serializer handles saving the file to MEDIA_ROOT
        uploaded_file = self.request.FILES.get('uploaded_file') 
    
    # ... rest of the code ...
    # CRITICAL: Ensure the storage path is correctly set using the variable name
        storage_path = default_storage.save(file_path, uploaded_file)
        serializer.save(
            user=self.request.user, 
            file_name=self.request.FILES.get('uploaded_file').name
        )
class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        # 1. Calls the parent view's POST method to perform authentication and get the token
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # 2. Get or create the token for the authenticated user
        token, created = Token.objects.get_or_create(user=user)

        # 3. Customize the response to include user data
        return Response({
            'token': token.key,
            'user_id': user.pk, # <--- THIS SENDS THE USER ID
            'username': user.username
            # You can add more user data here if needed
        })
class UserRegistrationView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    # Allow anyone to register (no token needed)
    permission_classes = [AllowAny]