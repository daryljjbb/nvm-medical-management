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

# Local Imports
from .models import Note
from .serializers import UserSerializer, UserCreationSerializer, NoteSerializer
from .permissions import IsAdminRole # The custom bouncer we made

User = get_user_model()

# ==========================================
# 1. AUTHENTICATION (Login)
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def login_view(request):
    """
    Public Login: Returns Token, Username, and Role.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    
    if user:
        token, _ = Token.objects.get_or_create(user=user)
        print(f"[AUTH SUCCESS] User: {username} | Role: {user.role}")
        return Response({
            "token": token.key,
            "username": user.username,
            "role": user.role
        })
    
    print(f"[AUTH FAILED] Invalid attempt for: {username}")
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
@permission_classes([IsAdminRole])
def update_user_view(request, user_id):
    """
    ADMIN ONLY: Update or Delete a user by UUID.
    Matches URL: path('users/<uuid:user_id>/update/')
    """
    target_user = get_object_or_404(User, id=user_id)

    if request.method == 'DELETE':
        # Prevent Admin from deleting themselves!
        if target_user == request.user:
            return Response({"error": "You cannot delete your own account"}, status=status.HTTP_400_BAD_REQUEST)
        
        target_user.delete()
        print(f"[ADMIN ACTION] Deleted user: {target_user.username}")
        return Response(status=status.HTTP_204_NO_CONTENT)

    if request.method == 'PATCH':
        serializer = UserSerializer(target_user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            # Handle password reset if sent
            password = request.data.get('password')
            if password:
                target_user.set_password(password)
                target_user.save()
                
            return Response(serializer.data)
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
    if request.method == 'GET':
        notes = Note.objects.filter(Q(sender=request.user) | Q(receiver=request.user))
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    if request.method == 'POST':
        data = request.data.copy()
        data['sender'] = request.user.id
        serializer = NoteSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
