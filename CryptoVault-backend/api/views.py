from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Standard DRF imports
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework import status
from .models import SecureFile
from .serializers import SecureFileSerializer

import hashlib

@method_decorator(csrf_exempt, name='dispatch')
class SecureFileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for handling secure file uploads (POST) and listing (GET).
    This uses Django's built-in file handling via the Model.
    """
    authentication_classes = []
    queryset = SecureFile.objects.all()
    serializer_class = SecureFileSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_create(self, serializer):
        # Save the record first (file is written to MEDIA_ROOT)
        instance = serializer.save()
        # After saving, compute hash
        file_path = instance.file.path
        try:
            with open(file_path, 'rb') as f:
                file_bytes = f.read()
                hash_val = hashlib.sha256(file_bytes).hexdigest()
            instance.blockchain_hash = hash_val
            instance.save()
        except Exception as e:
            # Optionally log error, but allow upload to succeed
            print(f"Hash calculation failed: {e}")

    # Optionally, compute a new hash if file is updated via PUT
    def perform_update(self, serializer):
        instance = serializer.save()
        file_path = instance.file.path
        try:
            with open(file_path, 'rb') as f:
                file_bytes = f.read()
                hash_val = hashlib.sha256(file_bytes).hexdigest()
            instance.blockchain_hash = hash_val
            instance.save()
        except Exception as e:
            print(f"Hash calculation failed (update): {e}")
