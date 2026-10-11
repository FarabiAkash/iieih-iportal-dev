from django.db import models
from django.contrib.auth.models import User

# ==========================================
# Developer: Ruhul
# Task: Design your user profile, roles, and fields below.
# ==========================================

# Example:
# class RuhulProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     ...

class RuhulProfile(models.Model):

    ROLE_CHOICES = [
        ('Cashier', 'Cashier'),
        ('Accounts Supervisor', 'Accounts Supervisor'),
        ('Zakat Relief Officer', 'Zakat Relief Officer'),
        ('Pharmacy Cashier', 'Pharmacy Cashier'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='ruhul_profile',null=True
    )

    finance_role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES ,null=True
    )

    assigned_counter = models.CharField(
        max_length=100 ,null=True
    )

    discount_approval_limit = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0 ,null=True
    )

    def __str__(self):
        return f"{self.user.username} - {self.finance_role}"