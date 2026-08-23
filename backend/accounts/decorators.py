from django.core.exceptions import PermissionDenied
from django.shortcuts import redirect
from functools import wraps

def role_required(allowed_roles=[]):
    """
    A 'Gatekeeper' that only allows users with specific roles to enter a view.
    Usage: @role_required(allowed_roles=['admin', 'staff'])
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # 1. Check if user is logged in
            if not request.user.is_authenticated:
                print(f"[AUTH LOG]: Unauthorized attempt to access {view_func.__name__}")
                return redirect('login')

            # 2. Check if their role is in the allowed list
            if request.user.role in allowed_roles:
                print(f"[AUTH LOG]: Access GRANTED to {request.user.username} for {view_func.__name__}")
                return view_func(request, *args, **kwargs)
            else:
                # 3. If they don't have the role, block them
                print(f"[AUTH LOG]: Access DENIED to {request.user.username} for {view_func.__name__}. Required: {allowed_roles}")
                raise PermissionDenied # This triggers a 403 Forbidden error

        return _wrapped_view
    return decorator
