from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note, Patient, Appointment,ClinicalEncounter,Prescription
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
    latest_encounter = serializers.SerializerMethodField()
    visit_history = serializers.SerializerMethodField()

    # NEW: Include active medications in the chart automatically
    active_prescriptions = PrescriptionSerializer(
        source='prescriptions', 
        many=True, 
        read_only=True
    )

    class Meta:
        model = Patient
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 
            'gender', 'blood_group', 'address', 'city', 
            'emergency_contact_name', 'emergency_contact_phone',
            'latest_encounter', 'visit_history', 'active_prescriptions'
        ]

    def get_latest_encounter(self, obj):
        """Returns the full data of the most recent encounter."""
        latest_appt = obj.appointments.filter(encounter__isnull=False).order_by('-date_time').first()
        if latest_appt and hasattr(latest_appt, 'encounter'):
            e = latest_appt.encounter
            # ROOT CAUSE FIX: Send individual fields so frontend logic works
            return {
                "bp_systolic": e.bp_systolic,
                "bp_diastolic": e.bp_diastolic,
                "heart_rate": e.heart_rate,
                "temperature": float(e.temperature) if e.temperature else None,
                "o2_saturation": e.o2_saturation,
                "date": latest_appt.date_time.strftime("%b %d, %Y")
            }
        return None

    def get_visit_history(self, obj):
        """Returns all encounters for the history table, including clinical notes."""
        appts = obj.appointments.filter(encounter__isnull=False).order_by('-date_time')
        history = []
        for a in appts:
            e = a.encounter
            history.append({
                "encounter_id": e.id,
                "date": a.date_time.strftime("%m/%d/%Y"),
                "reason": a.reason,
                "diagnosis": e.diagnosis,
                "treatment_plan": e.treatment_plan,
                "chief_complaint": e.chief_complaint,
                "provider": a.staff.username,
                # Include vitals here too so the "View Full Record" modal can show them
                "vitals": {
                    "bp": f"{e.bp_systolic}/{e.bp_diastolic}",
                    "hr": e.heart_rate,
                    "temp": float(e.temperature) if e.temperature else "N/A",
                    "o2": e.o2_saturation
                }
            })
        return history
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

class PrescriptionSerializer(serializers.ModelSerializer):
    # Show the doctor's name instead of just a UUID
    doctor_name = serializers.ReadOnlyField(source='prescribed_by.username')
    
    # Format the date for the medical chart
    date_prescribed = serializers.DateTimeField(
        source='created_at', 
        format="%m/%d/%Y", 
        read_only=True
    )

    class Meta:
        model = Prescription
        fields = [
            'id', 'patient', 'medication_name', 'dosage', 
            'frequency', 'is_active', 'prescribed_by', 
            'doctor_name', 'date_prescribed'
        ]
        # ROOT CAUSE FIX: 'prescribed_by' is read_only so the frontend 
        # cannot "fake" which doctor signed the prescription.
        read_only_fields = ['id', 'prescribed_by']


