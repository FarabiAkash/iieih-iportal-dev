# IIEH iPortal - Eye Hospital Management Reporting System

Comprehensive MVT reporting portal for Eye Hospital management operations.

## Team Structure & Branch Assignments

| Intern | Role | Git Branch | Assigned App(s) | Domain Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Naimul** | Developer | `naimul` | `surgeries_procedures`, `users_naimul` | Eye Surgeries (Cataract, Retina, Glaucoma, etc.), OT utilization & diagnostics |
| **Nusrat** | Developer | `nusrat` | `opd_ipd_reports`, `users_nusrat` | Outpatient daily census, doctor appointments, branch footfalls, IPD bed occupancy |
| **Ruhul** | Developer | `ruhul` | `financial_reports`, `users_ruhul` | Daily collections, billing, concessions/charity patients, pharmacy & optical sales |
| **Subhendu** | QA Engineer | `subhendu` / `dev` | `tests/` | Unit testing, integration testing, quality assurance & bug reporting on `dev` |

## Workflow Rules
1. Developers work **only** on their designated branch (`naimul`, `nusrat`, `ruhul`).
2. After completing work, commit and push to your branch, then open a PR / merge into `dev`.
3. Subhendu (QA) runs test suites on `dev` (`python manage.py test tests`) and validates features.
4. Once all 3 apps are stable, the team collaborates on the 4th integration app (`executive_dashboard`).
