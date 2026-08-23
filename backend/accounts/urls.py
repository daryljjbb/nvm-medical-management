
from django.urls import path
from . import views

urlpatterns = [
    # --- Authentication ---
    path('login/', views.login_view, name='api-login'),
    
    # --- Current User Profile ---
    # These use "as_view()" because they are Class-Based Views (APIView)
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    
    # --- System / Dashboard ---
    path('stats/', views.dashboard_stats, name='api-stats'),
    path('notes/', views.manage_notes, name='manage-notes'),

    # --- Admin User Management ---
    path('create-user/', views.create_user_view, name='api-create-user'),
    path('users/', views.list_users_view, name='list-users'),
    
    # ROOT CAUSE FIX: Changed <int:user_id> to <uuid:user_id> 
    # because our User Model now uses UUIDs as Primary Keys.
    path('users/<uuid:user_id>/update/', views.update_user_view, name='update-user'),
]
