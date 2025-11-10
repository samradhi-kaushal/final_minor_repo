from rest_framework import serializers
from .models import VaultFile # Use the new model name
from django.contrib.auth.models import User # Django's built-in User model
from django.contrib.auth.hashers import make_password
class VaultFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaultFile
        # Note: We include 'uploaded_file' to allow the default DRF save mechanism
        fields = ['id', 'uploaded_file', 'file_name', 'uploaded_at']
        # 'user' will be excluded from input and provided by the view
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')
        extra_kwargs = {
            'email': {'required': True},
            'password': {'write_only': True}
        }

    # Custom create method to hash the password before saving
    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        
        # NOTE: Django saves the user and automatically hashes the password if you use 
        # User.objects.create_user(). Using ModelSerializer and serializer.create 
        # requires manual hashing via make_password() or overriding save() logic.
        
        user = User.objects.create(**validated_data)
        return user