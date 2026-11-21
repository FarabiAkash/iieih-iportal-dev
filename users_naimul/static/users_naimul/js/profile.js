// ─── Clinical Tab Switcher ────────────────────────────────────────────────────
function switchClinicalTab(tabId, el) {
    if (!tabId) return;
    if (tabId === 'doctor-registration') {
        tabId = 'doctor-reg';
    }

    // Exit prescription mode if switching tabs
    if (tabId !== 'patient-load') {
        document.body.classList.remove('prescription-mode');
        const portalNav = document.querySelector('.portal-nav');
        const clinicalTabs = document.querySelector('.clinical-tabs');
        if (portalNav) portalNav.style.display = '';
        if (clinicalTabs) clinicalTabs.style.display = '';

        const rxWorkspace = document.getElementById('patientPrescriptionWorkspace');
        const searchSection = document.getElementById('patientLoadSearchSection');
        if (rxWorkspace) rxWorkspace.style.display = 'none';
        if (searchSection) searchSection.style.display = 'block';
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    let targetBtn = el ? (el.closest ? el.closest('.tab-btn') : el) : null;
    if (!targetBtn && typeof window !== 'undefined' && window.event) {
        const evt = window.event;
        const candidate = (evt.target && evt.target.closest) ? evt.target.closest('.tab-btn') : evt.currentTarget;
        if (candidate && candidate.classList && candidate.classList.contains('tab-btn')) {
            targetBtn = candidate;
        }
    }
    if (!targetBtn) {
        targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`) ||
            document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    }

    if (targetBtn) {
        targetBtn.classList.add('active');
        try {
            targetBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (e) { }
    }

    const targetPane = document.getElementById('pane-' + tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }

    if (window.history && window.history.replaceState) {
        try {
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.replaceState({}, '', url);
        } catch (e) { }
    }
}
window.switchClinicalTab = switchClinicalTab;

// ─── Dossier Modal View ───────────────────────────────────────────────────────
function viewPatientDossier(mrn, name, age, gender, eye, surgery, ot_room, ot_slot, outcome, med_history, notes) {
    document.getElementById('m_mrn').innerText = mrn;
    document.getElementById('m_name').innerText = name;
    document.getElementById('m_demo').innerText = age + ' Years / ' + gender;
    document.getElementById('m_eye').innerText = eye === 'RE' ? 'Right Eye (OD)' : (eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
    document.getElementById('m_surgery').innerText = surgery;
    document.getElementById('m_ot_room').innerText = ot_room;
    document.getElementById('m_ot_slot').innerText = ot_slot || 'Slot 1 (08:30 - 10:00 AM)';
    document.getElementById('m_outcome').innerText = outcome;
    document.getElementById('m_med_history').innerText = med_history || 'No systemic comorbidities reported. Pre-op IOP normal.';
    document.getElementById('m_notes').innerText = notes || 'Uneventful micro-surgery procedure recorded.';

    document.getElementById('dossierModal').style.display = 'flex';
}

function closePatientDossier() {
    document.getElementById('dossierModal').style.display = 'none';
}

// ─── Ocular Diagnostic Report Viewer ─────────────────────────────────────────
function viewOcularReport(mrn, name, age, gender, eye, proc, findings, technician, date) {
    document.getElementById('oc_mrn').innerText = mrn;
    document.getElementById('oc_name').innerText = name;
    document.getElementById('oc_demo').innerText = age + ' Yrs / ' + gender;
    document.getElementById('oc_eye').innerText = eye === 'RE' ? 'Right Eye (OD)' : (eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
    document.getElementById('oc_proc').innerText = proc;
    document.getElementById('oc_findings').innerText = findings || 'Clinical diagnostic examination completed within normal limits.';
    document.getElementById('oc_tech').innerText = technician || 'Diagnostic Department';
    document.getElementById('oc_date').innerText = date || 'Today';

    document.getElementById('ocularReportModal').style.display = 'flex';
}

// NOTE: viewOcularReportByMRN uses diagnosticRecordsData injected inline in the template
function viewOcularReportByMRN(mrn, name, age, gender, eye) {
    const diag = (typeof diagnosticRecordsData !== 'undefined' && diagnosticRecordsData[mrn]) || {
        proc: "OCT & Ocular Diagnostic Scan",
        findings: "Ophthalmic diagnostic scan completed. Pre-operative biometry and anterior segment evaluation within standard surgical parameters.",
        tech: "Diagnostic Specialist",
        date: "Today"
    };
    viewOcularReport(mrn, name, age, gender, eye, diag.proc, diag.findings, diag.tech, diag.date);
}

function closeOcularReport() {
    document.getElementById('ocularReportModal').style.display = 'none';
}

// ─── Edit Surgery Record Modal ────────────────────────────────────────────────
function openEditSurgeryModal(id, mrn, name, age, gender, eye, type, surgeon, ot_room, ot_slot, outcome, med_history, notes, returnTab) {
    document.getElementById('edit_surgery_id').value = id;
    document.getElementById('edit_patient_mrn').value = mrn;
    document.getElementById('edit_patient_name').value = name;
    document.getElementById('edit_patient_age').value = age;
    document.getElementById('edit_patient_gender').value = gender;
    document.getElementById('edit_eye').value = eye;
    document.getElementById('edit_surgery_type').value = type;
    const editSurgeonEl = document.getElementById('edit_surgeon_name');
    if (editSurgeonEl) {
        editSurgeonEl.value = surgeon;
        if (!editSurgeonEl.value && surgeon) {
            const altSurgeon = surgeon.startsWith('Dr. ') ? surgeon.replace(/^Dr\.\s*/, '') : `Dr. ${surgeon}`;
            editSurgeonEl.value = altSurgeon;
            if (!editSurgeonEl.value) {
                for (let opt of editSurgeonEl.options) {
                    if (opt.value.toLowerCase().includes(surgeon.toLowerCase()) || surgeon.toLowerCase().includes(opt.value.toLowerCase())) {
                        editSurgeonEl.value = opt.value;
                        break;
                    }
                }
            }
        }
    }
    document.getElementById('edit_ot_room').value = ot_room;
    document.getElementById('edit_ot_slot').value = ot_slot;
    document.getElementById('edit_outcome').value = outcome;
    document.getElementById('edit_medical_history').value = med_history;
    document.getElementById('edit_notes').value = notes;
    document.getElementById('edit_active_tab').value = returnTab || 'patients';

    // Track which surgery is being edited so we don't flag its own slot as a clash
    if (typeof currentEditSurgeryId !== 'undefined') {
        currentEditSurgeryId = id;
    }

    document.getElementById('editSurgeryModal').style.display = 'flex';

    // Run clash check immediately with the pre-populated values
    if (typeof checkOtClash === 'function') {
        checkOtClash('edit');
    }
}

function closeEditSurgeryModal() {
    document.getElementById('editSurgeryModal').style.display = 'none';
}

// ─── Search Error & Patient Not Found Modal Controller ───────────────────────
function openSearchErrorModal(title, headline, desc) {
    const modal = document.getElementById('searchErrorModal');
    if (!modal) return;
    if (title) {
        const titleEl = document.getElementById('searchAlertTitle');
        if (titleEl) titleEl.innerText = title;
    }
    if (headline) {
        const headlineEl = document.getElementById('searchAlertPrimary');
        if (headlineEl) headlineEl.innerHTML = '<strong>' + headline + '</strong>';
    }
    if (desc) {
        const descEl = document.getElementById('searchAlertDesc');
        if (descEl) descEl.innerHTML = desc;
    }
    modal.style.display = 'flex';
}
window.openSearchErrorModal = openSearchErrorModal;

function closeSearchErrorModal() {
    const modal = document.getElementById('searchErrorModal');
    if (modal) modal.style.display = 'none';
    const input = document.getElementById('patientSearchInput') || document.querySelector('.mrn-search-input');
    if (input) {
        try {
            input.focus();
            input.select();
        } catch (e) { }
    }
}
window.closeSearchErrorModal = closeSearchErrorModal;

// ─── Close on clicking outside modal ─────────────────────────────────────────
window.onclick = function (e) {
    const dossier = document.getElementById('dossierModal');
    const ocular = document.getElementById('ocularReportModal');
    const editModal = document.getElementById('editSurgeryModal');
    const searchModal = document.getElementById('searchErrorModal');
    const scheduleModal = document.getElementById('schedulePatientModal');
    const editDoctorModal = document.getElementById('editDoctorModal');
    const historyModal = document.getElementById('historyModal');
    if (e.target === dossier) closePatientDossier();
    if (e.target === ocular) closeOcularReport();
    if (e.target === editModal) closeEditSurgeryModal();
    if (e.target === searchModal) closeSearchErrorModal();
    if (e.target === scheduleModal && typeof closeSchedulePatientModal === 'function') closeSchedulePatientModal();
    if (e.target === editDoctorModal && typeof closeEditDoctorModal === 'function') closeEditDoctorModal();
    if (e.target === historyModal && typeof closeHistoryModal === 'function') closeHistoryModal();
};

// Close modals on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeSearchErrorModal();
        closePatientDossier();
        closeOcularReport();
        closeEditSurgeryModal();
        if (typeof closeSchedulePatientModal === 'function') closeSchedulePatientModal();
        if (typeof closeEditDoctorModal === 'function') closeEditDoctorModal();
        if (typeof closeHistoryModal === 'function') closeHistoryModal();
    }
});

// ─── Mobile Nav Hamburger Toggle ─────────────────────────────────────────────
function toggleMobileNav() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('navHamburger');
    if (!navLinks) return;
    const isOpen = navLinks.classList.toggle('nav-open');
    if (hamburger) {
        hamburger.innerHTML = isOpen
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';
    }
}

// Close mobile nav when clicking outside
document.addEventListener('click', function (e) {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('navHamburger');
    if (!navLinks || !hamburger) return;
    if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
        if (navLinks.classList.contains('nav-open')) {
            navLinks.classList.remove('nav-open');
            hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
        }
    }
});

// ─── Day / Night Theme Controller ────────────────────────────────────────────
function setAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('iieih_theme', theme);
    } catch (e) { }
    document.querySelectorAll('.theme-switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    setAppTheme(currentTheme);

    // Auto-activate tab from query param ?tab=
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        switchClinicalTab(tabParam);
    }
    // Auto-dismiss alerts after 5 seconds
    initProfileAlerts();

    // Client-side empty search guard
    const searchForm = document.getElementById('patientSearchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            const input = document.getElementById('patientSearchInput');
            const query = input ? input.value.trim() : '';
            if (!query) {
                e.preventDefault();
                openSearchErrorModal(
                    "Search Input Required",
                    "Not a valid MRN number or not such patient found.",
                    "Please enter a patient MRN number (e.g. P26XXXXX) or patient name to search."
                );
            }
        });
    }

    // Auto-populate OT room for the pre-selected surgeon on page load
    if (typeof autoPopulateDoctorOtRoom === 'function') {
        autoPopulateDoctorOtRoom('surg');
    }
});

// ─── Auto-Dismiss Profile Alerts (5 seconds) ─────────────────────────────────
function dismissProfileAlert(alertEl) {
    if (!alertEl || alertEl.classList.contains('fade-out')) return;
    alertEl.classList.add('fade-out');
    setTimeout(() => {
        if (alertEl && alertEl.parentNode) {
            alertEl.remove();
        }
    }, 400);
}
window.dismissProfileAlert = dismissProfileAlert;

function initProfileAlerts() {
    const alerts = document.querySelectorAll('.profile-alert');
    alerts.forEach(alertEl => {
        setTimeout(() => {
            dismissProfileAlert(alertEl);
        }, 5000);
    });
}

if (document.readyState !== 'loading') {
    initProfileAlerts();
}

// ─── Doctor Registration Form Helpers ─────────────────────────────────────────
function toggleRegPassword() {
    const pwInput = document.getElementById('reg_password');
    const icon = document.getElementById('pwToggleIcon');
    if (!pwInput) return;
    if (pwInput.type === 'password') {
        pwInput.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        pwInput.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}
window.toggleRegPassword = toggleRegPassword;

function handleRegRoleChange(selectEl) {
    if (!selectEl) return;
    const role = selectEl.value;
    const isDoc = ['Surgeon', 'Consultant', 'Associate', 'Resident'].includes(role);
    const dispNameInput = document.getElementById('reg_surgeon_display_name');
    const unameInput = document.getElementById('reg_username');

    if (dispNameInput && !dispNameInput.value.trim() && unameInput && unameInput.value.trim()) {
        const uname = unameInput.value.trim();
        const formatted = uname.charAt(0).toUpperCase() + uname.slice(1);
        if (isDoc) {
            dispNameInput.value = 'Dr. ' + formatted;
        } else {
            dispNameInput.value = formatted;
        }
    }
}
window.handleRegRoleChange = handleRegRoleChange;

function filterDoctorDirectory(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#docDirectoryTable tbody tr.doc-row');
    rows.forEach(row => {
        const searchData = row.getAttribute('data-search') || row.textContent.toLowerCase();
        if (!q || searchData.includes(q)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}
window.filterDoctorDirectory = filterDoctorDirectory;

function resetDoctorRegForm() {
    const form = document.getElementById('doctorRegForm');
    if (form) {
        form.reset();
        const errBox = document.querySelector('.reg-error-box');
        if (errBox) errBox.style.display = 'none';
    }
}
window.resetDoctorRegForm = resetDoctorRegForm;

function validateDoctorRegistrationClient(e) {
    const username = (document.getElementById('reg_username') || {}).value || '';
    const password = (document.getElementById('reg_password') || {}).value || '';
    const email = (document.getElementById('reg_email') || {}).value || '';
    const phone = (document.getElementById('reg_phone') || {}).value || '';
    const role = (document.getElementById('reg_role') || {}).value || '';
    const specialty = (document.getElementById('reg_specialty') || {}).value || '';
    const otRoom = (document.getElementById('reg_assigned_ot_room') || {}).value || '';
    const surgeonCode = (document.getElementById('reg_surgeon_code') || {}).value || '';
    const license = (document.getElementById('reg_license_number') || {}).value || '';

    if (!username.trim() || username.length < 3) {
        alert("Please enter a valid username (at least 3 characters).");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!password || password.length < 6) {
        alert("Please enter a password with at least 6 characters.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!email.trim() || !email.includes('@')) {
        alert("Please provide a valid email address.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!phone.trim()) {
        alert("Please provide a contact phone number.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!role) {
        alert("Please select a professional role.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!specialty) {
        alert("Please select a surgical specialty.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!otRoom) {
        alert("Please select an assigned OT suite.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!surgeonCode.trim()) {
        alert("Please enter a hospital surgeon code.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    if (!license.trim()) {
        alert("Please enter a medical license number.");
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }
    return true;
}
window.validateDoctorRegistrationClient = validateDoctorRegistrationClient;

// ─── Edit Doctor & Staff Information Modal Controller ────────────────────────
function openEditDoctorModal(btn) {
    if (!btn) return;
    const modal = document.getElementById('editDoctorModal');
    if (!modal) return;

    const id = btn.getAttribute('data-id') || '';
    const username = btn.getAttribute('data-username') || '';
    const firstName = btn.getAttribute('data-first-name') || '';
    const lastName = btn.getAttribute('data-last-name') || '';
    const email = btn.getAttribute('data-email') || '';
    const phone = btn.getAttribute('data-phone') || '';
    const role = btn.getAttribute('data-role') || '';
    const specialty = btn.getAttribute('data-specialty') || '';
    const otRoom = btn.getAttribute('data-ot-room') || '';
    const surgeonCode = btn.getAttribute('data-surgeon-code') || '';
    const licenseNumber = btn.getAttribute('data-license-number') || '';
    const department = btn.getAttribute('data-department') || '';
    const displayName = btn.getAttribute('data-display-name') || '';
    const bio = btn.getAttribute('data-bio') || '';
    const isActive = btn.getAttribute('data-is-active') !== 'false';

    const idInput = document.getElementById('edit_doc_profile_id');
    if (idInput) idInput.value = id;

    const unameInput = document.getElementById('edit_doc_username');
    if (unameInput) unameInput.value = username;

    const fnInput = document.getElementById('edit_doc_first_name');
    if (fnInput) fnInput.value = firstName;

    const lnInput = document.getElementById('edit_doc_last_name');
    if (lnInput) lnInput.value = lastName;

    const emailInput = document.getElementById('edit_doc_email');
    if (emailInput) emailInput.value = email;

    const phoneInput = document.getElementById('edit_doc_phone');
    if (phoneInput) phoneInput.value = phone;

    const roleInput = document.getElementById('edit_doc_role');
    if (roleInput) {
        const adminOpt = document.getElementById('edit_doc_role_admin_opt');
        if (adminOpt) {
            const superAllowed = adminOpt.getAttribute('data-super-allowed') === 'true';
            if (superAllowed || role === 'Admin') {
                adminOpt.disabled = false;
            } else {
                adminOpt.disabled = true;
            }
        }
        roleInput.value = role;
        if (!roleInput.value && role) {
            for (let opt of roleInput.options) {
                if (opt.value.toLowerCase() === role.toLowerCase()) {
                    roleInput.value = opt.value;
                    break;
                }
            }
        }
    }

    const specInput = document.getElementById('edit_doc_specialty');
    if (specInput) {
        specInput.value = specialty;
        if (!specInput.value && specialty) {
            for (let opt of specInput.options) {
                if (opt.value.toLowerCase() === specialty.toLowerCase()) {
                    specInput.value = opt.value;
                    break;
                }
            }
        }
    }

    const otInput = document.getElementById('edit_doc_assigned_ot_room');
    if (otInput) {
        otInput.value = otRoom;
        if (!otInput.value && otRoom) {
            for (let opt of otInput.options) {
                if (opt.value.toLowerCase() === otRoom.toLowerCase()) {
                    otInput.value = opt.value;
                    break;
                }
            }
        }
    }

    const codeInput = document.getElementById('edit_doc_surgeon_code');
    if (codeInput) codeInput.value = surgeonCode;

    const licInput = document.getElementById('edit_doc_license_number');
    if (licInput) licInput.value = licenseNumber;

    const deptInput = document.getElementById('edit_doc_department');
    if (deptInput) deptInput.value = department;

    const dispInput = document.getElementById('edit_doc_surgeon_display_name');
    if (dispInput) dispInput.value = displayName;

    const bioInput = document.getElementById('edit_doc_bio');
    if (bioInput) bioInput.value = bio;

    const activeInput = document.getElementById('edit_doc_is_active');
    if (activeInput) activeInput.checked = isActive;

    const pwInput = document.getElementById('edit_doc_password');
    if (pwInput) pwInput.value = '';

    const errBox = document.getElementById('modal_edit_doc_error');
    if (errBox) errBox.style.display = 'none';

    modal.style.display = 'flex';
}

function closeEditDoctorModal() {
    const modal = document.getElementById('editDoctorModal');
    if (modal) modal.style.display = 'none';
}

function handleEditDocRoleChange(selectEl) {
    const role = (selectEl && selectEl.value) || '';
    const dispNameInput = document.getElementById('edit_doc_surgeon_display_name');
    if (!dispNameInput) return;
    const currentVal = dispNameInput.value.trim();
    const doctorRoles = ['Surgeon', 'Consultant', 'Associate', 'Resident'];
    const isDoc = doctorRoles.includes(role);
    if (currentVal) {
        const hasDr = /^Dr\.\s*/i.test(currentVal);
        if (isDoc && !hasDr) {
            dispNameInput.value = 'Dr. ' + currentVal;
        } else if (!isDoc && hasDr) {
            dispNameInput.value = currentVal.replace(/^Dr\.\s*/i, '');
        }
    }
}

function toggleEditDocPassword() {
    const pwInput = document.getElementById('edit_doc_password');
    const icon = document.getElementById('editDocPwToggleIcon');
    if (!pwInput) return;
    if (pwInput.type === 'password') {
        pwInput.type = 'text';
        if (icon) {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    } else {
        pwInput.type = 'password';
        if (icon) {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

function validateEditDoctorModal(e) {
    const username = (document.getElementById('edit_doc_username') || {}).value || '';
    const email = (document.getElementById('edit_doc_email') || {}).value || '';
    const phone = (document.getElementById('edit_doc_phone') || {}).value || '';
    const role = (document.getElementById('edit_doc_role') || {}).value || '';
    const specialty = (document.getElementById('edit_doc_specialty') || {}).value || '';
    const otRoom = (document.getElementById('edit_doc_assigned_ot_room') || {}).value || '';
    const surgeonCode = (document.getElementById('edit_doc_surgeon_code') || {}).value || '';
    const license = (document.getElementById('edit_doc_license_number') || {}).value || '';
    const password = (document.getElementById('edit_doc_password') || {}).value || '';
    const errBox = document.getElementById('modal_edit_doc_error');
    const errMsg = document.getElementById('modal_edit_doc_error_msg');

    function showError(msg) {
        if (errBox && errMsg) {
            errMsg.innerText = msg;
            errBox.style.display = 'block';
            errBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert(msg);
        }
        if (e && e.preventDefault) e.preventDefault();
        return false;
    }

    if (!username.trim() || username.length < 3) {
        return showError("Please enter a valid username (at least 3 characters).");
    }
    if (!email.trim() || !email.includes('@')) {
        return showError("Please enter a valid email address.");
    }
    if (!phone.trim()) {
        return showError("Please enter a contact phone number.");
    }
    if (!role) {
        return showError("Please select a professional role.");
    }
    if (!specialty) {
        return showError("Please select a surgical specialty.");
    }
    if (!otRoom) {
        return showError("Please select an assigned OT room.");
    }
    if (!surgeonCode.trim()) {
        return showError("Please enter a hospital surgeon code.");
    }
    if (!license.trim()) {
        return showError("Please enter a medical license number.");
    }
    if (password && password.length < 6) {
        return showError("New password must be at least 6 characters long.");
    }

    return true;
}

window.openEditDoctorModal = openEditDoctorModal;
window.closeEditDoctorModal = closeEditDoctorModal;
window.handleEditDocRoleChange = handleEditDocRoleChange;
window.toggleEditDocPassword = toggleEditDocPassword;
window.validateEditDoctorModal = validateEditDoctorModal;


// ─── Patient Load Tab ─────────────────────────────────────────────────────────

// Get CSRF token from cookie (if getCsrfToken not already defined)
function getPatientLoadCsrf() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith(name + '=')) return decodeURIComponent(c.substring(name.length + 1));
    }
    // Fallback: try meta tag or hidden input
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.content;
    const input = document.querySelector('[name=csrfmiddlewaretoken]');
    if (input) return input.value;
    return '';
}

// Currently selected patient for prescriptions
let _rxPatient = null;
let _pendingPatientInfo = null; // Staged patient from MRN search awaiting confirmation
let _rxPrescriptionId = null;  // null = new, int = editing existing
let _allPatientsData = [];     // populated from inline JSON in template

// Search patient by MRN via AJAX API
async function searchPatientByMRN() {
    const input = document.getElementById('patientLoadMRNInput');
    const feedback = document.getElementById('patientMRNSearchFeedback');
    const searchBtn = document.getElementById('patientLoadMRNSearchBtn');
    if (!input) return;

    const mrn = input.value.trim();
    if (!mrn) {
        if (feedback) {
            feedback.style.display = 'block';
            feedback.className = 'patient-search-feedback error';
            feedback.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter a Patient MRN to search.';
        }
        input.focus();
        return;
    }

    if (feedback) {
        feedback.style.display = 'block';
        feedback.className = 'patient-search-feedback loading';
        feedback.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Searching patient registry for MRN: <strong>${escHtml(mrn)}</strong>...`;
    }

    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Searching...</span>';
    }

    try {
        const resp = await fetch(`/naimul/api/patient-lookup/?mrn=${encodeURIComponent(mrn)}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await resp.json();

        if (data.success && data.patient) {
            const pat = data.patient;
            _pendingPatientInfo = pat;

            // Populate popup modal with patient information
            const mrnEl = document.getElementById('pinfo_mrn');
            const nameEl = document.getElementById('pinfo_name');
            const demoEl = document.getElementById('pinfo_demographics');
            const eyeEl = document.getElementById('pinfo_eye');
            const surgEl = document.getElementById('pinfo_surgery');
            const docEl = document.getElementById('pinfo_doctor');
            const otEl = document.getElementById('pinfo_ot_details');
            const medEl = document.getElementById('pinfo_med_history');
            const notesEl = document.getElementById('pinfo_notes');

            if (mrnEl) mrnEl.textContent = pat.mrn;
            if (nameEl) nameEl.textContent = pat.name;
            if (demoEl) demoEl.textContent = `${pat.age} yrs • ${pat.gender}`;

            // Eye operative side styling
            if (eyeEl) {
                const eyeVal = pat.eye_display || (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
                eyeEl.textContent = eyeVal;
                eyeEl.classList.remove('eye-od', 'eye-os', 'eye-ou');
                if (pat.eye === 'RE' || eyeVal.includes('(OD)')) {
                    eyeEl.classList.add('eye-od');
                } else if (pat.eye === 'LE' || eyeVal.includes('(OS)')) {
                    eyeEl.classList.add('eye-os');
                } else {
                    eyeEl.classList.add('eye-ou');
                }
            }

            if (surgEl) surgEl.textContent = pat.surgery_type;
            if (docEl) docEl.textContent = pat.surgeon_name;
            if (otEl) otEl.textContent = (pat.ot_room && pat.ot_room !== 'N/A') ? `${pat.ot_room} (${pat.ot_slot})` : 'Not Scheduled / Consult Only';
            if (medEl) medEl.textContent = pat.medical_history || 'No systemic comorbidities reported.';
            if (notesEl) notesEl.textContent = pat.notes || 'No operative notes recorded.';

            // Dynamic initials avatar
            const avatarEl = document.getElementById('pinfo_avatar_initials');
            if (avatarEl) {
                const words = (pat.name || '').trim().split(/\s+/).filter(Boolean);
                let initials = 'PT';
                if (words.length >= 2) {
                    initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
                } else if (words.length === 1 && words[0].length > 0) {
                    initials = words[0].slice(0, 2).toUpperCase();
                }
                avatarEl.textContent = initials;
            }

            // Optional encounter / registration date pill
            const dateWrap = document.getElementById('pinfo_date_wrap');
            const dateEl = document.getElementById('pinfo_date');
            if (dateWrap && dateEl) {
                const regDate = pat.registration_date || pat.date;
                if (regDate && regDate !== 'N/A') {
                    dateEl.textContent = `Reg: ${regDate}`;
                    dateWrap.style.display = 'inline-flex';
                } else {
                    dateWrap.style.display = 'none';
                }
            }

            // Medical history comorbidity highlight check
            const medCard = document.getElementById('pinfo_med_card');
            if (medCard) {
                const hist = (pat.medical_history || '').toLowerCase();
                const isComorbid = hist && !hist.includes('no systemic') && !hist.includes('none') && !hist.includes('nil') && !hist.includes('no prior');
                if (isComorbid) {
                    medCard.classList.add('has-comorbidity');
                } else {
                    medCard.classList.remove('has-comorbidity');
                }
            }

            if (feedback) feedback.style.display = 'none';

            // Open the patient info popup modal
            const modal = document.getElementById('patientInfoModal');
            if (modal) {
                modal.style.display = 'flex';
            }
        } else {
            if (feedback) {
                feedback.style.display = 'block';
                feedback.className = 'patient-search-feedback error';
                feedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${escHtml(data.error || 'No patient found with MRN "' + mrn + '".')}`;
            }
        }
    } catch (err) {
        if (feedback) {
            feedback.style.display = 'block';
            feedback.className = 'patient-search-feedback error';
            feedback.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Network error searching patient registry. Please try again.';
        }
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> <span>Search MRN</span>';
        }
    }
}

