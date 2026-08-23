from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.db.models import Q 
from django.contrib.auth import get_user_model

# Rest Framework Imports
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

# Local Imports
from .models import Note
from .serializers import UserSerializer, UserCreationSerializer, NoteSerializer
# Import our new bouncers
from .permissions import IsAdminRole, IsStaffOrAdminRole

# Initialize User model
User = get_user_model()

# ==========================================
# 1. AUTHENTICATION SECTION
# ==========================================

@api_view(['POST'])
@authentication_classes([])    
@permission_classes([AllowAny]) 
def login_view(request):
    """
    Public Endpoint: Returns Token + Role.
    Added error trapping for missing fields.
    """
    try:
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Username and password required"}, status=status.HTTP_400_BAD_REQUEST)

        print(f"[LOGIN] Attempt for user: {username}")

        user = authenticate(username=username, password=password)
        
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            print(f"[LOGIN SUCCESS] User: {username} | Role: {user.role}")
            return Response({
                "token": token.key,
                "username": user.username,
                "role": user.role,
                "user_id": user.id
            }, status=status.HTTP_200_OK)
        else:
            print(f"[LOGIN FAILED] Invalid credentials for: {username}")
            return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        print(f"[CRITICAL ERROR] Login logic failed: {str(e)}")
        return Response({"error": "Server error during login"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------------------------------------------------------
# PROFILE MANAGEMENT
# ---------------------------------------------------------

class ProfileView(APIView): 
    """
    Handles viewing and updating the logged-in user's own profile.
    Uses Class-Based View (CBV) for cleaner GET/PUT separation.
    """
    permission_classes = [IsAuthenticated] 
    
    def get(self, request): 
        print(f"[PROFILE] GET request from {request.user.username}")
        serializer = UserSerializer(request.user, context={'request': request}) 
        return Response(serializer.data) 
        
    def put(self, request): 
        print(f"[PROFILE] UPDATE request from {request.user.username}")
        user = request.user 
        
        # Using a serializer for updates is better than manual assignment
        # This validates the data before saving
        serializer = UserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        
        print(f"[PROFILE UPDATE ERROR] {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
# 2. DASHBOARD DATA SECTION
# ==========================================

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """
    Private Endpoint: Returns summary data for the UI cards.
    """
    print(f"--- [STATS ACCESS] Requested by: {request.user.username} ---")
    
    # Mock data - in the next phase, we will replace these with real database counts
    return Response({
        "stats": {
            "total_clients": 54,
            "active_policies": 124,
            "pending_claims": 12,
            "staff_members": 5
        },
        "recent_activity": [
            {"id": 1, "msg": "System synced with Cloud DB", "time": "Just now"},
            {"id": 2, "msg": "Daily backup completed", "time": "2 hours ago"},
        ]
    })





# ==========================================
# 2. ADMIN USER MANAGEMENT SECTION
# ==========================================

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminRole]) # The bouncer is now at the door!
def create_user_view(request):
    """
    ADMIN ONLY: Register new Staff or Clients.
    Logic is cleaner because permission checking is handled by IsAdminRole.
    """
    serializer = UserCreationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        print(f"[ADMIN ACTION] New user created: {request.data.get('username')} by {request.user.username}")
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    
    print(f"[ADMIN ERROR] User creation failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminRole])
def list_users_view(request):
    """
    ADMIN ONLY: List all users.
    """
    users = User.objects.all().order_by('-date_joined')
    serializer = UserSerializer(users, many=True)
    print(f"[ADMIN ACTION] User list fetched by {request.user.username}")
    return Response(serializer.data)


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAdminRole])
def update_user_view(request, user_id):
    """
    ADMIN ONLY: Modify roles or reset passwords for any user.
    'user_id' is passed as a UUID from the URL.
    """
    print(f"[ADMIN ACTION] Attempting update on User ID: {user_id}")
    
    # 1. Trapping: Find user or return 404
    target_user = get_object_or_404(User, id=user_id)
    
    # 2. Check for password reset (Handle this outside the serializer for safety)
    new_password = request.data.get('password')
    if new_password:
        if len(new_password) < 8:
            return Response({"error": "Password too short"}, status=status.HTTP_400_BAD_REQUEST)
        target_user.set_password(new_password)
        print(f"[ADMIN] Password reset for {target_user.username}")

    # 3. Use Serializer for other fields (role, email, etc.)
    # partial=True allows us to only send the 'role' without sending everything else
    serializer = UserSerializer(target_user, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        # If the admin updated the role specifically:
        if 'role' in request.data:
            target_user.role = request.data.get('role')
            target_user.save()
            
        print(f"[ADMIN SUCCESS] Updated {target_user.username}")
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    print(f"[ADMIN ERROR] Update failed: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==========================================
# 3. COMMUNICATION / NOTES SECTION
# ==========================================
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



@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_notes(request):
    """
    Standard users can see their own notes. 
    Admins can potentially see all (depending on requirements).
    """
    if request.method == 'GET':
        # Show notes where the user is either the sender OR the receiver
        notes = Note.objects.filter(
            Q(sender=request.user) | Q(receiver=request.user)
        ).order_by('-timestamp')
        
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        # Debug the incoming note data
        print(f"[NOTE] Attempting to send note from {request.user.username}")
        
        data = request.data.copy()
        data['sender'] = request.user.id # Force sender to be the logged-in user
        
        serializer = NoteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        print(f"[NOTE ERROR] Failed to send: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
