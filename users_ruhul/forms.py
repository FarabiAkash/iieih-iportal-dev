from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import (
    UserCreationForm,
    AuthenticationForm,
    SetPasswordForm,
)

from .models import RuhulProfile


# =========================================================
# REGISTRATION FORM
# =========================================================

class RegistrationForm(UserCreationForm):

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password1',
            'password2',
        ]

    def clean_username(self):

        username = self.cleaned_data['username']

        if len(username) < 3:
            raise forms.ValidationError(
                'Username must be at least 3 characters.'
            )

        if not username.isalnum():
            raise forms.ValidationError(
                'Username can contain only letters and numbers.'
            )

        return username

    def clean_password1(self):

        password = self.cleaned_data.get('password1')

        if not password:
            return password

        if len(password) < 6:
            raise forms.ValidationError(
                'Password must be at least 6 characters long.'
            )

        if not password[0].isupper():
            raise forms.ValidationError(
                'First character of password must be a capital letter.'
            )

        special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/"

        if not any(
            char in special_characters
            for char in password
        ):
            raise forms.ValidationError(
                'Password must contain at least one special character.'
            )

        return password


# =========================================================
# LOGIN FORM
# =========================================================

class LoginForm(AuthenticationForm):
    pass


# =========================================================
# PROFILE UPDATE FORM
# =========================================================

class ProfileUpdateForm(forms.ModelForm):

    first_name = forms.CharField(
        max_length=150,
        required=True,
        label="First Name"
    )

    last_name = forms.CharField(
        max_length=150,
        required=True,
        label="Last Name"
    )

    username = forms.CharField(
        max_length=150,
        required=True,
        label="Username"
    )

    email = forms.EmailField(
        required=True,
        label="Email"
    )

    class Meta:
        model = RuhulProfile

        fields = [
            'first_name',
            'last_name',
            'username',
            'email',
            'finance_role',
            'assigned_counter',
            'discount_approval_limit',
        ]

        widgets = {
            'discount_approval_limit': forms.NumberInput(
                            attrs={
                                'class': 'form-control',
                                'placeholder': 'Enter discount approval limit',
                                'step': '0.01',
                                'min': '0'
                            }
                        ),


        }

    def __init__(self, *args, **kwargs):

        user = kwargs.pop('user', None)

        super().__init__(*args, **kwargs)

        if user:
            self.fields['first_name'].initial = user.first_name
            self.fields['last_name'].initial = user.last_name
            self.fields['username'].initial = user.username
            self.fields['email'].initial = user.email


# =========================================================
# TEST PASSWORD RESET FORM
# =========================================================

class TestPasswordResetForm(forms.Form):

    email = forms.EmailField(
        required=True,
        label="Email Address",
        widget=forms.EmailInput(
            attrs={
                'class': 'form-control',
                'placeholder': 'Enter any email address',
                'autocomplete': 'email',
            }
        )
    )


# =========================================================
# TEST SET PASSWORD FORM
# =========================================================

class TestSetPasswordForm(SetPasswordForm):

    def clean_new_password1(self):

        password = self.cleaned_data.get('new_password1')

        if not password:
            return password

        if len(password) < 6:
            raise forms.ValidationError(
                'Password must be at least 6 characters long.'
            )

        if not password[0].isupper():
            raise forms.ValidationError(
                'First character of password must be a capital letter.'
            )

        special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/"

        if not any(
            char in special_characters
            for char in password
        ):
            raise forms.ValidationError(
                'Password must contain at least one special character.'
            )

        return password