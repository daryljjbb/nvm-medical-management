from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note, Patient, Appointment,ClinicalEncounter
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
    # This creates the 'latest_encounter' field the frontend is looking for
    latest_encounter = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'blood_group', 'address', 'city', 
            'emergency_contact_name', 'emergency_contact_phone',
            'latest_encounter' # Add it here
        ]

    def get_latest_encounter(self, obj):
        """
        Logic: Find the most recent appointment for this patient 
        that actually has a clinical record signed.
        """
        # 1. Get appointments for this patient, ordered by newest date
        # 2. Filter for those that HAVE an encounter record
        # 3. Take the first (newest) one
        latest_appt = obj.appointments.filter(encounter__isnull=False).order_by('-date_time').first()

        if latest_appt and hasattr(latest_appt, 'encounter'):
            encounter = latest_appt.encounter
            # Return only the vitals so the frontend stays light
            return {
                "id": encounter.id,
                "bp_systolic": encounter.bp_systolic,
                "bp_diastolic": encounter.bp_diastolic,
                "heart_rate": encounter.heart_rate,
                "temperature": float(encounter.temperature) if encounter.temperature else None,
                "o2_saturation": encounter.o2_saturation,
                "diagnosis": encounter.diagnosis,
                "treatment_plan": encounter.treatment_plan,
                "date": latest_appt.date_time.strftime("%b %d, %Y")
            }
        return None # No encounters found yet


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

      # ROOT CAUSE FIX: This allows the frontend to see if a visit is already documented
    # It returns the UUID of the encounter, or null if it hasn't happened yet
    encounter_id = serializers.ReadOnlyField(source='encounter.id')

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'staff', 'staff_name', 
            'date_time', 'formatted_time', 'reason', 'status','encounter_id'
        ]
        # ROOT CAUSE FIX: 
        # By adding 'staff' to read_only_fields, the Serializer won't 
        # complain that the field is missing when you click "Confirm Booking".
        read_only_fields = ['id', 'staff']

    def get_encounter_id(self, obj):
        try:
            return obj.encounter.id
        except:
            return None

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

class ClinicalEncounterSerializer(serializers.ModelSerializer):
    # Show the name of the doctor who signed the record
    signed_by_username = serializers.ReadOnlyField(source='signed_by.username')
    
    # Format the timestamp: "Oct 25, 2023"
    date_formatted = serializers.DateTimeField(source='created_at', format="%b %d, %Y", read_only=True)

    class Meta:
        model = ClinicalEncounter
        fields = [
            'id', 'appointment', 'bp_systolic', 'bp_diastolic', 
            'heart_rate', 'temperature', 'o2_saturation', 
            'chief_complaint', 'diagnosis', 'treatment_plan', 
            'signed_by', 'signed_by_username', 'date_formatted'
        ]
        # signed_by is set automatically in the view, like we did for staff
        read_only_fields = ['id', 'signed_by']

