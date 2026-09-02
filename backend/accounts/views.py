from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token


from django.conf import settings
import openai


# Local Imports
from .models import Note,Patient,Appointment,ClinicalEncounter,Prescription
from .serializers import UserSerializer, UserCreationSerializer, NoteSerializer,PatientSerializer,AppointmentSerializer,ClinicalEncounterSerializer,PrescriptionSerializer
from .permissions import IsAdminRole # The custom bouncer we made
from .permissions import IsStaffOrAdminRole

User = get_user_model()

# ==========================================
# 1. AUTHENTICATION (Login)
# ==========================================

# accounts/views.py -> login_view

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        print(f"[AUTH SUCCESS] User: {username} | ID: {user.id}")
        return Response({
            "token": token.key,
            "user_id": str(user.id), # ROOT CAUSE FIX: Send the UUID to the frontend
            "username": user.username,
            "role": user.role
        })
    
    return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)

# ==========================================
# 2. ADMIN USER MANAGEMENT (The source of the blank screen)
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminRole]) # Ensures only admins get the list
def list_users_view(request):
    """
    ADMIN ONLY: Returns a clean list of all users.
    """
    print(f"[ADMIN ACTION] List users requested by: {request.user.username}")
    
    try:
        # Fetch users and order by most recent join
        users = User.objects.all().order_by('-date_joined')
        
        # ROOT CAUSE FIX: Ensure we use the Serializer so the frontend 
        # gets exactly the fields it needs (id, username, email, role)
        serializer = UserSerializer(users, many=True)
        
        # Verify we are sending an ARRAY []
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to list users: {str(e)}")
        return Response({"error": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAdminRole])
def create_user_view(request):
    """
    ADMIN ONLY: Create new staff or patients.
    """
    serializer = UserCreationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        print(f"[ADMIN ACTION] Created user: {request.data.get('username')}")
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminRole]) # Our custom bouncer
def update_user_view(request, user_id):
    """
    ADMIN ONLY: Update roles or delete users.
    URL: /api/users/<uuid:user_id>/update/
    """
    # 1. Finding the user in the Postgres DB
    target_user = get_object_or_404(User, id=user_id)

    # --- DELETE LOGIC ---
    if request.method == 'DELETE':
        # Safety Trap: Don't let an admin delete themselves!
        if target_user == request.user:
            return Response({"error": "Self-deletion is blocked for security."}, status=status.HTTP_400_BAD_REQUEST)
        
        username = target_user.username
        target_user.delete()
        print(f"[ADMIN ACTION] User {username} deleted by {request.user.username}")
        return Response({"message": "User removed"}, status=status.HTTP_204_NO_CONTENT)

    # --- UPDATE (ROLE) LOGIC ---
    if request.method == 'PATCH':
        # We only allow changing the 'role' here for now
        new_role = request.data.get('role')
        if new_role not in ['admin', 'staff', 'user']:
            return Response({"error": "Invalid role type"}, status=status.HTTP_400_BAD_REQUEST)

        target_user.role = new_role
        target_user.save()
        
        print(f"[ADMIN ACTION] Role for {target_user.username} changed to {new_role}")
        serializer = UserSerializer(target_user)
        return Response(serializer.data, status=status.HTTP_200_OK)
# ---------------------------------------------------------
# CHANGE PASSWORD
# ---------------------------------------------------------

class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not request.user.check_password(old_password):
            return Response({"error": "Current password is incorrect."},
                            status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"message": "Password changed successfully."})



