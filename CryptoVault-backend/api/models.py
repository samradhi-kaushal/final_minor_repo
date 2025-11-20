from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import os

User = get_user_model()

def get_upload_path(instance, filename):
    """
    Determine upload path based on whether file is shared or personal.
    Shared files go to sharedfiles/, personal files go to secure_vault_files/.
    """
    # Check if receiving_user is set (for shared files)
    if hasattr(instance, 'receiving_user') and instance.receiving_user:
        return f'sharedfiles/{filename}'

    if hasattr(instance, 'receiving_user_id') and instance.receiving_user_id:
        return f'sharedfiles/{filename}'

    return f'secure_vault_files/{filename}'

class VaultFile(models.Model):
    """
    Model to store uploaded files along with user association and blockchain hash for verification.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_files')
    # File storage path - uses get_upload_path to determine location
    uploaded_file = models.FileField(upload_to=get_upload_path)
    file_name = models.CharField(max_length=255)
    blockchain_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Cryptographic hash for blockchain verification."
    )
    receiving_user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name='received_files',
        null=True,
        blank=True,
        help_text="User who will receive this file (for shared files)"
    )
    uploaded_at = models.DateTimeField(default=timezone.now)
    # Encryption fields
    aes_key = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="AES key used to encrypt the Fernet key"
    )
    encrypted_fernet_key = models.TextField(
        blank=True,
        null=True,
        help_text="Fernet key encrypted with AES key (base64 encoded)"
    )

    def __str__(self):
        return self.file_name

    def delete(self, *args, **kwargs):
        if self.uploaded_file and os.path.isfile(self.uploaded_file.path):
            os.remove(self.uploaded_file.path)
        super().delete(*args, **kwargs)


class CloudUploadLog(models.Model):
    """
    Model to track S3 cloud upload activity for users.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cloud_uploads')
    file_name = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=500, help_text="S3 object key/path")
    s3_url = models.URLField(max_length=1000, help_text="Full S3 URL of the uploaded file")
    file_size = models.BigIntegerField(null=True, blank=True, help_text="File size in bytes")
    content_type = models.CharField(max_length=255, null=True, blank=True)
    uploaded_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-uploaded_at']
        verbose_name = "Cloud Upload Log"
        verbose_name_plural = "Cloud Upload Logs"
    
    def __str__(self):
        return f"{self.user.username} - {self.file_name} ({self.uploaded_at})"