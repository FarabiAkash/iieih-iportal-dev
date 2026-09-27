from django.db import models
from django.contrib.auth.models import User

# ==========================================
# Developer: Nusrat
# Task: Design your user profile, roles, and fields below.
# ==========================================

# Example:
# class NusratProfile(models.Model):
#     user = models.OneToOneField(User, on_delete=models.CASCADE)
#     ...

class NusratProfile(models.Model):

    SHIFT_CHOICES = [
        ('morning', 'Morning (8 AM - 2 PM)'),
        ('evening', 'Evening (2 PM - 8 PM)'),
        ('night', 'Night Emergency'),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE
    )

    assigned_counter = models.CharField(
        max_length=100,
        help_text="Example: Registration Counter 2 - Glaucoma Desk"
    )

    shift = models.CharField(
        max_length=20,
        choices=SHIFT_CHOICES,
        default='morning'
    )

    desk_extension = models.CharField(
        max_length=20
    )


    def __str__(self):
        return self.user.username