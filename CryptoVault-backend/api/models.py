from django.db import models
from django.contrib.auth import get_user_model # CRITICAL: Needed for the user link
from django.utils import timezone
import os

User = get_user_model() # Define the User model alias

class VaultFile(models.Model): # <--- Ensure this name is correct
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # This field will store the uploaded file itself
    uploaded_file = models.FileField(upload_to='vault/%Y/%m/%d/') 
    file_name = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.file_name

    # Optional but recommended: clean up files when the record is deleted
    def delete(self, *args, **kwargs):
        if self.uploaded_file:
            if os.path.isfile(self.uploaded_file.path):
                os.remove(self.uploaded_file.path)
        super().delete(*args, **kwargs)