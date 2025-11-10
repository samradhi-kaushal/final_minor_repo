# CryptoVault-backend\backend\api\models.py

from django.db import models

class SecureFile(models.Model):
    """
    Model to store uploaded files and their security metadata.
    """
    # The 'upload_to' argument creates a sub-directory within your MEDIA_ROOT
    file = models.FileField(upload_to='secure_vault_files/')
    
    # Placeholder fields based on your frontend's security theme
    # Assuming the file is encrypted locally, this stores the hash for verification
    blockchain_hash = models.CharField(max_length=255, blank=True, null=True, 
                                       help_text="Cryptographic hash for blockchain verification.")
    
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name
