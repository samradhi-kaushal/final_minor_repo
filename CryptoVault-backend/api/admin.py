from django.contrib import admin
from .models import VaultFile  # Import your correct model

@admin.register(VaultFile)
class VaultFileAdmin(admin.ModelAdmin):
    # Customize columns shown in the admin list view
    list_display = ('id', 'uploaded_file', 'file_name', 'uploaded_at', 'blockchain_hash', 'user')
    readonly_fields = ('uploaded_at',)
