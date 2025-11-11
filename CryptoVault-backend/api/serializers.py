from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from os.path import basename
from .models import VaultFile

class VaultFileSerializer(serializers.ModelSerializer):
    # Full file URL for download/view
    uploaded_file = serializers.FileField()
    # Display only the filename
    file_name = serializers.SerializerMethodField()
    # Optional: Show the user’s primary key if needed
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    def get_file_name(self, obj):
        return basename(obj.uploaded_file.name)
    
    class Meta:
        model = VaultFile
        # Includes id, uploaded_file (actual file), file_name, uploaded_at, user, blockchain_hash
        fields = ['id', 'uploaded_file', 'file_name', 'uploaded_at', 'blockchain_hash', 'user']
        read_only_fields = ('uploaded_at', 'user')

# No changes to your UserRegistrationSerializer, as instructed
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {
            'email': {'required': True},
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        user = User.objects.create(**validated_data)
        return user
