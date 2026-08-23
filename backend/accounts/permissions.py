from rest_framework import permissions

class IsAdminRole(permissions.BasePermission):
    """
    Permission check for Users with 'admin' role.
    """
    def has_permission(self, request, view):
        # 1. Check if the user is even logged in
        if not request.user or not request.user.is_authenticated:
            return False
        
        # 2. Check the role
        is_admin = request.user.role == 'admin'
        
        if not is_admin:
            print(f"[SECURITY] Access Denied for user: {request.user.username}. Role '{request.user.role}' is not 'admin'.")
        
        return is_admin

class IsStaffOrAdminRole(permissions.BasePermission):
    """
    Permission check for Users with 'staff' or 'admin' roles.
    Useful for medical staff viewing records.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        allowed = request.user.role in ['admin', 'staff']
        
        if not allowed:
            print(f"[SECURITY] Access Denied for user: {request.user.username}. Requires Staff/Admin privileges.")
            
        return allowed
