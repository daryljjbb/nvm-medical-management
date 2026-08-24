
from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='api-login'),
    
    # --- ADD THIS: The Dashboard Summary endpoint ---
    path('dashboard/', views.dashboard_summary, name='api-dashboard'),

    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    
    path('stats/', views.dashboard_stats, name='api-stats'),
    path('notes/', views.manage_notes, name='manage-notes'),

    path('create-user/', views.create_user_view, name='api-create-user'),
    path('users/', views.list_users_view, name='list-users'),
    path('users/<uuid:user_id>/update/', views.update_user_view, name='update-user'),

    path('patients/', views.manage_patients, name='manage-patients'),
    path('patients/<uuid:patient_id>/', views.patient_detail, name='patient-detail'),
]
