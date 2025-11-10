from rest_framework import serializers
from os.path import basename
from .models import SecureFile

class SecureFileSerializer(serializers.ModelSerializer):
    # Return the full URL for linking
    file = serializers.FileField()

    # Return only the filename for display purposes
    file_name = serializers.SerializerMethodField()

    def get_file_name(self, obj):
        return basename(obj.file.name)

    class Meta:
        model = SecureFile
        fields = ('id', 'file', 'file_name', 'uploaded_at', 'blockchain_hash')
        read_only_fields = ('uploaded_at',)
