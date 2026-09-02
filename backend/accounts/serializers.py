from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Note, Patient, Appointment, ClinicalEncounter, Prescription
import logging

# Set up logging for Render diagnostics
logger = logging.getLogger(__name__)

User = get_user_model()

# ==========================================
# 1. USER SERIALIZERS
# ==========================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'phone']
        read_only_fields = ['id', 'role'] 

class UserCreationSerializer(serializers.ModelSerializer):
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

# ==========================================
# 2. PRESCRIPTION SERIALIZER (MOVED UP)
# ==========================================
# ROOT CAUSE FIX: This must be defined BEFORE PatientSerializer 
# so the Patient chart can "see" it.
class PrescriptionSerializer(serializers.ModelSerializer):
    doctor_name = serializers.ReadOnlyField(source='prescribed_by.username')
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
        read_only_fields = ['id', 'prescribed_by']

# ==========================================
# 3. CLINICAL ENCOUNTER SERIALIZER
# ==========================================
class ClinicalEncounterSerializer(serializers.ModelSerializer):
    signed_by_username = serializers.ReadOnlyField(source='signed_by.username')
    date_formatted = serializers.DateTimeField(source='created_at', format="%b %d, %Y", read_only=True)

    class Meta:
        model = ClinicalEncounter
        fields = [
            'id', 'appointment', 'bp_systolic', 'bp_diastolic', 
            'heart_rate', 'temperature', 'o2_saturation', 
            'chief_complaint', 'diagnosis', 'treatment_plan', 
            'signed_by', 'signed_by_username', 'date_formatted'
        ]
        read_only_fields = ['id', 'signed_by']

# ==========================================
# 4. APPOINTMENT SERIALIZER
# ==========================================
class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.ReadOnlyField(source='patient.last_name')
    staff_name = serializers.ReadOnlyField(source='staff.username')
    
    # Safely get encounter ID if it exists
    encounter_id = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_name', 'staff', 'staff_name', 
            'date_time', 'reason', 'status', 'encounter_id'
        ]
        read_only_fields = ['id', 'staff']

    def get_encounter_id(self, obj):
        try:
            return obj.encounter.id
        except:
            return None

# ==========================================
# 5. PATIENT SERIALIZER (USES OTHERS)
# ==========================================
class PatientSerializer(serializers.ModelSerializer):
    latest_encounter = serializers.SerializerMethodField()
    visit_history = serializers.SerializerMethodField()
    
    # This now works because PrescriptionSerializer was defined above!
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
        latest_appt = obj.appointments.filter(encounter__isnull=False).order_by('-date_time').first()
        if latest_appt and hasattr(latest_appt, 'encounter'):
            e = latest_appt.encounter
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
                "vitals": {
                    "bp": f"{e.bp_systolic}/{e.bp_diastolic}",
                    "hr": e.heart_rate,
                    "temp": float(e.temperature) if e.temperature else "N/A",
                    "o2": e.o2_saturation
                }
            })
        return history

# ==========================================
# 6. NOTE SERIALIZER
# ==========================================
class NoteSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    formatted_date = serializers.DateTimeField(source='timestamp', format="%b %d, %Y", read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'sender', 'sender_name', 'receiver', 'receiver_name', 'content', 'formatted_date']
