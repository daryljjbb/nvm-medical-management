from rest_framework import serializers
from django.contrib.auth.models import User
from . models import Note

# This handles converting User data for the API
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'password': {'write_only': True}} # Never send password back to frontend

    def create(self, validated_data):
        # Create user with encrypted password
        user = User.objects.create_user(**validated_data)
        return user


from rest_framework import serializers
from .models import User

class UserCreationSerializer(serializers.ModelSerializer):
    # Explicitly define password so DRF doesn't try to look up its metadata
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        # List ONLY the fields you actually need. 
        # This prevents DRF from looking at 'groups' or 'user_permissions'
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        """
        Use the manager's create_user method to handle password hashing.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', 'user')
        )
        return user
    
    
class NoteSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    # Format the date nicely for the frontend: "Aug 12, 2026, 01:15 PM"
    formatted_date = serializers.DateTimeField(source='timestamp', format="%b %d, %Y, %I:%M %p", read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'formatted_date', 'is_read']
