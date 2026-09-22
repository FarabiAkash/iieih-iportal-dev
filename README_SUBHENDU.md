# 📋 Intern Task Guide: Subhendu (Quality Assurance & Test Engineer)

Welcome to the team, **Subhendu**!

You are the **Lead Quality Assurance (QA) and Test Automation Engineer** for the hospital reporting portal.

Your role is vital: You ensure that code written by **Naimul**, **Nusrat**, and **Ruhul** works smoothly, does not break existing features, handles edge cases, and maintains data integrity when merged into `dev`.

---

## 🎯 Your Assigned Workspace & Git Branch

- **Git Branch:** `subhendu` (or directly testing on `dev`)
- **Assigned Workspace:** `tests/` (Unit test suites, test fixtures, integration assertions)
- **Primary Tool:** Django's built-in `TestCase` framework (`python manage.py test`)

---

## 🏥 Real-World Context: Why is QA Critical for an Eye Hospital?

In a hospital reporting portal:
1. **Surgeries Module (Naimul):** Incorrect surgery counts or unhandled complication statuses could skew clinical governance audits.
2. **OPD/IPD Module (Nusrat):** Negative patient counts or bed occupancy rates over 100% can cause scheduling havoc.
3. **Finance Module (Ruhul):** Calculation bugs in daily collections, cash vs. digital totals, or unvalidated concessions can lead to financial discrepancy and audit failures.

Your tests serve as the **safety net** protecting the system against regressions!

---

## 📝 Step-by-Step Task Breakdown

### Step 1: Set Up Your QA Environment
Open your terminal in VS Code and run:
```powershell
# 1. Switch to dev (or your subhendu branch)
git checkout dev

# 2. Pull the latest code merged by other interns
git pull origin dev

# 3. Activate virtual environment
.\venv\Scripts\activate

# 4. Verify system check
python manage.py check

# 5. Run initial starter test suite
python manage.py test tests
```

---

### Step 2: What to Test for Each Intern's App

As each developer creates their models, views, and templates, write corresponding test methods inside `tests/`:

#### 1. Testing Naimul's Apps (`users_naimul` & `surgeries_procedures`)
- **Authentication:** Verify that `/naimul/login/` returns HTTP 200 and handles invalid login attempts gracefully.
- **Surgery Model Integrity:**
  - Can a `SurgeryRecord` be created with valid fields?
  - Does the eye choice accept only valid options (`OD`, `OS`, `OU`)?
- **View Status & Filtering:**
  - Does `/surgeries/` return HTTP 200?
  - Does filtering by surgery type (e.g. `?type=PHACO_CATARACT`) return only the matching records?

#### 2. Testing Nusrat's Apps (`users_nusrat` & `opd_ipd_reports`)
- **Authentication:** Verify that `/users_nusrat/login/` returns HTTP 200.
- **OPD Census Logic:**
  - Verify that `total_consultations >= 0`.
  - Test aggregate calculations: Does the view calculate the total patient count accurately?
- **IPD Bed Occupancy:**
  - Verify that `occupancy_rate` calculation does not divide by zero if `total_beds` is 0.
  - Verify that occupied beds cannot exceed total beds without triggering a warning.

#### 3. Testing Ruhul's Apps (`users_ruhul` & `financial_reports`)
- **Authentication:** Verify that `/users_ruhul/login/` returns HTTP 200.
- **Financial Calculation Accuracy:**
  - Verify that `total_amount == cash_amount + card_amount + mfs_amount`.
  - Verify that concessions/discounts do not exceed the gross bill amount.
- **View Assertions:**
  - Test that the view context sums total revenue correctly.

---

### Step 3: Writing Tests in Django (`tests/`)

Here is an example of how you can write tests in `tests/test_qa_starter.py`:

```python
from django.test import TestCase
from django.urls import reverse

class HospitalPortalQATest(TestCase):

    def test_naimul_login_status(self):
        response = self.client.get(reverse('users_naimul:login'))
        self.assertEqual(response.status_code, 200)

    def test_nusrat_opd_page_status(self):
        response = self.client.get(reverse('opd_ipd_reports:index'))
        self.assertEqual(response.status_code, 200)

    def test_ruhul_finance_page_status(self):
        response = self.client.get(reverse('financial_reports:index'))
        self.assertEqual(response.status_code, 200)
```

---

### Step 4: How to Report Bugs to Developers

When a test fails or you discover a bug after an intern merges to `dev`:

1. **Do not fix the developer's app yourself.**
2. Document the issue clearly using this Bug Report format:
   ```markdown
   ### 🐛 Bug Report
   - **App / Module:** surgeries_procedures (Naimul)
   - **Endpoint / URL:** /surgeries/?type=PHACO
   - **Observed Behavior:** Returned 500 Internal Server Error when no records exist.
   - **Expected Behavior:** Should return 200 OK and display "No records found".
   - **Steps to Reproduce:**
     1. Clear all surgery records.
     2. Open /surgeries/
   - **Assigned Developer:** @Naimul
   ```
3. Send this report to the developer.
4. Once the developer pushes a fix, pull `dev` and re-run:
   ```powershell
   python manage.py test tests
   ```

---

### Step 5: Preparing for App 4 (Executive Dashboard)

Once all 3 apps are stable and your test suite passes 100%, you will collaborate with Naimul, Nusrat, and Ruhul to test the final integrated app: `executive_dashboard`.

