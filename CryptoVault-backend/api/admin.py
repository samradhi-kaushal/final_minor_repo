# CryptoVault-backend\backend\api\admin.py

from django.contrib import admin
from .models import SecureFile # Import your custom model

# Register your model using the simplest method
# This tells Django: "Put SecureFile under the 'API' section in the Admin."
@admin.register(SecureFile)
class SecureFileAdmin(admin.ModelAdmin):
    # Optional: Customize the columns displayed on the list page
    list_display = ('id', 'file', 'uploaded_at', 'blockchain_hash')
    readonly_fields = ('uploaded_at',)
