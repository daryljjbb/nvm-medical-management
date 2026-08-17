from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from django.db.models import Q  # Vital for the Note search logic
from django.contrib.auth import get_user_model

# Rest Framework Imports
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token

# Local Imports
from .models import Note
from .serializers import UserCreationSerializer, NoteSerializer

# Initialize User model
User = get_user_model()

# ==========================================
# 1. AUTHENTICATION SECTION
# ==========================================

@api_view(['POST'])
@authentication_classes([])    # No token required to log in
@permission_classes([AllowAny]) # Anyone can reach this page
def login_view(request):
    """
    Public Endpoint: Authenticates user and returns a Token + Role.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"--- [LOGIN ATTEMPT] User: {username} ---")

    user = authenticate(username=username, password=password)
    
    if user is not None:
        token, _ = Token.objects.get_or_create(user=user)
        print(f"--- [LOGIN SUCCESS] Token generated for {username} ---")
        return Response({
            "token": token.key,
            "username": user.username,
            "role": user.role
        }, status=status.HTTP_200_OK)
    else:
        print(f"--- [LOGIN FAILED] Invalid credentials for {username} ---")
        return Response({"error": "Invalid Credentials"}, status=status.HTTP_401_UNAUTHORIZED)


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
# 3. ADMIN USER MANAGEMENT SECTION
# ==========================================

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_user_view(request):
    """
    ADMIN ONLY: Register new Staff or Clients.
    """
    if request.user.role != 'admin':
        print(f"--- [SECURITY ALERT] Non-admin {request.user.username} tried to create a user ---")
        return Response({"error": "Unauthorized. Admins only."}, status=status.HTTP_403_FORBIDDEN)

    serializer = UserCreationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        print(f"--- [USER CREATED] New user: {request.data.get('username')} ---")
        return Response({"message": "User created successfully"}, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    ADMIN ONLY: List all users for the System User Directory.
    """
    if request.user.role != 'admin':
        return Response({"error": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all().values('id', 'username', 'email', 'role')
    print(f"--- [USER LIST] Fetched by Admin: {request.user.username} ---")
    return Response(list(users))


@api_view(['PATCH'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def update_user_view(request, user_id):
    """
    ADMIN ONLY: Modify roles or reset passwords.
    """
    if request.user.role != 'admin':
        return Response({"error": "Access Denied"}, status=status.HTTP_403_FORBIDDEN)

    target_user = get_object_or_404(User, id=user_id)
    
    # Check for role update
    new_role = request.data.get('role')
    if new_role:
        target_user.role = new_role

    # Check for password reset
    new_password = request.data.get('password')
    if new_password:
        target_user.set_password(new_password)

    target_user.save()
    print(f"--- [USER UPDATED] Admin modified account: {target_user.username} ---")
    return Response({"message": "User updated successfully"}, status=status.HTTP_200_OK)


# ==========================================
# 4. COMMUNICATION / NOTES SECTION
# ==========================================

@api_view(['GET', 'POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def manage_notes(request):
    """
    GET: List my conversations.
    POST: Send a new note.
    """
    if request.method == 'GET':
        # Q objects allow us to use OR logic (Sent by me OR Received by me)
        notes = Note.objects.filter(Q(sender=request.user) | Q(receiver=request.user))
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    if request.method == 'POST':
        # Create a mutable copy of the data to inject the sender ID
        data = request.data.copy()
        data['sender'] = request.user.id
        
        serializer = NoteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            print(f"--- [NOTE SENT] From {request.user.username} ---")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
