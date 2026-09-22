# 📋 Intern Task Guide: Ruhul (Finance & Billing Reports Developer)

Welcome to the team, **Ruhul**!

You are responsible for building the **Financial Collections, Billing Counter Audits, and Charity/Zakat Concessions** module.

---

## 🎯 Your Assigned Apps & Git Branch

- **Git Branch:** `ruhul`
- **Assigned User App:** `users_ruhul/` (Your custom login, cashier/finance officer role, and counter profile)
- **Assigned Reporting App:** `financial_reports/` (Daily counter collections, revenue breakdown, concessions)
- **Designated Templates:**
  - `users_ruhul/templates/users_ruhul/`
  - `financial_reports/templates/financial_reports/`

---

## 🏥 Real-World Context: What Does an Eye Hospital Need Here?

An eye hospital manages diverse revenue streams alongside humanitarian healthcare programs:
- **Revenue Counters:** OPD Registration Ticket Cash, OT Surgery Packages (Lens + Surgery cost), Investigation/Diagnostic fees, Optical Shop (Spectacle frames and lenses), and Eye Pharmacy.
- **Payment Channels:** Physical Cash, Credit/Debit Cards, and Mobile Financial Services (MFS: bKash, Nagad, Rocket).
- **Concessions & Charity:** Eye hospitals frequently run Zakat Welfare Funds, subsidized cataract surgeries for impoverished patients, staff discounts, and humanitarian relief.

Your system gives accounts officers and directors a daily breakdown of:
1. Total revenue collected by counter and by branch today.
2. The ratio of Cash vs. Digital/Mobile banking collections.
3. How much financial relief / Zakat concessions were granted and approved.

---

## 📝 Step-by-Step Task Breakdown

### Step 1: Get Started on Your Branch
Open your terminal in VS Code and run:
```powershell
# 1. Switch to your personal branch
git checkout ruhul

# 2. Activate the virtual environment
.\venv\Scripts\activate

# 3. Verify server starts
python manage.py runserver
```
Visit `http://127.0.0.1:8000/ruhul/login/` and `http://127.0.0.1:8000/finance/`.

---

### Step 2: Build Your Custom User Profile (`users_ruhul/`)

Cashiers and billing officers need distinct permissions and counter profiles.

1. **Open `users_ruhul/models.py`**:
   - Create a `RuhulProfile` model linked to Django's standard `User` model (`OneToOneField`).
   - Add fields like:
     - `finance_role`: Choices: Cashier, Accounts Supervisor, Zakat Relief Officer, Pharmacy Cashier.
     - `assigned_counter`: (e.g. "Main Cash Counter 1", "OT Billing Desk").
     - `discount_approval_limit`: `DecimalField` (e.g. Max discount the officer can grant in BDT).
2. **Open `users_ruhul/views.py`**:
   - Implement your login view (`login_view`), logout view, and profile view.
   - Validate credentials and redirect logged-in users to `/finance/`.
3. **Open `users_ruhul/templates/users_ruhul/login.html`**:
   - Style your login page with your own UI design (CSS, Bootstrap, or Tailwind CDN).
   - Use a clean finance/accounts dashboard theme.

---

### Step 3: Build the Financial & Concession Models (`financial_reports/`)

1. **Open `financial_reports/models.py`**:
   Create two main models:
   - **`DailyCollection`**:
     - `date`: `DateField`
     - `hospital_branch`: `CharField` (e.g., "Dhaka Main", "Chittagong Center")
     - `counter_name`: Choices: OPD Cash Counter, OT Surgery Packages, Eye Pharmacy, Optical Frame Shop, Diagnostics Counter
     - `cash_amount`: `DecimalField(max_digits=12, decimal_places=2, default=0.00)`
     - `card_amount`: `DecimalField(max_digits=12, decimal_places=2, default=0.00)`
     - `mfs_amount`: `DecimalField(max_digits=12, decimal_places=2, default=0.00)` (bKash/Nagad)
     - `total_amount`: `DecimalField(max_digits=12, decimal_places=2, default=0.00)`
   - **`ConcessionRecord`**:
     - `date`: `DateField`
     - `patient_mrn`: `CharField` (Patient Registration No.)
     - `concession_type`: Choices: Zakat Welfare Fund, Poor Patient Relief, Staff Dependent, Executive Exemption
     - `bill_total`: `DecimalField(max_digits=10, decimal_places=2)`
     - `discount_amount`: `DecimalField(max_digits=10, decimal_places=2)`
     - `approved_by`: `CharField` (Name of doctor or manager approving concession)

2. **Register in `financial_reports/admin.py`**:
   - Register your models so you can insert test billing records in Django Admin (`http://127.0.0.1:8000/admin/`).

---

### Step 4: Create Views & Design Templates (`financial_reports/`)

1. **Open `financial_reports/views.py`**:
   - Query collections: `DailyCollection.objects.all()`
   - Add filtering (by counter or by branch).
   - Use Django aggregates (`Sum`) to calculate:
     - Total Net Revenue (৳ BDT)
     - Total Cash vs. Total Digital (Card + bKash)
     - Total Concessions / Zakat disbursed
   - Pass calculations to the template context.
2. **Design your templates in `financial_reports/templates/financial_reports/`**:
   - Create cards displaying total revenue, cash on hand, and digital payments.
   - Design a financial table showing each counter's collection for the day.
   - Feel free to style currency values, badges, and progress bars however you prefer!

---

### Step 5: Test & Make Migrations

Whenever you modify `models.py`, run:
```powershell
python manage.py makemigrations
python manage.py migrate
```

Verify in your browser:
- `http://127.0.0.1:8000/ruhul/login/`
- `http://127.0.0.1:8000/finance/`

---

### Step 6: Commit and Push Your Work

**Golden Rule:** Always work on your own branch `ruhul`. Do not commit directly to `dev` or `main`.

```powershell
# Check changed files
git status

# Add only your app files
git add users_ruhul/ financial_reports/

# Commit with a clear message
git commit -m "feat(finance): created DailyCollection model and styled revenue report"

# Push to your remote branch
git push origin ruhul
```

After pushing, open a Pull Request (PR) to merge `ruhul` into `dev`. 
**Subhendu (QA)** will run automated tests on `dev` and report any bugs back to you!
