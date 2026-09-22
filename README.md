# IIEH iPortal - Eye Hospital Management Reporting System

A modular Django MVT reporting portal for eye hospital management operations.

---

## 👥 Intern Assignments & Detailed Task Guides

Click on your name below to open your personalized, simplified step-by-step task instructions:

| Intern | Role | Git Branch | Assigned App(s) | Guide Link | Domain Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Naimul** | Developer | `naimul` | `surgeries_procedures`, `users_naimul` | [README_NAIMUL.md](file:///e:/IIEH/Projects/iieih-iportal-dev/README_NAIMUL.md) | Eye Surgeries (Cataract, Retina, Glaucoma), OT utilization & Ocular Diagnostics |
| **Nusrat** | Developer | `nusrat` | `opd_ipd_reports`, `users_nusrat` | [README_NUSRAT.md](file:///e:/IIEH/Projects/iieih-iportal-dev/README_NUSRAT.md) | Outpatient (OPD) census, specialty eye clinics, branch footfalls, and IPD bed occupancy |
| **Ruhul** | Developer | `ruhul` | `financial_reports`, `users_ruhul` | [README_RUHUL.md](file:///e:/IIEH/Projects/iieih-iportal-dev/README_RUHUL.md) | Daily counter collections, Cash vs Digital payments, and Zakat/Charity patient concessions |
| **Subhendu** | QA Engineer | `subhendu` / `dev` | `tests/` | [README_SUBHENDU.md](file:///e:/IIEH/Projects/iieih-iportal-dev/README_SUBHENDU.md) | Automated unit & integration testing on `dev`, regression testing & bug reporting |
| *(All 4)* | Full Team | `dev` | `executive_dashboard` | *(Integrated Phase)* | Consolidated executive dashboard integrating components after Apps 1-3 are built |

---

## 🛠️ General Setup Commands

```powershell
# 1. Activate virtual environment
.\venv\Scripts\activate

# 2. Check system status
python manage.py check

# 3. Run QA test suite
python manage.py test tests

# 4. Start local development server
python manage.py runserver
```

---

## 🔀 Git Workflow Rules

1. **Never commit directly to `main` or `dev`.**
2. Work only on your personal branch (`git checkout <your-name>`).
3. Commit and push your changes to your branch.
4. Open a Pull Request (PR) to merge into `dev`.
5. **Subhendu (QA)** tests changes in `dev`. If any test fails, Subhendu provides a bug report, and the developer fixes it on their branch before pushing again.
