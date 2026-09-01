from rest_framework import permissions
import logging

# Standard Python logging - shows up in Render 'Logs' tab
logger = logging.getLogger(__name__)

class IsAdminRole(permissions.BasePermission):
    """
    STRICT SECURITY: Only allow users with the 'admin' role.
    Used for: User Management, System Settings, Deleting Records.
    """
    def has_permission(self, request, view):
        # 1. Trapping: If the user isn't even logged in, block immediately
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 2. Logic: Check if the custom role field is exactly 'admin'
        is_admin = request.user.role == 'admin'
        
        if not is_admin:
            # This helps you debug on Render if someone is trying to 'hack' the admin panel
            print(f"[SECURITY ALERT] Access Denied: User '{request.user.username}' (Role: {request.user.role}) tried to access an Admin-Only view.")
        
        return is_admin


class IsStaffOrAdminRole(permissions.BasePermission):
    """
    CLINICAL SECURITY: Allow both 'staff' (Doctors/Nurses) and 'admin'.
    Used for: Viewing Patients, Booking Appointments, Medical Notes.
    """
    def has_permission(self, request, view):
        # 1. Trapping: Ensure user is logged in
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 2. Logic: Check if the role is in our 'Authorized Medical Staff' list
        # ROOT CAUSE FIX: By checking the list, Daryl (staff) and Admin can both see the patient list.
        allowed_roles = ['admin', 'staff']
        is_allowed = request.user.role in allowed_roles
        
        if not is_allowed:
            print(f"[SECURITY] Access Denied: User '{request.user.username}' does not have clinical permissions.")
            
        return is_allowed

class IsPatient(permissions.BasePermission):
    """
    PATIENT SECURITY: Only allow users with the 'user' role.
    Used for: Viewing their own specific results later on.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'user'
