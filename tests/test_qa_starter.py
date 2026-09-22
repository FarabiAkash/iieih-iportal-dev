from django.test import TestCase
from django.urls import reverse

class StarterQATestCase(TestCase):
    """
    QA Test Suite for Subhendu:
    Verifies that skeletal endpoints and login pages respond with HTTP 200.
    As developers add models and views, add unit and integration tests here.
    """

    def test_naimul_login_page_renders(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)

    def test_nusrat_login_page_renders(self):
        response = self.client.get(reverse('users_nusrat:login'))
        self.assertEqual(response.status_code, 200)

    def test_ruhul_login_page_renders(self):
        response = self.client.get(reverse('users_ruhul:login'))
        self.assertEqual(response.status_code, 200)

    def test_surgeries_index_renders(self):
        response = self.client.get(reverse('surgeries_procedures:index'))
        self.assertEqual(response.status_code, 200)

    def test_opd_ipd_index_renders(self):
        response = self.client.get(reverse('opd_ipd_reports:index'))
        self.assertEqual(response.status_code, 200)

    def test_financial_reports_index_renders(self):
        response = self.client.get(reverse('financial_reports:index'))
        self.assertEqual(response.status_code, 200)

    def test_executive_dashboard_index_renders(self):
        response = self.client.get(reverse('executive_dashboard:index'))
        self.assertEqual(response.status_code, 200)

