
from django.urls import path
from . import views

urlpatterns = [
    # ==========================================
    # 1. AUTHENTICATION & PROFILE
    # ==========================================
    path('login/', views.login_view, name='api-login'),
    path("profile/", views.ProfileView.as_view(), name="profile"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change_password"),
    
    # ==========================================
    # 2. SYSTEM DASHBOARD & STATS
    # ==========================================
    path('dashboard/', views.dashboard_summary, name='api-dashboard'),
    path('stats/', views.dashboard_stats, name='api-stats'),
    path('notes/', views.manage_notes, name='manage-notes'),

    # ==========================================
    # 3. ADMIN USER MANAGEMENT
    # ==========================================
    path('create-user/', views.create_user_view, name='api-create-user'),
    path('users/', views.list_users_view, name='list-users'),
    path('users/<uuid:user_id>/update/', views.update_user_view, name='update-user'),

    # ==========================================
    # 4. PATIENT MANAGEMENT
    # ==========================================
    path('patients/', views.manage_patients, name='manage-patients'),
    path('patients/<uuid:patient_id>/', views.patient_detail, name='patient-detail'),

    # ==========================================
    # 5. CLINICAL SCHEDULING
    # ==========================================
    path('appointments/', views.manage_appointments, name='appointments'),
    path('appointments/<uuid:pk>/', views.appointment_detail, name='appointment-detail'),

    # ==========================================
    # 6. CLINICAL ENCOUNTERS (THE FIX)
    # ==========================================
    # This endpoint is where the 'Start Visit' form sends its data
    path('encounters/', views.create_encounter, name='create-encounter'),
    
    # This endpoint allows the 'View Record' button to work
    # We will need a view for this called 'encounter_detail' (added below)
    path('encounters/<uuid:pk>/', views.encounter_detail, name='encounter-detail'),
]
