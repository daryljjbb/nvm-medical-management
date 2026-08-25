from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note, Patient, Appointment
import logging

# Set up logging to track serialization errors in Render
# This is crucial for seeing exactly why a '400 Bad Request' happens
logger = logging.getLogger(__name__)

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    """
    Used for VIEWING and UPDATING user profiles.
    Excludes password for security.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone']
        # SECURITY: Users cannot change their own ID or Role
        read_only_fields = ['id', 'role'] 

class UserCreationSerializer(serializers.ModelSerializer):
    """
    Used ONLY for creating new users (Admin action).
    """
    password = serializers.CharField(write_only=True, required=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']

    def create(self, validated_data):
        try:
            logger.info(f"Creating account for: {validated_data.get('username')}")
            user = User.objects.create_user(**validated_data)
            return user
        except Exception as e:
            logger.error(f"User creation failed: {str(e)}")
            raise serializers.ValidationError({"detail": "Could not create user account."})

class PatientSerializer(serializers.ModelSerializer):
    """
    Handles clinical patient data.
    """
    class Meta:
        model = Patient
        fields = '__all__'

# ==========================================
# APPOINTMENT SERIALIZER (FIXED)
# ==========================================
class AppointmentSerializer(serializers.ModelSerializer):
    # These fields help the frontend display Names instead of UUID strings
    patient_name = serializers.ReadOnlyField(source='patient.last_name')
    staff_name = serializers.ReadOnlyField(source='staff.username')
    
    # Formats date for the UI: "Oct 25, 2023 at 02:30 PM"
    formatted_time = serializers.DateTimeField(
        source='date_time', 
        format="%b %d, %Y at %I:%M %p", 
        read_only=True
    )

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'staff', 'staff_name', 
            'date_time', 'formatted_time', 'reason', 'status'
        ]
        # ROOT CAUSE FIX: 
        # By adding 'staff' to read_only_fields, the Serializer won't 
        # complain that the field is missing when you click "Confirm Booking".
        read_only_fields = ['id', 'staff'] 

class NoteSerializer(serializers.ModelSerializer):
    """
    Handles internal medical communication.
    """
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    formatted_date = serializers.DateTimeField(
        source='timestamp', 
        format="%b %d, %Y", 
        read_only=True
    )

    class Meta:
        model = Note
        fields = [
            'id', 'sender', 'sender_name', 'receiver', 
            'receiver_name', 'content', 'formatted_date'
        ]
