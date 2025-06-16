from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('email', 'password', 'confirm_password', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'email': {'required': True}
        }
    
    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': "Passwords don't match"
            })
            
        if len(data.get('password', '')) < 8:
            raise serializers.ValidationError({
                'password': "Password must be at least 8 characters long"
            })
            
        # Remove confirm_password from the data
        if 'confirm_password' in data:
            data.pop('confirm_password')
            
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            is_active=False
        )
        return user 