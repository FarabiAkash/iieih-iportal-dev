# from django.db import models
# from django.contrib.auth.models import User

# # ==========================================
# # Developer: Adnan
# # Task: Design your user profile, roles, and fields below.
# # (e.g. Hospital Pharmacist, Inventory Manager, Dispensary Officer)
# # ==========================================

# # Example:
# # class AdnanProfile(models.Model):
# #     user = models.OneToOneField(User, on_delete=models.CASCADE)
# #     ...


from django.db import models
from django.contrib.auth.models import User

class AdnanProfile(models.Model):

    ROLE_CHOICES = [
        ('senior_pharmacist', 'Senior Pharmacist'),
        ('ot_officer', 'OT Consumables Officer'),
        ('store_manager', 'Central Store Manager'),
    ]

    COUNTER_CHOICES = [
        ('counter_1', 'Counter 1 - OPD Pharmacy'),
        ('counter_2', 'Counter 2 - IPD Pharmacy'),
        ('ot_supply', 'OT Supply Depot'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    pharmacy_role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    dispensary_counter = models.CharField(max_length=50, choices=COUNTER_CHOICES)
    license_number = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return f"{self.user.username} - {self.pharmacy_role}"