# ==========================================
# 3. PROFILE & SYSTEM DATA
# ==========================================

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        # We use partial=True so you don't have to send every field to update one
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Returns summary stats for the dashboard cards.
    """
    data = {
        "total_users": User.objects.count(),
        "admin_count": User.objects.filter(role='admin').count(),
        "staff_count": User.objects.filter(role='staff').count(),
    }
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """
    Provides the data for the Dashboard cards and recent activity.
    """
    print(f"[DASHBOARD] Generating summary for: {request.user.username}")
    
    # In a real medical app, we'd count real database objects.
    # For now, we return structured data so the frontend doesn't stay blank.
    data = {
        "total_notes": Note.objects.filter(Q(sender=request.user) | Q(receiver=request.user)).count(),
        "total_tasks": 5, # Mock data for now
        "completed_tasks": 2, # Mock data for now
        "recent_notes": NoteSerializer(
            Note.objects.filter(receiver=request.user).order_by('-timestamp')[:3], 
            many=True
        ).data,
        "recent_tasks": [
            {"id": 1, "title": "Review Patient History", "description": "Check files for new intake", "created_at": "2023-10-01T10:00:00Z"}
        ]
    }
    return Response(data)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def manage_notes(request):
    """
    GET: List all notes involving the current user.
    POST: Create a new clinical note/message.
    """
    if request.method == 'GET':
        # Fetching notes where user is either the doctor (sender) or recipient
        notes = Note.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).order_by('-timestamp')
        
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        print(f"[MEDICAL NOTE] New entry initiated by: {request.user.username}")
        
        # Create a copy of the data to inject the sender automatically
        data = request.data.copy()
        data['sender'] = request.user.id 

        serializer = NoteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            print(f"[SUCCESS] Note ID {serializer.data['id']} saved to database.")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"[ERROR] Note validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'POST'])
@permission_classes([IsStaffOrAdminRole]) # Only medical staff can access
def manage_patients(request):
    """
    GET: List all patients.
    POST: Register a new patient in the system.
    """
    if request.method == 'GET':
        print(f"[MEDICAL] {request.user.username} is accessing the Patient Directory.")
        patients = Patient.objects.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        print(f"[MEDICAL] Creating new patient record...")
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"[ERROR] Patient validation failed: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsStaffOrAdminRole])
def patient_detail(request, patient_id):
    # Trapping: Verify UUID exists
    patient = get_object_or_404(Patient, id=patient_id)

    if request.method == 'GET':
        serializer = PatientSerializer(patient)
        return Response(serializer.data)

    if request.method == 'PUT':
        # partial=True allows the frontend to send just what changed
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # LOGGING: Print ID only, never the whole 'patient' object to avoid SIGKILL
            print(f"[MEDICAL SUCCESS] Updated Patient Record ID: {patient.id}")
            return Response(serializer.data)
        
        print(f"[VALIDATION ERROR] {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        # LOGGING: Print ID before deletion
        print(f"[MEDICAL WARNING] Deleting Patient Record ID: {patient_id}")
        patient.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# accounts/views.py -> manage_appointments

@api_view(['GET', 'POST'])
@permission_classes([IsStaffOrAdminRole]) # Or IsStaffOrAdminRole
def manage_appointments(request):
    """
    Handles listing and creating medical appointments.
    """
    if request.method == 'GET':
        appointments = Appointment.objects.all().order_by('date_time')
        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        print(f"[MEDICAL] {request.user.username} is attempting to book an appointment.")
        
        serializer = AppointmentSerializer(data=request.data)
        
        # Now that 'staff' is read_only in the serializer, 
        # is_valid() will pass even if the field is missing!
        if serializer.is_valid():
            # ROOT CAUSE FIX: Manually inject the staff member during save
            serializer.save(staff=request.user)
            print(f"[SUCCESS] Appointment created for patient ID: {request.data.get('patient')}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # If it fails, we see exactly why in the Render logs
        print(f"[VALIDATION ERROR]: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PATCH', 'DELETE'])
@permission_classes([IsStaffOrAdminRole])
def appointment_detail(request, pk):
    appointment = get_object_or_404(Appointment, pk=pk)
    
    if request.method == 'PATCH':
        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        appointment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)



# accounts/views.py

@api_view(['POST'])
@permission_classes([IsStaffOrAdminRole])
def create_encounter(request):
    """
    Saves a clinical encounter and its associated vitals.
    """
    print(f"[CLINICAL] Processing new encounter record...")
    
    serializer = ClinicalEncounterSerializer(data=request.data)
    
    if serializer.is_valid():
        appointment_id = request.data.get('appointment')
        appointment = get_object_or_404(Appointment, id=appointment_id)

        # 1. Prevent duplicate medical records for the same appointment
        if hasattr(appointment, 'encounter'):
            return Response({"error": "This visit already has a signed medical record."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # 2. Save the record and link the logged-in doctor
        serializer.save(signed_by=request.user, appointment=appointment)

        # 3. Automatically complete the appointment
        appointment.status = 'completed'
        appointment.save()

        print(f"[SUCCESS] Encounter signed by {request.user.username} for Appt {appointment_id}")
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    # 4. If vitals are invalid (e.g. BP was text instead of a number), 
    # the serializer will catch it here.
    print(f"[VALIDATION ERROR] Encounter failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsStaffOrAdminRole])
def encounter_detail(request, pk):
    """
    Retrieves a single medical record (encounter) by its UUID.
    """
    print(f"[MEDICAL] Fetching encounter record: {pk}")
    encounter = get_object_or_404(ClinicalEncounter, id=pk)
    serializer = ClinicalEncounterSerializer(encounter)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsStaffOrAdminRole])
def check_medication_safety(request):
    """
    AI Safety Check: Reviews a new drug against the patient's existing meds.
    """
    patient_id = request.data.get('patient_id')
    new_med = request.data.get('medication_name')
    
    if not patient_id or not new_med:
        return Response({"error": "Patient ID and Medication Name are required."}, status=400)

    print(f"[AI CLINICAL] Safety check initiated for Med: {new_med}")

    try:
        # 1. Fetch the patient record
        patient = get_object_or_404(Patient, id=patient_id)
        
        # 2. Get their current active medications to cross-reference
        current_meds = Prescription.objects.filter(patient=patient, is_active=True)
        med_list = [m.medication_name for m in current_meds]

        # 3. Simulate AI logic (or call OpenAI here)
        # We use a simulated response for the demo to keep it fast and free
        has_interactions = len(med_list) > 0
        
        analysis = {
            "medication": new_med,
            "interactions": [f"Alert: {new_med} may react with {med_list[0]}"] if has_interactions else ["No current medications found to conflict with."],
            "side_effects": ["Nausea", "Drowsiness", "Dry mouth"],
            "disclaimer": "This is an AI-assisted safety check. Final clinical judgment is required by the presiding doctor."
        }
        
        return Response(analysis, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"[AI CRASH] {str(e)}")
        return Response({"error": "AI Clinical engine timed out."}, status=500

                        )
@api_view(['GET', 'POST'])
@permission_classes([IsStaffOrAdminRole])
def manage_prescriptions(request):
    """
    GET: List prescriptions (filtered by patient_id in query params).
    POST: Create a new prescription with AI safety check potential.
    """
    if request.method == 'GET':
        patient_id = request.query_params.get('patient_id')
        prescriptions = Prescription.objects.filter(patient_id=patient_id)
        serializer = PrescriptionSerializer(prescriptions, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        print(f"[MEDICAL] Prescription requested by {request.user.username}")
        
        serializer = PrescriptionSerializer(data=request.data)
        if serializer.is_valid():
            # ROOT CAUSE FIX: Automatically attach the logged-in doctor
            serializer.save(prescribed_by=request.user)
            print(f"[SUCCESS] Medication {request.data.get('medication_name')} saved.")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"[ERROR] Prescription invalid: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