// Close the patient info popup modal
function closePatientInfoModal() {
    const modal = document.getElementById('patientInfoModal');
    if (modal) modal.style.display = 'none';
}

// Confirm and open prescription workspace (IIEIH EMR UI)
let _currentMedications = [];
let _emrFontSizeDelta = 0;

async function confirmAndOpenPatientPrescription() {
    if (!_pendingPatientInfo) return;
    const pat = _pendingPatientInfo;
    _rxPatient = pat;
    _rxPrescriptionId = null;

    closePatientInfoModal();

    // Dedicated Prescription UI Mode: hide site navbars, tabs, and alerts
    document.body.classList.add('prescription-mode');
    const portalNav = document.querySelector('.portal-nav');
    const clinicalTabs = document.querySelector('.clinical-tabs');
    if (portalNav) portalNav.style.display = 'none';
    if (clinicalTabs) clinicalTabs.style.display = 'none';

    // Hide search box hero, display prescription workspace
    const searchSection = document.getElementById('patientLoadSearchSection');
    const rxWorkspace = document.getElementById('patientPrescriptionWorkspace');
    if (searchSection) searchSection.style.display = 'none';
    if (rxWorkspace) rxWorkspace.style.display = 'block';

    // Populate patient summary banner & EMR header
    const psName = document.getElementById('ps_name');
    const psDemo = document.getElementById('ps_demographics');
    const psCity = document.getElementById('ps_city');
    const psClinic = document.getElementById('ps_clinic_info');
    const psUin = document.getElementById('ps_uin');
    const psMrn = document.getElementById('ps_mrn');
    const psEye = document.getElementById('ps_eye');
    const psSurgery = document.getElementById('ps_surgery');
    const psRegDate = document.getElementById('ps_reg_date_display');
    const psDate = document.getElementById('ps_date_display');
    const psLastVisit = document.getElementById('ps_last_visit_display');

    if (psName) psName.textContent = pat.name || '';
    if (psDemo) psDemo.textContent = pat.age && pat.gender ? `${pat.age} years, ${pat.gender}` : '';
    if (psCity) psCity.textContent = pat.city || '';
    if (psClinic) psClinic.textContent = pat.clinic || 'Clinic: OPD';
    if (psUin) psUin.textContent = pat.uin || '';
    if (psMrn) psMrn.textContent = pat.mrn || '';
    if (psEye) psEye.textContent = pat.eye_display || (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
    if (psSurgery) psSurgery.textContent = pat.surgery_type || 'Consultation / OPD';
    const regDateVal = pat.registration_date || pat.date || '';
    if (psRegDate) psRegDate.textContent = regDateVal;
    if (psDate) psDate.textContent = pat.date || regDateVal;
    if (psLastVisit) psLastVisit.textContent = pat.last_visit || regDateVal || 'First Visit';

    // Dynamically render visits tab items from database
    renderPatientVisits(pat.visits);

    // Set hidden fields
    setVal('rx_patient_mrn', pat.mrn);
    setVal('rx_patient_name', pat.name);
    setVal('rx_patient_age', pat.age);
    setVal('rx_patient_gender', pat.gender);
    setVal('rx_patient_eye', pat.eye || 'BE');

    // Reset prescription form to initial clean state
    resetPrescriptionForm();

    // Check if there is an uncommitted complaints draft in sessionStorage
    if (pat && pat.mrn) {
        restoreComplaintsDraft(pat.mrn);
    }

    // Load prescriptions for this patient
    await loadPatientPrescriptions(pat.mrn, true);

    // Scroll smoothly to workspace
    rxWorkspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Quick Sample Patient Launcher — fetches the most recent patient from the database via API
async function loadSamplePatientEMR(mrn = '') {
    const input = document.getElementById('patientLoadMRNInput');
    // If a specific MRN was supplied, use it; otherwise load the first available patient
    if (mrn && input) input.value = mrn;
    if (mrn) {
        // Delegate to the real MRN search flow so data always comes from the database
        await searchPatientByMRN();
    } else {
        const feedback = document.getElementById('patientMRNSearchFeedback');
        if (feedback) {
            feedback.style.display = 'block';
            feedback.className = 'patient-search-feedback error';
            feedback.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Please enter a Patient MRN to search.';
        }
    }
}

// Return back to search box view
function backToPatientMRNSearch() {
    // Exit dedicated prescription mode: restore site navbars & tabs
    document.body.classList.remove('prescription-mode');
    const portalNav = document.querySelector('.portal-nav');
    const clinicalTabs = document.querySelector('.clinical-tabs');
    if (portalNav) portalNav.style.display = '';
    if (clinicalTabs) clinicalTabs.style.display = '';

    const searchSection = document.getElementById('patientLoadSearchSection');
    const rxWorkspace = document.getElementById('patientPrescriptionWorkspace');
    if (rxWorkspace) rxWorkspace.style.display = 'none';
    if (searchSection) searchSection.style.display = 'block';

    const input = document.getElementById('patientLoadMRNInput');
    const clearBtn = document.getElementById('patientLoadMRNClearBtn');
    const feedback = document.getElementById('patientMRNSearchFeedback');

    if (input) {
        input.value = '';
        input.focus();
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (feedback) feedback.style.display = 'none';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearPatientMRNSearch() {
    const input = document.getElementById('patientLoadMRNInput');
    const clearBtn = document.getElementById('patientLoadMRNClearBtn');
    const feedback = document.getElementById('patientMRNSearchFeedback');
    if (input) {
        input.value = '';
        input.focus();
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (feedback) feedback.style.display = 'none';
}

// Legacy helpers kept for compatibility
function executePatientLoadSearch() {
    searchPatientByMRN();
}
function clearPatientLoadSearch() {
    clearPatientMRNSearch();
}
function filterPatientLoadList(query) { }
async function selectPatientForLoad(mrn, name, age, gender, eye, surgeryType, medHistory, notes) {
    if (mrn) {
        try {
            const resp = await fetch(`/naimul/api/patient-lookup/?mrn=${encodeURIComponent(mrn)}`, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await resp.json();
            if (data.success && data.patient) {
                _pendingPatientInfo = data.patient;
                await confirmAndOpenPatientPrescription();
                return;
            }
        } catch (e) {}
    }
    _pendingPatientInfo = { mrn, name, age, gender, eye, surgery_type: surgeryType, medical_history: medHistory, notes };
    await confirmAndOpenPatientPrescription();
}

// Render dynamic patient visits tab buttons from database
function renderPatientVisits(visits) {
    const container = document.getElementById('emrVisitsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!visits || !Array.isArray(visits) || visits.length === 0) {
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        container.innerHTML = `
            <button type="button" class="emr-vtab-btn active" onclick="switchVisitEncounter('${todayStr}', this)">
                <span>${todayStr}</span>
                <span class="emr-vtab-badge-new">NEW</span>
            </button>
        `;
        return;
    }

    visits.forEach((v, idx) => {
        const vDate = typeof v === 'string' ? v : v.date;
        const isNew = typeof v === 'object' ? v.is_new : false;
        const isActive = typeof v === 'object' ? v.is_active : (idx === visits.length - 1);
        const label = typeof v === 'object' ? v.label : '';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `emr-vtab-btn ${isActive ? 'active' : ''}`;
        btn.onclick = function () { switchVisitEncounter(vDate, this, typeof v === 'object' ? v : null); };

        if (isNew) {
            btn.innerHTML = `<span>${escHtml(vDate)}</span> <span class="emr-vtab-badge-new">NEW</span>`;
        } else {
            btn.textContent = vDate;
        }
        if (label) {
            btn.title = `${vDate}: ${label}`;
        }
        container.appendChild(btn);
    });
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// Reset the prescription form for a fresh entry
function resetPrescriptionForm() {
    _rxPrescriptionId = null;
    _currentMedications = [];
    renderAllMedications();

    const saveBtn = document.getElementById('rxSaveBtn');
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save &amp; Exit Patient';

    const diagField = document.getElementById('rx_diagnosis');
    if (diagField) diagField.value = '';
    const notesField = document.getElementById('rx_notes');
    if (notesField) notesField.value = '';

    // Clear advice fields
    setVal('rx_glass_od', '');
    setVal('rx_glass_os', '');
    setVal('rx_opinion', '');
    setVal('rx_surgical_advice', '');
    setVal('rx_procedure_advice', '');
    setVal('rx_advice', '');
    setVal('rx_plan', '');
    setVal('rx_followup', '');

    // Reset complaints
    if (typeof resetComplaintsState === 'function') {
        resetComplaintsState();
    }

    // Reset systemic history
    if (typeof resetHistoryState === 'function') {
        resetHistoryState();
    }

    // Reset anterior segment
    if (typeof resetAntSegState === 'function') {
        resetAntSegState();
    }
}

// Medication management
function toggleInlineMedAdder(show) {
    const panel = document.getElementById('emrInlineMedAdder');
    if (!panel) return;
    const isHidden = panel.style.display === 'none';
    const target = show !== undefined ? show : isHidden;
    panel.style.display = target ? 'block' : 'none';
    if (target) {
        const drugInput = document.getElementById('emr_med_input_drug');
        if (drugInput) drugInput.focus();
    }
}

function submitEMRMedication() {
    const drug = (document.getElementById('emr_med_input_drug')?.value || '').trim();
    if (!drug) {
        showRxFeedback('Please enter the drug / medication name.', 'error');
        document.getElementById('emr_med_input_drug')?.focus();
        return;
    }
    const eye = document.getElementById('emr_med_input_eye')?.value || 'Both Eyes (OU)';
    const dosage = (document.getElementById('emr_med_input_dosage')?.value || '').trim() || '1 drop';
    const frequency = (document.getElementById('emr_med_input_frequency')?.value || '').trim() || '4x daily';
    const duration = (document.getElementById('emr_med_input_duration')?.value || '').trim() || '7 days';
    const instructions = (document.getElementById('emr_med_input_instructions')?.value || '').trim();

    _currentMedications.push({ drug, eye, dosage, frequency, duration, instructions });
    renderAllMedications();

    // Clear adder inputs
    setVal('emr_med_input_drug', '');
    setVal('emr_med_input_dosage', '');
    setVal('emr_med_input_frequency', '');
    setVal('emr_med_input_duration', '');
    setVal('emr_med_input_instructions', '');

    toggleInlineMedAdder(false);
    showRxFeedback(`Added ${drug} to prescription.`, 'success');
}

function removeEMRMedication(idx) {
    if (idx >= 0 && idx < _currentMedications.length) {
        _currentMedications.splice(idx, 1);
        renderAllMedications();
    }
}

function renderAllMedications() {
    const container = document.getElementById('medicationRowsContainer');
    const emptyMsg = document.getElementById('emrEmptyMedsMsg');
    if (!container) return;

    container.innerHTML = '';
    if (_currentMedications.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        container.style.display = 'none';
    } else {
        if (emptyMsg) emptyMsg.style.display = 'none';
        container.style.display = 'flex';
        _currentMedications.forEach((med, idx) => {
            const row = document.createElement('div');
            row.className = 'emr-med-active-row';
            row.innerHTML = `
                <div class="emr-med-row-info">
                    <span class="emr-med-row-drug">${escHtml(med.drug)}</span>
                    <span class="emr-med-row-chip"><i class="fa-solid fa-eye" style="font-size:0.65rem;"></i> ${escHtml(med.eye || 'Both Eyes')}</span>
                    <span class="emr-med-row-chip">${escHtml(med.dosage || '1 drop')} &bull; ${escHtml(med.frequency || '4x daily')}</span>
                    <span class="emr-med-row-chip" style="background:#fef3c7; color:#92400e;">${escHtml(med.duration || '7 days')}</span>
                    ${med.instructions ? `<div class="emr-med-row-instructions"><i class="fa-solid fa-info-circle" style="margin-right:3px;"></i>${escHtml(med.instructions)}</div>` : ''}
                </div>
                <button type="button" class="emr-med-row-delete" onclick="removeEMRMedication(${idx})" title="Remove Medication">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            `;
            container.appendChild(row);
        });
    }
}

// Repeat medications from previous visit or standard prescription template
function repeatLastPrescription() {
    const defaultMeds = [
        {
            drug: 'Moxifloxacin 0.5% Eye Drops',
            eye: 'Right Eye (OD)',
            dosage: '1 drop',
            frequency: '4x daily',
            duration: '14 days',
            instructions: '1 drop 4 times daily in operated eye. Keep 5 min interval with other drops.'
        },
        {
            drug: 'Prednisolone Acetate 1% Eye Drops',
            eye: 'Right Eye (OD)',
            dosage: '1 drop',
            frequency: '6x daily (Taper weekly)',
            duration: '28 days',
            instructions: 'Shake well before instillation.'
        },
        {
            drug: 'Carboxymethylcellulose 0.5% (Refresh Tears)',
            eye: 'Both Eyes (OU)',
            dosage: '1 drop',
            frequency: '4x daily',
            duration: '1 month',
            instructions: 'Lubricant eye drops as needed for dryness and comfort.'
        }
    ];

    _currentMedications = defaultMeds.slice();
    renderAllMedications();
    showRxFeedback('Previous visit medications loaded into prescription pad.', 'success');
}

// Add a medication row (legacy compatibility)
function addMedicationRow(drug = '', dosage = '', frequency = '', duration = '', eye = 'Both Eyes (OU)') {
    if (drug) {
        _currentMedications.push({ drug, eye, dosage, frequency, duration, instructions: '' });
        renderAllMedications();
    } else {
        toggleInlineMedAdder(true);
    }
}

function removeMedicationRow(btn) {
    if (_currentMedications.length > 0) {
        _currentMedications.pop();
        renderAllMedications();
    }
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Collect medications
function collectMedications() {
    return _currentMedications;
}

// Section toggles for left findings column
function toggleSection(secId) {
    const body = document.getElementById('body_' + secId);
    const row = document.getElementById('row_' + secId);
    if (!body) return;
    const isHidden = body.style.display === 'none';
    body.style.display = isHidden ? 'block' : 'none';
    if (row) {
        if (isHidden) row.classList.add('open');
        else row.classList.remove('open');
    }
}

function toggleNestedHistory(event) {
    if (event) event.stopPropagation();
    const list = document.getElementById('nested_hist_list');
    const icon = document.getElementById('nested_hist_icon');
    if (!list) return;
    const isHidden = list.style.display === 'none';
    list.style.display = isHidden ? 'flex' : 'none';
    if (icon) {
        icon.className = isHidden ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
}

// Advice section toggles
function toggleAdviceSection(secId) {
    const content = document.getElementById('adv_content_' + secId);
    if (!content) return;
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    if (isHidden) {
        const input = content.querySelector('input, textarea');
        if (input) input.focus();
    }
}

function setFollowupQuick(val) {
    const input = document.getElementById('rx_followup');
    if (input) input.value = val;
}

// Font resize
function adjustEMRFontSize(step) {
    _emrFontSizeDelta = Math.max(-2, Math.min(4, _emrFontSizeDelta + step));
    const ws = document.getElementById('patientPrescriptionWorkspace');
    if (ws) {
        ws.style.fontSize = (100 + _emrFontSizeDelta * 6) + '%';
    }
}

// Star favorite toggle
function togglePatientFavorite() {
    const btn = document.getElementById('emrStarBtn');
    if (btn) {
        btn.classList.toggle('active');
        const icon = btn.querySelector('i');
        if (icon) {
            if (btn.classList.contains('active')) {
                icon.className = 'fa-solid fa-star';
                showRxFeedback('Patient pinned to favorites.', 'success');
            } else {
                icon.className = 'fa-regular fa-star';
            }
        }
    }
}

// Drawers
function toggleRevisionsDrawer(open) {
    const drawer = document.getElementById('emrRevisionsDrawer');
    if (!drawer) return;
    if (open === undefined) {
        drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
    } else {
        drawer.style.display = open ? 'flex' : 'none';
    }
}

function toggleSurgeryDrawer(open) {
    const drawer = document.getElementById('emrSurgeryDrawer');
    if (!drawer) return;
    if (open === undefined) {
        drawer.style.display = drawer.style.display === 'none' ? 'flex' : 'none';
    } else {
        drawer.style.display = open ? 'flex' : 'none';
    }
}

// Switch visit encounter
function switchVisitEncounter(visitDate, btn, visitObj = null) {
    document.querySelectorAll('.emr-vtab-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const dateDisplay = document.getElementById('ps_date_display');
    if (dateDisplay) dateDisplay.textContent = visitDate;

    let extra = '';
    if (visitObj && visitObj.encounters && visitObj.encounters.length > 0) {
        const desc = visitObj.encounters.map(e => e.title || e.label || e.type).filter(Boolean).join(', ');
        if (desc) extra = ` (${desc})`;
    } else if (visitObj && visitObj.label) {
        extra = ` (${visitObj.label})`;
    }
    showRxFeedback(`Switched to visit: ${visitDate}${extra}`, 'success');
}

// Save prescription via AJAX
async function savePrescription(event) {
    if (event) event.preventDefault();

    if (!_rxPatient) {
        showRxFeedback('Please select a patient first.', 'error');
        return false;
    }

    let diagnosis = (document.getElementById('rx_diagnosis')?.value || '').trim();
    if (!diagnosis) {
        diagnosis = 'Refractive evaluation & routine ophthalmic review (OPD Unit-12)';
        const diagEl = document.getElementById('rx_diagnosis');
        if (diagEl) diagEl.value = diagnosis;
    }

    const meds = collectMedications();

    // Combine structured clinical advice
    const adviceList = [];
    const complaints = document.getElementById('rx_complaints')?.value.trim();
    if (complaints) adviceList.push(`Complaints: ${complaints}`);
    const antSeg = document.getElementById('rx_ant_seg')?.value.trim();
    if (antSeg) adviceList.push(`Anterior Segment: ${antSeg}`);
    const glassOD = document.getElementById('rx_glass_od')?.value.trim();
    const glassOS = document.getElementById('rx_glass_os')?.value.trim();
    if (glassOD || glassOS) adviceList.push(`Glass: OD [${glassOD || '-'}] | OS [${glassOS || '-'}]`);
    const opinion = document.getElementById('rx_opinion')?.value.trim();
    if (opinion) adviceList.push(`Opinion/Refer: ${opinion}`);
    const surgAdv = document.getElementById('rx_surgical_advice')?.value.trim();
    if (surgAdv) adviceList.push(`Surgical Advice: ${surgAdv}`);
    const procAdv = document.getElementById('rx_procedure_advice')?.value.trim();
    if (procAdv) adviceList.push(`Procedure Advice: ${procAdv}`);
    const advice = document.getElementById('rx_advice')?.value.trim();
    if (advice) adviceList.push(`Advice: ${advice}`);
    const plan = document.getElementById('rx_plan')?.value.trim();
    if (plan) adviceList.push(`Plan: ${plan}`);
    const followup = document.getElementById('rx_followup')?.value.trim();
    if (followup) adviceList.push(`Follow-up: ${followup}`);
    const remarks = document.getElementById('rx_notes')?.value.trim();
    if (remarks) adviceList.push(`Remarks: ${remarks}`);

    const combinedNotes = adviceList.join('\n');

    const saveBtn = document.getElementById('rxSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

    const payload = new FormData();
    payload.append('save_prescription', '1');
    payload.append('patient_mrn', _rxPatient.mrn);
    payload.append('patient_name', _rxPatient.name);
    payload.append('patient_age', _rxPatient.age);
    payload.append('patient_gender', _rxPatient.gender);
    payload.append('eye', _rxPatient.eye || 'BE');
    payload.append('diagnosis', diagnosis);
    payload.append('medications_json', JSON.stringify(meds));
    payload.append('notes', combinedNotes);
    payload.append('complaints_json', JSON.stringify(_currentComplaints || []));
    payload.append('complaint_meta_json', JSON.stringify(_complaintVisitMeta || {}));
    if (_rxPrescriptionId) payload.append('prescription_id', _rxPrescriptionId);

    try {
        const resp = await fetch(window.location.pathname, {
            method: 'POST',
            headers: { 'X-CSRFToken': getPatientLoadCsrf(), 'X-Requested-With': 'XMLHttpRequest' },
            body: payload
        });
        const data = await resp.json();
        if (data.success) {
            _rxPrescriptionId = data.prescription_id;
            if (_rxPatient && _rxPatient.mrn) {
                try { sessionStorage.removeItem('rx_draft_complaints_' + _rxPatient.mrn); } catch(e){}
            }
            showRxFeedback(data.message || 'Prescription saved successfully.', 'success');
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save &amp; Exit Patient';
            loadPatientPrescriptions(_rxPatient.mrn);
            return true;
        } else {
            showRxFeedback(data.error || 'Failed to save prescription.', 'error');
            return false;
        }
    } catch (err) {
        showRxFeedback('Network error while saving prescription.', 'error');
        return false;
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save &amp; Exit Patient';
        }
    }
}

// Save & Exit helper
async function savePrescriptionAndExit(event) {
    if (event) event.preventDefault();
    const ok = await savePrescription(event);
    if (ok) {
        setTimeout(() => {
            backToPatientMRNSearch();
        }, 1200);
    }
}

// Load prescriptions for a patient from the API
async function loadPatientPrescriptions(mrn, autoLoadLatest = false) {
    const list = document.getElementById('rxHistoryList');
    if (!list) return;
    list.innerHTML = '<div style="color:var(--text-muted);font-size:0.84rem;padding:12px;"><i class="fa-solid fa-spinner fa-spin"></i> Loading prescriptions\u2026</div>';

    try {
        const resp = await fetch(`/naimul/api/prescriptions/?patient_mrn=${encodeURIComponent(mrn)}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await resp.json();
        if (!data.prescriptions || data.prescriptions.length === 0) {
            list.innerHTML = '<div class="patient-load-empty"><i class="fa-solid fa-prescription-bottle" style="font-size:1.6rem;opacity:0.3;margin-bottom:8px;display:block;"></i>No previous prescriptions recorded for this patient. Ready to create a new prescription above.</div>';
            return;
        }
        list.innerHTML = '';
        data.prescriptions.forEach((rx, index) => {
            const card = document.createElement('div');
            card.className = 'rx-history-card';
            const medNames = (rx.medications || []).map(m => m.drug).join(', ');
            card.innerHTML = `
                <div class="rx-history-card-header">
                    <span class="rx-history-diagnosis"><i class="fa-solid fa-stethoscope" style="color:var(--primary);margin-right:5px;"></i>${escHtml(rx.diagnosis)}</span>
                    <span class="rx-history-date"><i class="fa-regular fa-clock" style="margin-right:3px;"></i>${rx.date_created}</span>
                </div>
                <div class="rx-history-meds"><i class="fa-solid fa-capsules" style="margin-right:4px;"></i>${medNames || 'No medications listed'}</div>
                <div style="margin-top:8px;display:flex;gap:8px;">
                    <button type="button" class="btn-action-view" style="font-size:0.76rem;padding:4px 10px;" onclick="loadPrescriptionForEdit(${rx.id})" title="Edit Prescription"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                    <button type="button" class="btn-rx-print" style="font-size:0.76rem;padding:4px 10px;" onclick="printPrescription(${rx.id})" title="Print Prescription"><i class="fa-solid fa-print"></i> Print</button>
                </div>
            `;
            list.appendChild(card);
        });

        if (autoLoadLatest && data.prescriptions.length > 0) {
            await loadPrescriptionForEdit(data.prescriptions[0].id);
        }
    } catch (err) {
        list.innerHTML = '<div style="color:var(--danger);font-size:0.84rem;padding:12px;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load prescriptions.</div>';
    }
}

// Load a saved prescription into the form for editing
async function loadPrescriptionForEdit(rxId) {
    try {
        const resp = await fetch(`/naimul/api/prescriptions/?rx_id=${rxId}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const data = await resp.json();
        const rx = (data.prescriptions || [])[0];
        if (!rx) { showRxFeedback('Prescription not found.', 'error'); return; }

        _rxPrescriptionId = rx.id;
        document.getElementById('rx_diagnosis').value = rx.diagnosis || '';

        // Restore structured complaints
        if (rx.complaints && Array.isArray(rx.complaints) && rx.complaints.length > 0) {
            _currentComplaints = rx.complaints.slice();
            _complaintVisitMeta = Object.assign({
                purpose: '',
                remarks: '',
                informant: 'Patient',
                specify_informant: ''
            }, rx.complaint_meta || {});
        } else if (rx.notes && rx.notes.includes('Complaints:')) {
            parseComplaintsFromNotesText(rx.notes);
        } else {
            _currentComplaints = [];
            _complaintVisitMeta = {
                purpose: '',
                remarks: '',
                informant: 'Patient',
                specify_informant: ''
            };
        }
        updateEMRComplaintsDisplay();
        renderComplaintsSummary();

        // Sync complaints modal inputs
        const purposeSelect = document.getElementById('complaintPurposeOfVisit');
        const remarksInput = document.getElementById('complaintRemarks');
        const informantSelect = document.getElementById('complaintInformant');
        const specInfInput = document.getElementById('complaintSpecifyInformant');
        if (purposeSelect) purposeSelect.value = _complaintVisitMeta.purpose || '';
        if (remarksInput) remarksInput.value = _complaintVisitMeta.remarks || '';
        if (informantSelect) informantSelect.value = _complaintVisitMeta.informant || 'Patient';
        if (specInfInput) specInfInput.value = _complaintVisitMeta.specify_informant || '';
        onInformantChange();

        // Clear and restore structured advice fields without polluting rx_notes (Remarks)
        setVal('rx_glass_od', '');
        setVal('rx_glass_os', '');
        setVal('rx_opinion', '');
        setVal('rx_surgical_advice', '');
        setVal('rx_procedure_advice', '');
        setVal('rx_advice', '');
        setVal('rx_plan', '');
        setVal('rx_followup', '');

        const remarksLines = [];
        const rawNotes = (rx.notes || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const lines = rawNotes.split('\n');

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            if (trimmed.startsWith('Complaints:')) {
                // Handled in complaints section
                return;
            } else if (trimmed.startsWith('Glass:')) {
                const m = trimmed.match(/OD\s*\[(.*?)\]\s*\|\s*OS\s*\[(.*?)\]/i);
                if (m) {
                    const od = m[1].trim();
                    const os = m[2].trim();
                    if (od && od !== '-') setVal('rx_glass_od', od);
                    if (os && os !== '-') setVal('rx_glass_os', os);
                }
            } else if (trimmed.startsWith('Opinion/Refer:')) {
                setVal('rx_opinion', trimmed.substring('Opinion/Refer:'.length).trim());
            } else if (trimmed.startsWith('Surgical Advice:')) {
                setVal('rx_surgical_advice', trimmed.substring('Surgical Advice:'.length).trim());
            } else if (trimmed.startsWith('Procedure Advice:')) {
                setVal('rx_procedure_advice', trimmed.substring('Procedure Advice:'.length).trim());
            } else if (trimmed.startsWith('Advice:')) {
                setVal('rx_advice', trimmed.substring('Advice:'.length).trim());
            } else if (trimmed.startsWith('Plan:')) {
                setVal('rx_plan', trimmed.substring('Plan:'.length).trim());
            } else if (trimmed.startsWith('Follow-up:')) {
                setVal('rx_followup', trimmed.substring('Follow-up:'.length).trim());
            } else if (trimmed.startsWith('Remarks:')) {
                let cleaned = trimmed;
                while (cleaned.toLowerCase().startsWith('remarks:')) {
                    cleaned = cleaned.substring('remarks:'.length).trim();
                }
                if (cleaned) remarksLines.push(cleaned);
            } else {
                remarksLines.push(trimmed);
            }
        });

        const remarksEl = document.getElementById('rx_notes');
        if (remarksEl) remarksEl.value = remarksLines.join('\n');

        // Repopulate medications
        _currentMedications = (rx.medications || []).map(m => ({
            drug: m.drug,
            eye: m.eye || 'Both Eyes (OU)',
            dosage: m.dosage || '1 drop',
            frequency: m.frequency || '4x daily',
            duration: m.duration || '7 days',
            instructions: m.instructions || ''
        }));
        renderAllMedications();

        const saveBtn = document.getElementById('rxSaveBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Prescription';
        toggleRevisionsDrawer(false);
    } catch (err) {
        showRxFeedback('Failed to load prescription for editing.', 'error');
    }
}

// Print a prescription (Official IIEIH EMR Print Layout)
function printPrescription(rxId) {
    const printArea = document.getElementById('prescriptionPrintArea');
    if (!printArea) return;

    const pat = _rxPatient || {};

    const diagnosis = document.getElementById('rx_diagnosis')?.value || '';
    const meds = rxId ? [] : collectMedications();
    const doctorName = printArea.dataset.doctorName || document.getElementById('emr_stamp_doc_name')?.textContent?.trim() || '';
    const licenseNo = printArea.dataset.licenseNo || document.getElementById('emr_stamp_reg')?.textContent?.trim() || '';
    const department = printArea.dataset.department || document.getElementById('emr_stamp_unit')?.textContent?.trim() || '';
    const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    function doPrint(medsList, diagText, notesText) {
        const medRows = medsList.map(m => `
            <tr>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-weight:600;">${escHtml(m.drug)}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escHtml(m.eye || 'Both Eyes')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escHtml(m.dosage || '1 drop')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escHtml(m.frequency || '4x daily')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0;">${escHtml(m.duration || '7 days')}</td>
                <td style="padding:6px 8px; border-bottom:1px solid #e2e8f0; font-size:0.75rem; color:#64748b;">${escHtml(m.instructions || '')}</td>
            </tr>
        `).join('');

        const eyeLabel = pat ? (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)') : 'Both Eyes (OU)';

        printArea.innerHTML = `
            <div style="font-family:'Plus Jakarta Sans',sans-serif; padding: 24px; color:#1e293b; background:#fff;">
                <!-- Hospital Header -->
                <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #194b8c; padding-bottom:12px; margin-bottom:16px;">
                    <div>
                        <div style="font-size:1.35rem; font-weight:800; color:#194b8c;">Ispahani Islamia Eye Institute and Hospital</div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">Department of Ophthalmology &bull; ${escHtml(department)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; font-size:0.95rem; color:#0f172a;">${escHtml(doctorName)}</div>
                        <div style="font-size:0.8rem; color:#475569;">Senior Medical Officer | Reg: ${escHtml(licenseNo)}</div>
                        <div style="font-size:0.75rem; color:#64748b;">${escHtml(department)}</div>
                    </div>
                </div>

                <!-- Patient Meta Banner -->
                <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:6px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; flex-wrap:wrap; font-size:0.82rem;">
                    <div>
                        <div style="font-size:1.05rem; font-weight:800; color:#0f172a; text-transform:uppercase;">${escHtml(pat?.name || '')}</div>
                        <div style="color:#475569; margin-top:2px;">${pat?.age || ''} yrs / ${escHtml(pat?.gender || '')} &bull; ${escHtml(pat?.city || '')}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight:700; color:#0f172a;">MRN: ${escHtml(pat?.mrn || '')} &bull; UIN: ${escHtml(pat?.uin || '')}</div>
                        <div style="color:#64748b; margin-top:2px;">Date: ${now} at ${timeStr}${pat?.registration_date ? ` &bull; Reg: ${escHtml(pat.registration_date)}` : ''}</div>
                    </div>
                </div>

                <!-- Clinical Quick Glance -->
                <div style="background:#fbf5d5; border:1px solid #e8e0b5; border-radius:4px; padding:6px 12px; margin-bottom:16px; font-size:0.78rem; display:flex; gap:16px;">
                    <div><strong>UCVA:</strong> ${document.getElementById('emr_ucva_od')?.value || '-'} / ${document.getElementById('emr_ucva_os')?.value || '-'}</div>
                    <div><strong>BCVA:</strong> ${document.getElementById('emr_bcva_od')?.value || '-'} / ${document.getElementById('emr_bcva_os')?.value || '-'}</div>
                    <div><strong>IOP:</strong> ${document.getElementById('emr_iop_od')?.value || '-'} / ${document.getElementById('emr_iop_os')?.value || '-'} mmHg</div>
                    <div><strong>Operative Eye:</strong> ${eyeLabel}</div>
                </div>

                <!-- Diagnosis -->
                <div style="margin-bottom:14px; font-size:0.88rem;">
                    <strong>Diagnosis / Clinical Impression:</strong> ${escHtml(diagText)}
                </div>

                <!-- Rx Calligraphic Header -->
                <div style="font-family:Georgia,serif; font-style:italic; font-size:2.2rem; color:#194b8c; margin-bottom:8px;">&#8478;</div>

                <!-- Medications Table -->
                <table style="width:100%; border-collapse:collapse; margin-bottom:18px; font-size:0.82rem;">
                    <thead>
                        <tr style="background:#eaeff5; border-bottom:1px solid #cbd5e1; text-align:left;">
                            <th style="padding:6px 8px;">Medication</th>
                            <th style="padding:6px 8px;">Eye</th>
                            <th style="padding:6px 8px;">Dosage</th>
                            <th style="padding:6px 8px;">Frequency</th>
                            <th style="padding:6px 8px;">Duration</th>
                            <th style="padding:6px 8px;">Instructions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${medRows || '<tr><td colspan="6" style="padding:10px; text-align:center; color:#94a3b8;">No medications prescribed</td></tr>'}
                    </tbody>
                </table>

                <!-- Advice / Notes -->
                ${notesText ? `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px; padding:10px 12px; margin-bottom:20px; font-size:0.8rem; white-space:pre-line;">
                        <strong>Instructions &amp; Advice:</strong><br>${escHtml(notesText)}
                    </div>
                ` : ''}

                <!-- Doctor Signature Block -->
                <div style="margin-top:36px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div style="font-size:0.72rem; color:#94a3b8;">
                        Printed from IIEIH Hospital EMR System &bull; ${now}
                    </div>
                    <div style="text-align:right;">
                        <div style="width:160px; border-top:1px solid #1e293b; margin-bottom:4px; display:inline-block;"></div>
                        <div style="font-weight:700; font-size:0.85rem; color:#0f172a;">${escHtml(doctorName)}</div>
                        <div style="font-size:0.75rem; color:#475569;">Senior Medical Officer | Reg: ${escHtml(licenseNo)}</div>
                        <div style="font-size:0.72rem; color:#64748b;">${escHtml(department)}</div>
                    </div>
                </div>
            </div>
        `;
        window.print();
    }

    if (rxId) {
        fetch(`/naimul/api/prescriptions/?rx_id=${rxId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(r => r.json())
            .then(data => {
                const rx = (data.prescriptions || [])[0];
                if (rx) doPrint(rx.medications || [], rx.diagnosis || '', rx.notes || '');
            });
    } else {
        const adviceList = [];
        const complaints = document.getElementById('rx_complaints')?.value.trim();
        if (complaints) adviceList.push(`Complaints: ${complaints}`);
        const glassOD = document.getElementById('rx_glass_od')?.value.trim();
        const glassOS = document.getElementById('rx_glass_os')?.value.trim();
        if (glassOD || glassOS) adviceList.push(`Glass: OD [${glassOD || '-'}] | OS [${glassOS || '-'}]`);
        const advice = document.getElementById('rx_advice')?.value.trim();
        if (advice) adviceList.push(`Advice: ${advice}`);
        const plan = document.getElementById('rx_plan')?.value.trim();
        if (plan) adviceList.push(`Plan: ${plan}`);
        const followup = document.getElementById('rx_followup')?.value.trim();
        if (followup) adviceList.push(`Follow-up: ${followup}`);
        const remarks = document.getElementById('rx_notes')?.value.trim();
        if (remarks) adviceList.push(`Remarks: ${remarks}`);
        doPrint(meds, diagnosis, adviceList.join('\n'));
    }
}

// Show feedback toast
function showRxFeedback(message, type = 'success') {
    document.querySelectorAll('.rx-feedback-toast').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = `rx-feedback-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i> ${escHtml(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 4000);
}

// Initialize Patient Load tab on page load
document.addEventListener('DOMContentLoaded', function () {
    const mrnInput = document.getElementById('patientLoadMRNInput');
    const mrnSearchBtn = document.getElementById('patientLoadMRNSearchBtn');
    const mrnClearBtn = document.getElementById('patientLoadMRNClearBtn');

    if (mrnSearchBtn) {
        mrnSearchBtn.addEventListener('click', searchPatientByMRN);
    }

    if (mrnInput) {
        mrnInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPatientByMRN();
            }
        });

        mrnInput.addEventListener('input', function () {
            if (mrnClearBtn) {
                mrnClearBtn.style.display = mrnInput.value.trim() ? 'flex' : 'none';
            }
            const feedback = document.getElementById('patientMRNSearchFeedback');
            if (!mrnInput.value.trim() && feedback) {
                feedback.style.display = 'none';
            }
        });
    }

    const patientModal = document.getElementById('patientInfoModal');
    if (patientModal) {
        patientModal.addEventListener('click', function (e) {
            if (e.target === patientModal) {
                closePatientInfoModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        const pModal = document.getElementById('patientInfoModal');
        if (pModal && (pModal.style.display === 'flex' || pModal.style.display === 'block')) {
            if (e.key === 'Escape') {
                closePatientInfoModal();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                confirmAndOpenPatientPrescription();
            }
        }

        const cModal = document.getElementById('complaintsModal');
        if (cModal && (cModal.style.display === 'flex' || cModal.style.display === 'block')) {
            if (e.key === 'Escape') {
                closeComplaintsModal();
            }
        }
    });

    // Close complaints modal when clicking backdrop
    document.getElementById('complaintsModal')?.addEventListener('click', function (e) {
        if (e.target === this) {
            closeComplaintsModal();
        }
    });
});

// ==========================================================================
// COMPLAINTS POPUP MODAL (Hospital EMR Standard)
// ==========================================================================

let _currentComplaints = [];
let _complaintSelectedEye = 'BE';
let _complaintVisitMeta = {
    purpose: '',
    remarks: '',
    informant: 'Patient',
    specify_informant: ''
};

// Storage helper to preserve complaints drafts per patient MRN
function saveComplaintsDraft(mrn, complaints, meta) {
    if (!mrn) return;
    try {
        sessionStorage.setItem('rx_draft_complaints_' + mrn, JSON.stringify({
            complaints: complaints || [],
            meta: meta || {}
        }));
    } catch (e) {}
}

function restoreComplaintsDraft(mrn) {
    if (!mrn) return false;
    try {
        const raw = sessionStorage.getItem('rx_draft_complaints_' + mrn);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (parsed && (Array.isArray(parsed.complaints) || parsed.meta)) {
            _currentComplaints = Array.isArray(parsed.complaints) ? parsed.complaints.slice() : [];
            _complaintVisitMeta = Object.assign({
                purpose: '',
                remarks: '',
                informant: 'Patient',
                specify_informant: ''
            }, parsed.meta || {});
            updateEMRComplaintsDisplay();
            renderComplaintsSummary();
            return true;
        }
    } catch (e) {}
    return false;
}

// Fallback parser when loading legacy prescriptions without structured complaints_json
function parseComplaintsFromNotesText(notesText) {
    _currentComplaints = [];
    _complaintVisitMeta = { purpose: '', remarks: '', informant: 'Patient', specify_informant: '' };
    if (!notesText) return;

    const lines = notesText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('Complaints:')) {
            const content = trimmed.substring('Complaints:'.length).trim();
            const segments = content.split('|').map(s => s.trim());
            const itemsStr = segments[0] || '';

            for (let i = 1; i < segments.length; i++) {
                const seg = segments[i];
                if (seg.startsWith('Purpose:')) {
                    _complaintVisitMeta.purpose = seg.substring('Purpose:'.length).trim();
                } else if (seg.startsWith('Informant:')) {
                    const inf = seg.substring('Informant:'.length).trim();
                    if (inf.includes(' - ')) {
                        const parts = inf.split(' - ');
                        _complaintVisitMeta.informant = parts[0].trim();
                        _complaintVisitMeta.specify_informant = parts.slice(1).join(' - ').trim();
                    } else {
                        _complaintVisitMeta.informant = inf;
                    }
                } else if (seg.startsWith('Remarks:')) {
                    _complaintVisitMeta.remarks = seg.substring('Remarks:'.length).trim();
                }
            }

            const itemTokens = itemsStr.split(';').map(t => t.trim()).filter(Boolean);
            itemTokens.forEach(token => {
                const match = token.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
                if (match) {
                    const name = match[1].trim();
                    const details = match[2] ? match[2].trim() : '';
                    let eye = 'BE';
                    let dur = '';
                    if (details) {
                        const parts = details.split(',').map(p => p.trim());
                        parts.forEach(p => {
                            if (p === 'RE' || p === 'LE' || p === 'BE') {
                                eye = p;
                            } else {
                                dur = p;
                            }
                        });
                    }
                    const eyeLabel = eye === 'RE' ? 'Right Eye (OD)' : eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)';
                    _currentComplaints.push({
                        name: name,
                        eye: eye,
                        eye_label: eyeLabel,
                        duration: dur
                    });
                }
            });
            break;
        }
    }
}

function openComplaintsModal() {
    const modal = document.getElementById('complaintsModal');
    if (!modal) return;

    const searchInput = document.getElementById('complaintSearchInput');
    const purposeSelect = document.getElementById('complaintPurposeOfVisit');
    const remarksInput = document.getElementById('complaintRemarks');
    const informantSelect = document.getElementById('complaintInformant');
    const specInfInput = document.getElementById('complaintSpecifyInformant');

    if (purposeSelect) purposeSelect.value = _complaintVisitMeta.purpose || '';
    if (remarksInput) remarksInput.value = _complaintVisitMeta.remarks || '';
    if (informantSelect) informantSelect.value = _complaintVisitMeta.informant || 'Patient';
    if (specInfInput) specInfInput.value = _complaintVisitMeta.specify_informant || '';

    setComplaintEye(_complaintSelectedEye || 'BE');
    onInformantChange();
    renderComplaintsSummary();
    onComplaintInputChange();

    modal.style.display = 'flex';
    if (searchInput) {
        setTimeout(() => searchInput.focus(), 150);
    }
}

function closeComplaintsModal() {
    const modal = document.getElementById('complaintsModal');
    if (modal) modal.style.display = 'none';
}

function selectTopComplaint(name) {
    const searchInput = document.getElementById('complaintSearchInput');
    if (searchInput) {
        searchInput.value = name;
        onComplaintInputChange();
        const durInput = document.getElementById('complaintDurationNum');
        if (durInput && !durInput.value) {
            durInput.focus();
        } else {
            const addBtn = document.getElementById('btnAddComplaint');
            if (addBtn && !addBtn.disabled) addBtn.focus();
        }
    }
    document.querySelectorAll('.complaint-quick-pill').forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === name.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function setComplaintEye(eye) {
    _complaintSelectedEye = eye || 'BE';
    document.querySelectorAll('#complaintEyeSegment .eye-seg-btn').forEach(btn => {
        if (btn.dataset.eye === _complaintSelectedEye) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function onComplaintInputChange() {
    const searchInput = document.getElementById('complaintSearchInput');
    const addBtn = document.getElementById('btnAddComplaint');
    if (!addBtn) return;

    const val = (searchInput?.value || '').trim();
    if (val.length > 0) {
        addBtn.disabled = false;
        addBtn.classList.remove('disabled');
    } else {
        addBtn.disabled = true;
        addBtn.classList.add('disabled');
    }
}

function handleComplaintInputKey(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addCurrentComplaint();
    }
}

function addCurrentComplaint() {
    const searchInput = document.getElementById('complaintSearchInput');
    const durNum = document.getElementById('complaintDurationNum');
    const durUnit = document.getElementById('complaintDurationUnit');
    const name = (searchInput?.value || '').trim();

    if (!name) return;

    let durationStr = '';
    const num = (durNum?.value || '').trim();
    const unit = durUnit?.value || 'Days';
    if (num) {
        durationStr = `${num} ${unit}`;
    }

    const eyeCode = _complaintSelectedEye || 'BE';
    const eyeLabel = eyeCode === 'RE' ? 'Right Eye (OD)' : eyeCode === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)';

    _currentComplaints.push({
        name: name,
        eye: eyeCode,
        eye_label: eyeLabel,
        duration: durationStr
    });

    renderComplaintsSummary();
    updateEMRComplaintsDisplay();

    if (_rxPatient && _rxPatient.mrn) {
        saveComplaintsDraft(_rxPatient.mrn, _currentComplaints, _complaintVisitMeta);
    }

    if (searchInput) searchInput.value = '';
    if (durNum) durNum.value = '';
    document.querySelectorAll('.complaint-quick-pill').forEach(p => p.classList.remove('active'));
    onComplaintInputChange();
    if (searchInput) searchInput.focus();
}

function removeComplaintItem(index) {
    if (index >= 0 && index < _currentComplaints.length) {
        _currentComplaints.splice(index, 1);
        renderComplaintsSummary();
        updateEMRComplaintsDisplay();
        if (_rxPatient && _rxPatient.mrn) {
            saveComplaintsDraft(_rxPatient.mrn, _currentComplaints, _complaintVisitMeta);
        }
    }
}

function editComplaintItem(index) {
    if (index < 0 || index >= _currentComplaints.length) return;
    const item = _currentComplaints[index];

    openComplaintsModal();

    const searchInput = document.getElementById('complaintSearchInput');
    const durNum = document.getElementById('complaintDurationNum');
    const durUnit = document.getElementById('complaintDurationUnit');

    if (searchInput) searchInput.value = item.name || '';
    setComplaintEye(item.eye || 'BE');

    if (durNum && durUnit) {
        durNum.value = '';
        if (item.duration) {
            const parts = item.duration.split(' ');
            if (parts.length >= 2) {
                durNum.value = parts[0];
                durUnit.value = parts[1];
            } else if (parts.length === 1 && !isNaN(parts[0])) {
                durNum.value = parts[0];
            }
        }
    }

    _currentComplaints.splice(index, 1);
    renderComplaintsSummary();
    updateEMRComplaintsDisplay();
    onComplaintInputChange();
    if (searchInput) searchInput.focus();
}

function renderComplaintsSummary() {
    const body = document.getElementById('complaintsSummaryBody');
    if (!body) return;

    if (_currentComplaints.length === 0) {
        body.innerHTML = '<div class="complaints-empty-msg">No complaints added yet.</div>';
        return;
    }

    body.innerHTML = _currentComplaints.map((item, idx) => `
        <div class="complaint-summary-chip">
            <span class="summary-chip-text" onclick="editComplaintItem(${idx})" style="cursor:pointer;" title="Click to edit">${escHtml(item.name)}</span>
            <span class="summary-chip-eye" title="${escHtml(item.eye_label)}">${escHtml(item.eye)}</span>
            ${item.duration ? `<span class="summary-chip-dur"><i class="fa-regular fa-clock" style="margin-right:2px;"></i>${escHtml(item.duration)}</span>` : ''}
            <button type="button" class="btn-remove-summary-chip" onclick="removeComplaintItem(${idx})" title="Remove complaint">&times;</button>
        </div>
    `).join('');
}

function onInformantChange() {
    const informantSelect = document.getElementById('complaintInformant');
    const specInfInput = document.getElementById('complaintSpecifyInformant');
    if (!informantSelect || !specInfInput) return;
    const val = informantSelect.value;
    if (val === 'Patient') {
        specInfInput.placeholder = 'Specify Informant (Optional)';
    } else {
        specInfInput.placeholder = `Specify ${val} details / name...`;
    }
}

async function saveComplaintsModal() {
    const searchInput = document.getElementById('complaintSearchInput');
    if (searchInput && searchInput.value.trim()) {
        addCurrentComplaint();
    }

    _complaintVisitMeta.purpose = document.getElementById('complaintPurposeOfVisit')?.value || '';
    _complaintVisitMeta.remarks = document.getElementById('complaintRemarks')?.value || '';
    _complaintVisitMeta.informant = document.getElementById('complaintInformant')?.value || 'Patient';
    _complaintVisitMeta.specify_informant = document.getElementById('complaintSpecifyInformant')?.value || '';

    updateEMRComplaintsDisplay();
    closeComplaintsModal();

    const complaintsSummary = document.getElementById('rx_complaints')?.value || '';

    if (_rxPatient && _rxPatient.mrn) {
        saveComplaintsDraft(_rxPatient.mrn, _currentComplaints, _complaintVisitMeta);
    }

    // Persist directly to database via AJAX
    const saveBtn = document.querySelector('.btn-complaints-save');
    const origHtml = saveBtn ? saveBtn.innerHTML : 'Save Complaints';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const payload = new FormData();
        payload.append('save_complaints', '1');
        payload.append('complaints_json', JSON.stringify(_currentComplaints));
        payload.append('complaint_meta_json', JSON.stringify(_complaintVisitMeta));
        payload.append('complaints_summary', complaintsSummary);
        if (_rxPrescriptionId) {
            payload.append('prescription_id', _rxPrescriptionId);
        }
        if (_rxPatient) {
            payload.append('patient_mrn', _rxPatient.mrn || '');
            payload.append('patient_name', _rxPatient.name || '');
            payload.append('patient_age', _rxPatient.age || 0);
            payload.append('patient_gender', _rxPatient.gender || 'Male');
            payload.append('eye', _rxPatient.eye || 'BE');
        }

        const resp = await fetch(window.location.pathname, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getPatientLoadCsrf(),
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: payload
        });
        const data = await resp.json();
        if (data.success) {
            if (data.prescription_id && !_rxPrescriptionId) {
                _rxPrescriptionId = data.prescription_id;
            }
            showRxFeedback(data.message || `Complaints saved (${_currentComplaints.length} item${_currentComplaints.length === 1 ? '' : 's'}).`, 'success');
        } else {
            showRxFeedback(data.error || 'Complaints recorded locally.', 'info');
        }
    } catch (err) {
        showRxFeedback(`Complaints recorded locally (${_currentComplaints.length} item${_currentComplaints.length === 1 ? '' : 's'}).`, 'info');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origHtml;
        }
    }
}

function updateEMRComplaintsDisplay() {
    const displayEl = document.getElementById('emr_complaints_display');
    const rxComplaints = document.getElementById('rx_complaints');

    if (!displayEl) return;

    if (_currentComplaints.length === 0 && !_complaintVisitMeta.purpose && !_complaintVisitMeta.remarks) {
        displayEl.innerHTML = `
            <div class="emr-empty-complaints-hint">
                <i class="fa-regular fa-comment-dots"></i>
                <span>Click to record complaints...</span>
            </div>
        `;
        if (rxComplaints) rxComplaints.value = '';
        return;
    }

    const textLines = [];
    _currentComplaints.forEach(c => {
        let line = c.name;
        const details = [];
        if (c.eye) details.push(c.eye);
        if (c.duration) details.push(c.duration);
        if (details.length > 0) line += ` (${details.join(', ')})`;
        textLines.push(line);
    });

    const metaParts = [];
    if (_complaintVisitMeta.purpose) metaParts.push(`Purpose: ${_complaintVisitMeta.purpose}`);
    if (_complaintVisitMeta.informant && _complaintVisitMeta.informant !== 'Patient') {
        let inf = `Informant: ${_complaintVisitMeta.informant}`;
        if (_complaintVisitMeta.specify_informant) inf += ` - ${_complaintVisitMeta.specify_informant}`;
        metaParts.push(inf);
    }
    if (_complaintVisitMeta.remarks) metaParts.push(`Remarks: ${_complaintVisitMeta.remarks}`);

    let fullSummaryText = textLines.join('; ');
    if (metaParts.length > 0) {
        fullSummaryText += (fullSummaryText ? ' | ' : '') + metaParts.join(' | ');
    }

    if (rxComplaints) {
        rxComplaints.value = fullSummaryText;
    }

    let html = '<div class="emr-complaints-pill-list">';
    _currentComplaints.forEach((c, idx) => {
        html += `
            <div class="emr-complaint-badge-row">
                <div class="emr-complaint-badge-left" onclick="event.stopPropagation(); editComplaintItem(${idx})" title="Click to edit ${escHtml(c.name)}">
                    <span class="emr-complaint-name-tag">${escHtml(c.name)}</span>
                    <span class="emr-complaint-eye-tag">${escHtml(c.eye)}</span>
                    ${c.duration ? `<span class="emr-complaint-dur-tag">${escHtml(c.duration)}</span>` : ''}
                </div>
                <span class="emr-complaints-edit-btn" onclick="event.stopPropagation(); editComplaintItem(${idx})" title="Edit ${escHtml(c.name)}"><i class="fa-solid fa-pen-to-square"></i></span>
            </div>
        `;
    });

    if (metaParts.length > 0) {
        html += `<div class="emr-complaint-meta-note">${escHtml(metaParts.join(' • '))}</div>`;
    }
    html += '</div>';

    displayEl.innerHTML = html;
}

function resetComplaintsState() {
    _currentComplaints = [];
    _complaintSelectedEye = 'BE';
    _complaintVisitMeta = {
        purpose: '',
        remarks: '',
        informant: 'Patient',
        specify_informant: ''
    };
    updateEMRComplaintsDisplay();
    renderComplaintsSummary();
}

function orderComplaintsReworkup() {
    showRxFeedback('Clinical re-workup requested. Flagged for optometry review.', 'success');
}

// Window globals for Patient Load & EMR
window.searchPatientByMRN = searchPatientByMRN;
window.clearPatientMRNSearch = clearPatientMRNSearch;
window.closePatientInfoModal = closePatientInfoModal;
window.confirmAndOpenPatientPrescription = confirmAndOpenPatientPrescription;
window.loadSamplePatientEMR = loadSamplePatientEMR;
window.backToPatientMRNSearch = backToPatientMRNSearch;
window.loadPatientPrescriptions = loadPatientPrescriptions;
window.loadPrescriptionForEdit = loadPrescriptionForEdit;
window.executePatientLoadSearch = executePatientLoadSearch;
window.clearPatientLoadSearch = clearPatientLoadSearch;
window.filterPatientLoadList = filterPatientLoadList;
window.selectPatientForLoad = selectPatientForLoad;
window.resetPrescriptionForm = resetPrescriptionForm;
window.addMedicationRow = addMedicationRow;
window.removeMedicationRow = removeMedicationRow;
window.savePrescription = savePrescription;
window.savePrescriptionAndExit = savePrescriptionAndExit;
window.printPrescription = printPrescription;
window.toggleInlineMedAdder = toggleInlineMedAdder;
window.submitEMRMedication = submitEMRMedication;
window.removeEMRMedication = removeEMRMedication;
window.repeatLastPrescription = repeatLastPrescription;
window.toggleSection = toggleSection;
window.toggleNestedHistory = toggleNestedHistory;
window.toggleAdviceSection = toggleAdviceSection;
window.setFollowupQuick = setFollowupQuick;
window.adjustEMRFontSize = adjustEMRFontSize;
window.togglePatientFavorite = togglePatientFavorite;
window.toggleRevisionsDrawer = toggleRevisionsDrawer;
window.toggleSurgeryDrawer = toggleSurgeryDrawer;
window.switchVisitEncounter = switchVisitEncounter;
window.renderPatientVisits = renderPatientVisits;
window.openComplaintsModal = openComplaintsModal;
window.closeComplaintsModal = closeComplaintsModal;
window.selectTopComplaint = selectTopComplaint;
window.setComplaintEye = setComplaintEye;
window.onComplaintInputChange = onComplaintInputChange;
window.handleComplaintInputKey = handleComplaintInputKey;
window.addCurrentComplaint = addCurrentComplaint;
window.removeComplaintItem = removeComplaintItem;
window.editComplaintItem = editComplaintItem;
window.onInformantChange = onInformantChange;
window.saveComplaintsModal = saveComplaintsModal;
window.orderComplaintsReworkup = orderComplaintsReworkup;
window.resetComplaintsState = resetComplaintsState;
window.saveComplaintsDraft = saveComplaintsDraft;
window.restoreComplaintsDraft = restoreComplaintsDraft;
window.parseComplaintsFromNotesText = parseComplaintsFromNotesText;




// ==========================================================================
// VISION POPUP MODAL
// ==========================================================================

let _visionEntries = [];           // { tab, re, le, chartType, cvaTab, cvaRe, cvaLe, cvaChartType, remarks }
let _visionActiveTab = 'ucva';     // 'ucva' | 'ucva_with_ph' | 'ucva_with_mph'
let _visionActiveCVATab = 'bcva';  // 'bcva' | 'bcva_with_ph'
let _visionHasSpectacles = 'No';
let _visionLastFocused = null;     // 're' | 'le' | 'cva_re' | 'cva_le' — which eye input is active

function openVisionModal() {
    const modal = document.getElementById('visionModal');
    if (!modal) return;
    setVisionSpectaclesUI(_visionHasSpectacles);
    switchVisionTab(_visionActiveTab);
    switchVisionCVATab(_visionActiveCVATab);
    renderVisionSummary();
    modal.style.display = 'flex';
    // Don't auto-open the partial popup on open — wait for user to focus an eye input
}

function closeVisionModal() {
    closeVisionPartialPopup();
    const modal = document.getElementById('visionModal');
    if (modal) modal.style.display = 'none';
}

function setVisionSpectacles(val) {
    _visionHasSpectacles = val;
    setVisionSpectaclesUI(val);
}

function setVisionSpectaclesUI(val) {
    document.querySelectorAll('.vision-spec-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.val === val);
    });
}

function switchVisionTab(tab) {
    _visionActiveTab = tab;
    document.querySelectorAll('.vision-ucva-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
}

function switchVisionCVATab(tab) {
    _visionActiveCVATab = tab;
    document.querySelectorAll('.vision-cva-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
}

// ---------------------------------------------------------------------------
// Partial (P) floating popup
// ---------------------------------------------------------------------------

function openVisionPartialPopup(eyeKey) {
    _visionLastFocused = eyeKey;
    const popup = document.getElementById('visionPartialPopup');
    if (!popup) return;

    // Label the popup with which eye is active
    const eyeLabel = document.getElementById('visionPartialPopupEye');
    if (eyeLabel) {
        const labels = { re: 'Right Eye (RE)', le: 'Left Eye (LE)', cva_re: 'Right Eye (RE) — CVA', cva_le: 'Left Eye (LE) — CVA' };
        eyeLabel.textContent = labels[eyeKey] || eyeKey;
    }

    // Position the popup below the focused input
    const inputIdMap = { re: 'visionInputRE', le: 'visionInputLE', cva_re: 'visionCVAInputRE', cva_le: 'visionCVAInputLE' };
    const inputId = inputIdMap[eyeKey];
    const inputEl = document.getElementById(inputId);
    const modalCard = document.querySelector('.vision-modal-card');

    if (inputEl && modalCard) {
        const inputRect = inputEl.getBoundingClientRect();
        const cardRect  = modalCard.getBoundingClientRect();
        // Position relative to the modal card (which has position:relative)
        const top  = inputRect.bottom - cardRect.top + 6;
        let left = inputRect.left - cardRect.left;
        const popupWidth = 360;
        if (left + popupWidth > cardRect.width - 16) {
            left = Math.max(16, cardRect.width - popupWidth - 16);
        }
        popup.style.top  = top  + 'px';
        popup.style.left = left + 'px';
    }

    popup.style.display = 'block';
}

function closeVisionPartialPopup() {
    const popup = document.getElementById('visionPartialPopup');
    if (popup) popup.style.display = 'none';
}

/** Called by every pill button — inserts value into the active eye input */
function setVisionQuick(value) {
    const targetIdMap = { re: 'visionInputRE', le: 'visionInputLE', cva_re: 'visionCVAInputRE', cva_le: 'visionCVAInputLE' };
    const targetId = targetIdMap[_visionLastFocused] || 'visionInputRE';
    const el = document.getElementById(targetId);
    if (el) {
        el.value = value;
        el.focus();           // keep the popup open so the user can keep picking
    }
}

// ---------------------------------------------------------------------------
// Entry management
// ---------------------------------------------------------------------------

function addVisionEntry() {
    const re = (document.getElementById('visionInputRE')?.value || '').trim();
    const le = (document.getElementById('visionInputLE')?.value || '').trim();
    const chartType = document.getElementById('visionChartType')?.value || 'Snellen-3Meter';
    const cvaRe = (document.getElementById('visionCVAInputRE')?.value || '').trim();
    const cvaLe = (document.getElementById('visionCVAInputLE')?.value || '').trim();
    const cvaChartType = document.getElementById('visionCVAChartType')?.value || 'Snellen-3Meter';
    const remarks   = (document.getElementById('visionRemarks')?.value  || '').trim();

    if (!re && !le && !cvaRe && !cvaLe) {
        ['visionInputRE', 'visionInputLE', 'visionCVAInputRE', 'visionCVAInputLE'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.borderColor = '#ef4444'; setTimeout(() => el.style.borderColor = '', 1000); }
        });
        return;
    }

    _visionEntries.push({
        tab: _visionActiveTab, re: re || '—', le: le || '—', chartType,
        cvaTab: _visionActiveCVATab, cvaRe: cvaRe || '—', cvaLe: cvaLe || '—', cvaChartType,
        remarks
    });

    ['visionInputRE', 'visionInputLE', 'visionCVAInputRE', 'visionCVAInputLE', 'visionRemarks'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    closeVisionPartialPopup();
    _visionLastFocused = null;
    renderVisionSummary();
}

function removeVisionEntry(index) {
    _visionEntries.splice(index, 1);
    renderVisionSummary();
}

function renderVisionSummary() {
    const body = document.getElementById('visionSummaryBody');
    if (!body) return;

    if (!_visionEntries.length) {
        body.innerHTML = '<div class="vision-summary-empty">No vision entries added yet.</div>';
        return;
    }

    const ucvaLabels = { ucva: 'UCVA', ucva_with_ph: 'UCVA With PH', ucva_with_mph: 'UCVA with MPH' };
    const cvaLabels  = { bcva: 'BCVA', bcva_with_ph: 'BCVA With PH' };

    body.innerHTML = _visionEntries.map((e, i) => {
        const hasUCVA = (e.re && e.re !== '—') || (e.le && e.le !== '—');
        const hasCVA  = (e.cvaRe && e.cvaRe !== '—') || (e.cvaLe && e.cvaLe !== '—');
        const parts = [];
        if (hasUCVA) {
            parts.push(`<strong>${ucvaLabels[e.tab] || e.tab}:</strong> RE ${e.re} / LE ${e.le} <em style="color:#94a3b8;font-size:0.76rem;">[${e.chartType}]</em>`);
        }
        if (hasCVA) {
            parts.push(`<strong>${cvaLabels[e.cvaTab] || e.cvaTab}:</strong> RE ${e.cvaRe} / LE ${e.cvaLe} <em style="color:#94a3b8;font-size:0.76rem;">[${e.cvaChartType}]</em>`);
        }
        const mainText = parts.length ? parts.join('<span style="color:#cbd5e1;margin:0 6px;">|</span>') : '—';
        return `
        <div class="vision-summary-entry">
            <span>
                ${mainText}
                ${e.remarks ? `<span style="color:#64748b;"> — ${e.remarks}</span>` : ''}
            </span>
            <button class="vision-summary-remove" onclick="removeVisionEntry(${i})" title="Remove">
                <i class="fa-solid fa-xmark"></i>
            </button>
        </div>
    `}).join('');
}

function saveVisionModal() {
    const ucvaEntries = _visionEntries.filter(e => e.tab === 'ucva');
    if (ucvaEntries.length) {
        const last = ucvaEntries[ucvaEntries.length - 1];
        const odEl = document.getElementById('emr_ucva_od');
        const osEl = document.getElementById('emr_ucva_os');
        if (odEl) odEl.value = last.re !== '—' ? last.re : '-';
        if (osEl) osEl.value = last.le !== '—' ? last.le : '-';
    }

    // Populate BCVA quick-glance boxes from last BCVA corrected entry
    const bcvaEntries = _visionEntries.filter(e => (e.cvaTab === 'bcva' || e.cvaTab === 'bcva_with_ph') && (e.cvaRe !== '—' || e.cvaLe !== '—'));
    if (bcvaEntries.length) {
        const last = bcvaEntries[bcvaEntries.length - 1];
        const odEl = document.getElementById('emr_bcva_od');
        const osEl = document.getElementById('emr_bcva_os');
        if (odEl && last.cvaRe !== '—') odEl.value = last.cvaRe;
        if (osEl && last.cvaLe !== '—') osEl.value = last.cvaLe;
    }

    const specVal = document.getElementById('emr_spectacles_val');
    if (specVal) specVal.textContent = _visionHasSpectacles;

    const displayEl = document.getElementById('emr_vision_summary_display');
    if (displayEl) {
        if (_visionEntries.length) {
            const ucvaLabels = { ucva: 'UCVA', ucva_with_ph: 'UCVA+PH', ucva_with_mph: 'UCVA+MPH' };
            const cvaLabels  = { bcva: 'BCVA', bcva_with_ph: 'BCVA+PH' };
            displayEl.innerHTML = _visionEntries.map(e => {
                const hasUCVA = (e.re && e.re !== '—') || (e.le && e.le !== '—');
                const hasCVA  = (e.cvaRe && e.cvaRe !== '—') || (e.cvaLe && e.cvaLe !== '—');
                const parts = [];
                if (hasUCVA) parts.push(`${ucvaLabels[e.tab] || e.tab}: RE <strong>${e.re}</strong> / LE <strong>${e.le}</strong>`);
                if (hasCVA)  parts.push(`${cvaLabels[e.cvaTab] || e.cvaTab}: RE <strong>${e.cvaRe}</strong> / LE <strong>${e.cvaLe}</strong>`);
                return `<div class="emr-indented-line">${parts.join(' | ') || '—'}</div>`;
            }).join('');
        } else {
            displayEl.innerHTML = '';
        }
    }

    closeVisionModal();
}

function orderVisionReworkup() {
    alert('Re-workup order placed.');
}

function resetVisionState() {
    _visionEntries = [];
    _visionActiveTab = 'ucva';
    _visionActiveCVATab = 'bcva';
    _visionHasSpectacles = 'No';
    _visionLastFocused = null;
}

// ---------------------------------------------------------------------------
// DOMContentLoaded — wire up eye input focus/blur for the partial popup
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', function () {

    // RE / LE focus → open partial popup; blur → close if focus left both inputs
    const eyeConfigs = [
        { id: 'visionInputRE', key: 're' },
        { id: 'visionInputLE', key: 'le' },
        { id: 'visionCVAInputRE', key: 'cva_re' },
        { id: 'visionCVAInputLE', key: 'cva_le' }
    ];

    const allEyeIds = eyeConfigs.map(c => c.id);

    eyeConfigs.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('focus', () => {
            openVisionPartialPopup(key);
        });

        el.addEventListener('blur', (e) => {
            // relatedTarget = element that is receiving focus next
            const next = e.relatedTarget;
            const popup = document.getElementById('visionPartialPopup');
            // Keep popup open if focus moves to a pill inside the popup
            if (popup && next && popup.contains(next)) return;
            // Keep popup open if focus moves to any other eye input
            const otherInputs = allEyeIds.filter(eid => eid !== id).map(eid => document.getElementById(eid));
            if (next && otherInputs.includes(next)) return;
            // Otherwise close
            closeVisionPartialPopup();
        });
    });

    // Close vision modal on backdrop click
    document.getElementById('visionModal')?.addEventListener('click', function (e) {
        if (e.target === this) closeVisionModal();
    });

    // ESC: close partial popup first, then modal
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        const popup = document.getElementById('visionPartialPopup');
        if (popup && popup.style.display !== 'none') {
            closeVisionPartialPopup();
            return;
        }
        const modal = document.getElementById('visionModal');
        if (modal && modal.style.display === 'flex') closeVisionModal();
    });
});

window.openVisionModal        = openVisionModal;
window.closeVisionModal       = closeVisionModal;
window.setVisionSpectacles    = setVisionSpectacles;
window.switchVisionTab        = switchVisionTab;
window.switchVisionCVATab     = switchVisionCVATab;
window.openVisionPartialPopup = openVisionPartialPopup;
window.closeVisionPartialPopup= closeVisionPartialPopup;
window.setVisionQuick         = setVisionQuick;
window.addVisionEntry         = addVisionEntry;
window.removeVisionEntry      = removeVisionEntry;
window.saveVisionModal        = saveVisionModal;
window.orderVisionReworkup    = orderVisionReworkup;
window.resetVisionState       = resetVisionState;
