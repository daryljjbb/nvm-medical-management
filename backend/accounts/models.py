from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models
from django.conf import settings # Add this import at the top
import uuid


class CustomUserManager(UserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('role', 'user')
        return super().create_user(username, email, password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin') # Force admin role

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        # FIX: Call create_superuser on the parent class, not create_user
        return super().create_superuser(username, email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('staff', 'Staff'),
        ('user', 'User'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    phone = models.CharField(max_length=15, blank=True, null=True)

    objects = CustomUserManager()
    
class Note(models.Model):
    # We use settings.AUTH_USER_MODEL to refer to your custom User safely
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='sent_notes'
    )
    
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='received_notes'
    )
    
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username} at {self.timestamp}"

class Patient(models.Model):
    # Medical choices to ensure data integrity
    BLOOD_GROUPS = [
        ('A+', 'A Positive'), ('A-', 'A Negative'),
        ('B+', 'B Positive'), ('B-', 'B Negative'),
        ('AB+', 'AB Positive'), ('AB-', 'AB Negative'),
        ('O+', 'O Positive'), ('O-', 'O Negative'),
        ('UNK', 'Unknown'),
    ]

    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]

    # 1. Identity & Linking
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Linking to User is optional (null=True) so staff can create files for elderly/infants 
    # who don't have email/login accounts.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="patient_profile"
    )

    # 2. General Medical Data
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=3, choices=BLOOD_GROUPS, default='UNK')
    
    # 3. Contact & Address
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    # 4. Emergency Contact (Crucial for Medical)
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_phone = models.CharField(max_length=20)

    # 5. Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} - DOB: {self.date_of_birth}"

    class Meta:
        ordering = ['-created_at']

class Appointment(models.Model):
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('no_show', 'No Show'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # The Patient involved
    patient = models.ForeignKey(
        Patient, 
        on_delete=models.CASCADE, 
        related_name="appointments"
    )
    
    # The Staff/Doctor assigned
    staff = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="assigned_appointments"
    )

    date_time = models.DateTimeField()
    reason = models.TextField(help_text="Reason for visit")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date_time']

    def __str__(self):
         # Good: Uses a simple string
       return f"Appt {self.id}"


class ClinicalEncounter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Linked to the specific appointment
    appointment = models.OneToOneField(
        Appointment, 
        on_delete=models.CASCADE, 
        related_name="encounter"
    )

      # --- STRUCTURED VITALS ---
    # Blood Pressure: Systolic / Diastolic (e.g., 120 / 80)
    bp_systolic = models.IntegerField(null=True, blank=True, verbose_name="Systolic BP")
    bp_diastolic = models.IntegerField(null=True, blank=True, verbose_name="Diastolic BP")
    
    # Heart Rate: Beats per minute
    heart_rate = models.IntegerField(null=True, blank=True, verbose_name="Heart Rate (BPM)")
    
    # Temperature in Fahrenheit (e.g., 98.6)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
    
    # Oxygen Saturation (e.g., 98%)
    o2_saturation = models.IntegerField(null=True, blank=True, verbose_name="O2 Saturation %")

    
    # Clinical Data
    vitals_summary = models.CharField(max_length=255, help_text="e.g., BP: 120/80, Temp: 98.6")
    chief_complaint = models.TextField()
    diagnosis = models.TextField()
    treatment_plan = models.TextField()
    
    signed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
         # Good: Uses a simple string
        return f"Encounter {self.id}"
