
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='api-login'),
    path('stats/', views.dashboard_stats, name='api-stats'),
    path('create-user/', views.create_user_view, name='api-create-user'),
    
    # PROFILE (Updated with views. prefix)
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("update-profile/", views.UpdateProfileView.as_view()),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    
    path('users/', views.list_users_view, name='list-users'),
    path('users/<int:user_id>/update/', views.update_user_view, name='update-user'),
    path('notes/', views.manage_notes, name='manage-notes'),
]

