from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import os

User = get_user_model()

class VaultFile(models.Model):
    """
    Model to store uploaded files along with user association and blockchain hash for verification.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # File storage path inside MEDIA_ROOT/secure_vault_files/yyyy/mm/dd/
    uploaded_file = models.FileField(upload_to='secure_vault_files/')
    file_name = models.CharField(max_length=255)
    blockchain_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Cryptographic hash for blockchain verification."
    )
    uploaded_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.file_name

    def delete(self, *args, **kwargs):
        if self.uploaded_file and os.path.isfile(self.uploaded_file.path):
            os.remove(self.uploaded_file.path)
        super().delete(*args, **kwargs)
