
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
    # 5. CLINICAL SCHEDULING & VISITS
    # ==========================================
    path('appointments/', views.manage_appointments, name='appointments'),
    path('appointments/<uuid:pk>/', views.appointment_detail, name='appointment-detail'),
    path('encounters/', views.create_encounter, name='create-encounter'),
    path('encounters/<uuid:pk>/', views.encounter_detail, name='encounter-detail'),

    # ==========================================
    # 6. PHARMACY & AI SAFETY (THE NEW ADDITIONS)
    # ==========================================
    
    # This endpoint handles LISTING and SAVING medications
    path('prescriptions/', views.manage_prescriptions, name='prescriptions'),
    
    # This endpoint triggers the AI logic to check for drug interactions
    path('med-check/', views.check_medication_safety, name='med-check'),
]
