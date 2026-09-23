from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm

from .models import RuhulProfile


class RegistrationForm(UserCreationForm):

    finance_role = forms.ChoiceField(
        choices=RuhulProfile.ROLE_CHOICES
    )

    assigned_counter = forms.CharField(
        max_length=100
    )

    discount_approval_limit = forms.DecimalField(
        max_digits=12,
        decimal_places=2,
        min_value=0
    )

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password1',
            'password2',
            'finance_role',
            'assigned_counter',
            'discount_approval_limit',
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

        # Minimum 6 characters
        if len(password) < 6:
            raise forms.ValidationError(
                'Password must be at least 6 characters long.'
            )

        # First character must be capital
        if not password[0].isupper():
            raise forms.ValidationError(
                'First character of password must be a capital letter.'
            )

        # At least one special character
        special_characters = "!@#$%^&*()_+-=[]{}|;:,.<>?/"

        if not any(
            char in special_characters
            for char in password
        ):
            raise forms.ValidationError(
                'Password must contain at least one special character.'
            )

        return password

    def save(self, commit=True):

        user = super().save(commit=commit)

        if commit:

            RuhulProfile.objects.create(
                user=user,
                finance_role=self.cleaned_data['finance_role'],
                assigned_counter=self.cleaned_data['assigned_counter'],
                discount_approval_limit=self.cleaned_data[
                    'discount_approval_limit'
                ]
            )

        return user


class LoginForm(AuthenticationForm):
    pass