from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note
import logging

# Set up logging to track serialization errors in Render
logger = logging.getLogger(__name__)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Used for VIEWING and UPDATING user profiles.
    We exclude the password here entirely for maximum security.
    """
    class Meta:
        model = User
        # 'id' is a UUID, DRF handles this conversion automatically
        fields = ['id', 'username', 'email', 'role', 'phone']
        read_only_fields = ['id', 'role'] # Users cannot change their own ID or Role

class UserCreationSerializer(serializers.ModelSerializer):
    """
    Used ONLY for creating new users (Admin action).
    Handles the password hashing via the CustomUserManager.
    """
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        try:
            print(f"[SERIALIZER] Creating account for: {validated_data.get('username')}")
            
            # We use .create_user (our custom manager method) 
            # to ensure the password is SALTED and HASHED.
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data.get('email', ''),
                password=validated_data['password'],
                role=validated_data.get('role', 'user')
            )
            return user
        except Exception as e:
            logger.error(f"[SERIALIZER ERROR] User creation failed: {str(e)}")
            raise serializers.ValidationError({"detail": "Could not create user account."})

class NoteSerializer(serializers.ModelSerializer):
    """
    Handles medical notes/communications.
    Uses ReadOnlyFields to show names instead of just UUIDs.
    """
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    
    # Human-readable date for the UI
    formatted_date = serializers.DateTimeField(
        source='timestamp', 
        format="%b %d, %Y, %I:%M %p", 
        read_only=True
    )

    class Meta:
        model = Note
        fields = [
            'id', 'sender', 'sender_name', 'receiver', 
            'receiver_name', 'content', 'formatted_date', 'is_read'
        ]

    def validate_content(self, value):
        """Medical notes should not be empty."""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Note content is too short.")
        return value
