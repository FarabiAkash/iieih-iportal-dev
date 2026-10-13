# Create your tests here.

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import NaimulProfile

class UsersNaimulStaticFilesSeparationTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='naimul',
            password='pass@123',
            first_name='Naimul',
            last_name='Islam'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.user,
            role='Surgeon',
            specialty='Retina',
            department='Department of Ophthalmology & Microsurgery',
            license_number='BMDC-SURG-TEST'
        )

    def test_login_template_uses_separated_static_files(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertTrue(
            'users_naimul/css/login.css' in content or 'users_naimul/login.css' in content,
            "login.css should be referenced"
        )
        self.assertTrue(
            'users_naimul/js/login.js' in content or 'users_naimul/login.js' in content,
            "login.js should be referenced"
        )
        
        # Verify large inline style block has been separated
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)

    def test_profile_template_uses_separated_static_files(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify external CSS and JS are referenced
        self.assertTrue(
            'users_naimul/css/profile.css' in content or 'users_naimul/profile.css' in content,
            "profile.css should be referenced"
        )
        self.assertTrue(
            'users_naimul/js/profile.js' in content or 'users_naimul/profile.js' in content,
            "profile.js should be referenced"
        )
        
        # Verify no rogue leftover <style> block exists
        self.assertNotIn('<style>', content)
        self.assertNotIn('</style>', content)

    def test_login_page_defaults_to_light_theme(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify default data-theme is light
        self.assertIn('data-theme="light"', content)
        self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
        # Verify light theme button is active by default
        self.assertIn('id="themeBtnLight"', content)
        self.assertTrue('active' in content.split('id="themeBtnLight"')[0].split('<button')[-1])
        
        # Verify theme switch buttons have onclick handlers
        self.assertIn('onclick="setAppTheme(\'light\')"', content)
        self.assertIn('onclick="setAppTheme(\'dark\')"', content)

    def test_profile_page_defaults_to_light_theme(self):
        self.client.login(username='naimul', password='pass@123')
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)
        content = response.content.decode('utf-8')
        
        # Verify default data-theme is light
        self.assertIn('data-theme="light"', content)
        self.assertNotIn('<html lang="en" data-theme="dark">', content)
        
        # Verify Day switch button is active by default
        self.assertIn('class="theme-switch-btn active" data-theme-val="light"', content)

