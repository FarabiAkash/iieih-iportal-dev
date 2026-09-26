# Create your tests here.

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import NaimulProfile

class UsersNaimulStaticFilesSeparationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='dr_test',
            password='pass@123',
            first_name='Naimul',
            last_name='Islam'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.user,
            role='Consultant',
            specialty='Retina',
            department='Department of Ophthalmology & Microsurgery',
            license_number='BMDC-SURG-TEST'
        )

    def test_login_template_uses_separated_static_files(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertIn('users_naimul/login.css', content)
        self.assertIn('users_naimul/login.js', content)
        
        # Verify large inline style block has been separated
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)

    def test_profile_template_uses_separated_static_files(self):
        self.client.login(username='dr_test', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertIn('users_naimul/profile.css', content)
        self.assertIn('users_naimul/profile.js', content)
        
        # Verify no rogue leftover <style> block exists
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)
