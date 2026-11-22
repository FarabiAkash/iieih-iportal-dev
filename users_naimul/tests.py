from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from users_naimul.models import NaimulProfile, Prescription


class GonioscopySpecialityWorkupTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='doctor_test',
            password='testpassword123',
            first_name='Dr. Test',
            last_name='Surgeon'
        )
        self.profile = NaimulProfile.objects.create(
            user=self.user,
            role='Surgeon',
            specialty='Glaucoma'
        )
        self.client.login(username='doctor_test', password='testpassword123')

    def test_profile_page_contains_gonioscopy_ui_elements(self):
        """Verify that profile.html contains the Speciality Workup Gonioscopy section and modal."""
        response = self.client.get(reverse('users_naimul:profile'))
        self.assertEqual(response.status_code, 200)

        # 1. EMR Left Column Speciality Workup Section
        self.assertContains(response, 'id="row_speciality"')
        self.assertContains(response, 'id="emr_speciality_display"')
        self.assertContains(response, 'id="rx_speciality"')
        self.assertContains(response, 'openGonioscopyModal()')
        self.assertContains(response, 'Speciality Workup:')

        # 2. Gonioscopy Popup Modal
        self.assertContains(response, 'id="gonioscopyModal"')
        self.assertContains(response, 'id="gonioscopyModalTitle"')
        self.assertContains(response, 'Speciality Workup &bull; Gonioscopy (Angle Exam)')

        # 3. Gonioscopy Quick Presets
        self.assertContains(response, "setGonioscopyPreset('normal_be')")
        self.assertContains(response, "setGonioscopyPreset('grade3_be')")
        self.assertContains(response, "setGonioscopyPreset('narrow_be')")
        self.assertContains(response, "setGonioscopyPreset('closed_be')")

        # 4. Gonioscopy Inputs for Right Eye (RE) and Left Eye (LE)
        # Quadrants (Shaffer Grading)
        self.assertContains(response, 'id="gonio_re_sup"')
        self.assertContains(response, 'id="gonio_re_inf"')
        self.assertContains(response, 'id="gonio_re_nas"')
        self.assertContains(response, 'id="gonio_re_temp"')
        self.assertContains(response, 'id="gonio_le_sup"')
        self.assertContains(response, 'id="gonio_le_inf"')
        self.assertContains(response, 'id="gonio_le_nas"')
        self.assertContains(response, 'id="gonio_le_temp"')

        # Structures, Pigment, Iris, PAS, Indentation
        self.assertContains(response, 'id="gonio_struct_re"')
        self.assertContains(response, 'id="gonio_struct_le"')
        self.assertContains(response, 'id="gonio_pigment_re"')
        self.assertContains(response, 'id="gonio_pigment_le"')
        self.assertContains(response, 'id="gonio_iris_re"')
        self.assertContains(response, 'id="gonio_iris_le"')

        # 5. Gonioscopy Result & Impression Elements
        self.assertContains(response, 'id="gonio_result_re"')
        self.assertContains(response, 'id="gonio_result_le"')
        self.assertContains(response, 'id="gonio_overall_result"')
        self.assertContains(response, 'id="gonio_overall_plan"')
        self.assertContains(response, 'saveGonioscopyModal()')
        self.assertContains(response, 'resetGonioscopyState()')

        # 6. Static files linked
        self.assertContains(response, 'gonioscopy_modal.css')
        self.assertContains(response, 'gonioscopy_modal.js')

    def test_save_prescription_with_gonioscopy_notes(self):
        """Verify that prescription save endpoint successfully saves Gonioscopy notes."""
        gonio_notes = (
            "Complaints: Blurry vision and ocular fatigue\n"
            "Speciality Workup: Gonioscopy | Method: Goldmann 3-Mirror (Undilated) | "
            "RE [Result: Open Angle (Grade IV) - Normal | Shaffer: [Sup: IV, Inf: IV, Nas: IV, Temp: IV] | Struct: CBB | Pigment: 1+] | "
            "LE [Result: Open Angle (Grade IV) - Normal | Shaffer: [Sup: IV, Inf: IV, Nas: IV, Temp: IV] | Struct: CBB | Pigment: 1+] | "
            "Impression: Normal open angles BE (Shaffer Grade IV) | Plan: Routine annual review"
        )
        payload = {
            'save_prescription': '1',
            'patient_mrn': 'MRN-GONIO-01',
            'patient_name': 'Rahim Uddin',
            'patient_age': '48',
            'patient_gender': 'Male',
            'eye': 'BE',
            'diagnosis': 'Glaucoma suspect — Normal Open Angles',
            'medications_json': '[]',
            'notes': gonio_notes,
            'complaints_json': '[]',
            'complaint_meta_json': '{}',
        }

        response = self.client.post(
            reverse('users_naimul:profile'),
            data=payload,
            HTTP_X_REQUESTED_WITH='XMLHttpRequest'
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get('success'))

        # Verify prescription was created in the database
        rx = Prescription.objects.filter(patient_mrn='MRN-GONIO-01').first()
        self.assertIsNotNone(rx)
        self.assertIn('Speciality Workup: Gonioscopy', rx.notes)
        self.assertIn('Open Angle (Grade IV) - Normal', rx.notes)
        self.assertIn('Shaffer: [Sup: IV, Inf: IV, Nas: IV, Temp: IV]', rx.notes)
        self.assertIn('Normal open angles BE', rx.notes)
