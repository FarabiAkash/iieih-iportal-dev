// ─── Clinical Tab Switcher ────────────────────────────────────────────────────
function switchClinicalTab(tabId, el) {
    if (!tabId) return;
    if (tabId === 'doctor-registration') {
        tabId = 'doctor-reg';
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
    if (e.target === dossier) closePatientDossier();
    if (e.target === ocular) closeOcularReport();
    if (e.target === editModal) closeEditSurgeryModal();
    if (e.target === searchModal) closeSearchErrorModal();
    if (e.target === scheduleModal && typeof closeSchedulePatientModal === 'function') closeSchedulePatientModal();
    if (e.target === editDoctorModal && typeof closeEditDoctorModal === 'function') closeEditDoctorModal();
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
        searchBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Searching...';
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
            if (eyeEl) eyeEl.textContent = pat.eye_display || (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
            if (surgEl) surgEl.textContent = pat.surgery_type;
            if (docEl) docEl.textContent = pat.surgeon_name;
            if (otEl) otEl.textContent = (pat.ot_room && pat.ot_room !== 'N/A') ? `${pat.ot_room} (${pat.ot_slot})` : 'Not Scheduled / Consult Only';
            if (medEl) medEl.textContent = pat.medical_history || 'No systemic comorbidities reported.';
            if (notesEl) notesEl.textContent = pat.notes || 'No operative notes recorded.';

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

// Confirm and open prescription workspace
async function confirmAndOpenPatientPrescription() {
    if (!_pendingPatientInfo) return;
    const pat = _pendingPatientInfo;
    _rxPatient = pat;
    _rxPrescriptionId = null;

    closePatientInfoModal();

    // Hide search box hero, display prescription workspace
    const searchSection = document.getElementById('patientLoadSearchSection');
    const rxWorkspace = document.getElementById('patientPrescriptionWorkspace');
    if (searchSection) searchSection.style.display = 'none';
    if (rxWorkspace) rxWorkspace.style.display = 'block';

    // Populate patient summary banner
    const psMrn = document.getElementById('ps_mrn');
    const psName = document.getElementById('ps_name');
    const psDemo = document.getElementById('ps_demographics');
    const psEye = document.getElementById('ps_eye');
    const psSurgery = document.getElementById('ps_surgery');

    if (psMrn) psMrn.textContent = pat.mrn;
    if (psName) psName.textContent = pat.name;
    if (psDemo) psDemo.textContent = `${pat.age} yrs • ${pat.gender}`;
    if (psEye) psEye.textContent = pat.eye_display || (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)');
    if (psSurgery) psSurgery.textContent = pat.surgery_type;

    // Set hidden fields
    setVal('rx_patient_mrn', pat.mrn);
    setVal('rx_patient_name', pat.name);
    setVal('rx_patient_age', pat.age);
    setVal('rx_patient_gender', pat.gender);
    setVal('rx_patient_eye', pat.eye);

    // Reset prescription form to initial clean state
    resetPrescriptionForm();

    // Load prescriptions for this patient and auto-load the latest prescription to edit or see
    await loadPatientPrescriptions(pat.mrn, true);

    // Scroll smoothly to workspace
    rxWorkspace?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Return back to search box view
function backToPatientMRNSearch() {
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
function filterPatientLoadList(query) {}
function selectPatientForLoad(mrn, name, age, gender, eye, surgeryType, medHistory, notes) {
    _pendingPatientInfo = { mrn, name, age, gender, eye, surgery_type: surgeryType, medical_history: medHistory, notes };
    confirmAndOpenPatientPrescription();
}

function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
}

// Reset the prescription form for a fresh entry
function resetPrescriptionForm() {
    _rxPrescriptionId = null;
    const saveBtn = document.getElementById('rxSaveBtn');
    if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Prescription';

    const diagField = document.getElementById('rx_diagnosis');
    if (diagField) diagField.value = '';
    const notesField = document.getElementById('rx_notes');
    if (notesField) notesField.value = '';

    // Reset medication rows to 1 blank row
    const container = document.getElementById('medicationRowsContainer');
    if (container) {
        container.innerHTML = '';
        addMedicationRow();
    }
}

// Add a medication row
function addMedicationRow(drug = '', dosage = '', frequency = '', duration = '') {
    const container = document.getElementById('medicationRowsContainer');
    if (!container) return;
    const idx = container.children.length;
    const row = document.createElement('div');
    row.className = 'medication-row';
    row.innerHTML = `
        <div>
            <div class="med-row-label">Drug / Medication</div>
            <input type="text" class="form-control med-drug" placeholder="e.g. Moxifloxacin 0.5% eye drops" value="${escHtml(drug)}" required>
        </div>
        <div>
            <div class="med-row-label">Dosage</div>
            <input type="text" class="form-control med-dosage" placeholder="e.g. 1 drop" value="${escHtml(dosage)}">
        </div>
        <div>
            <div class="med-row-label">Frequency</div>
            <input type="text" class="form-control med-frequency" placeholder="e.g. 4x daily" value="${escHtml(frequency)}">
        </div>
        <div>
            <div class="med-row-label">Duration</div>
            <input type="text" class="form-control med-duration" placeholder="e.g. 7 days" value="${escHtml(duration)}">
        </div>
        <button type="button" class="med-remove-btn" onclick="removeMedicationRow(this)" title="Remove medication">
            <i class="fa-solid fa-trash-can"></i>
        </button>
    `;
    container.appendChild(row);
}

function removeMedicationRow(btn) {
    const container = document.getElementById('medicationRowsContainer');
    if (container && container.children.length <= 1) {
        showRxFeedback('At least one medication is required.', 'error');
        return;
    }
    btn.closest('.medication-row').remove();
}

function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Collect medication rows into array
function collectMedications() {
    const rows = document.querySelectorAll('#medicationRowsContainer .medication-row');
    const meds = [];
    rows.forEach(row => {
        const drug = (row.querySelector('.med-drug')?.value || '').trim();
        const dosage = (row.querySelector('.med-dosage')?.value || '').trim();
        const frequency = (row.querySelector('.med-frequency')?.value || '').trim();
        const duration = (row.querySelector('.med-duration')?.value || '').trim();
        if (drug) meds.push({ drug, dosage, frequency, duration });
    });
    return meds;
}

// Save prescription via AJAX
async function savePrescription(event) {
    if (event) event.preventDefault();

    if (!_rxPatient) {
        showRxFeedback('Please select a patient first.', 'error');
        return;
    }

    const diagnosis = (document.getElementById('rx_diagnosis')?.value || '').trim();
    if (!diagnosis) {
        showRxFeedback('Please enter the diagnosis / clinical impression.', 'error');
        document.getElementById('rx_diagnosis')?.focus();
        return;
    }

    const meds = collectMedications();
    if (meds.length === 0) {
        showRxFeedback('Please add at least one medication.', 'error');
        return;
    }

    const notes = (document.getElementById('rx_notes')?.value || '').trim();
    const saveBtn = document.getElementById('rxSaveBtn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

    const payload = new FormData();
    payload.append('save_prescription', '1');
    payload.append('patient_mrn', _rxPatient.mrn);
    payload.append('patient_name', _rxPatient.name);
    payload.append('patient_age', _rxPatient.age);
    payload.append('patient_gender', _rxPatient.gender);
    payload.append('eye', _rxPatient.eye);
    payload.append('diagnosis', diagnosis);
    payload.append('medications_json', JSON.stringify(meds));
    payload.append('notes', notes);
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
            showRxFeedback(data.message || 'Prescription saved successfully.', 'success');
            if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Prescription';
            loadPatientPrescriptions(_rxPatient.mrn);
        } else {
            showRxFeedback(data.error || 'Failed to save prescription.', 'error');
        }
    } catch (err) {
        showRxFeedback('Network error. Please try again.', 'error');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
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

        // If requested, auto-load the latest prescription into the form to edit or see
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
        document.getElementById('rx_notes').value = rx.notes || '';

        // Repopulate medications
        const container = document.getElementById('medicationRowsContainer');
        if (container) {
            container.innerHTML = '';
            const meds = rx.medications || [];
            if (meds.length === 0) {
                addMedicationRow();
            } else {
                meds.forEach(m => addMedicationRow(m.drug, m.dosage, m.frequency, m.duration));
            }
        }

        const saveBtn = document.getElementById('rxSaveBtn');
        if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Prescription';

        // Scroll to form
        document.getElementById('rxFormWorkspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
        showRxFeedback('Failed to load prescription for editing.', 'error');
    }
}

// Print a prescription
function printPrescription(rxId) {
    const printArea = document.getElementById('prescriptionPrintArea');
    if (!printArea) return;

    // Gather data from current patient + form
    const pat = _rxPatient;
    const diagnosis = document.getElementById('rx_diagnosis')?.value || '';
    const notes = document.getElementById('rx_notes')?.value || '';
    const meds = rxId ? [] : collectMedications();  // if rxId, we'll fetch; otherwise use form

    function doPrint(meds, diagnosis, notes) {
        const doctorName = printArea.dataset.doctorName || 'Doctor';
        const licenseNo = printArea.dataset.licenseNo || '';
        const department = printArea.dataset.department || '';
        const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const medRows = meds.map(m => `<tr><td>${escHtml(m.drug)}</td><td>${escHtml(m.dosage)}</td><td>${escHtml(m.frequency)}</td><td>${escHtml(m.duration)}</td></tr>`).join('');

        const eyeLabel = pat ? (pat.eye === 'RE' ? 'Right Eye (OD)' : pat.eye === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)') : '';

        printArea.innerHTML = `
            <div class="print-rx-header">
                <div>
                    <div class="print-rx-hospital">IIEI&amp;H \u2014 Institute of Eye, Ear, Infertility &amp; Hospital</div>
                    <div class="print-rx-subline">Department of Ophthalmology &amp; Microsurgery</div>
                </div>
                <div class="print-rx-doctor">
                    <strong>${escHtml(doctorName)}</strong><br>
                    ${escHtml(department)}<br>
                    <span style="color:#64748b;">BMDC: ${escHtml(licenseNo)}</span>
                </div>
            </div>
            <div class="print-rx-patient-band">
                <div><div class="print-rx-label">Patient Name</div><div class="print-rx-value">${escHtml(pat?.name || '')}</div></div>
                <div><div class="print-rx-label">MRN</div><div class="print-rx-value">${escHtml(pat?.mrn || '')}</div></div>
                <div><div class="print-rx-label">Age / Gender</div><div class="print-rx-value">${pat?.age || ''} yrs / ${escHtml(pat?.gender || '')}</div></div>
                <div><div class="print-rx-label">Eye</div><div class="print-rx-value">${eyeLabel}</div></div>
                <div><div class="print-rx-label">Date</div><div class="print-rx-value">${now}</div></div>
            </div>
            <div class="print-rx-symbol">&#8478;</div>
            <div class="print-rx-diagnosis"><strong>Diagnosis / Clinical Impression:</strong> ${escHtml(diagnosis)}</div>
            <table class="print-med-table">
                <thead><tr><th>Medication</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
                <tbody>${medRows || '<tr><td colspan="4" style="color:#94a3b8;">No medications listed</td></tr>'}</tbody>
            </table>
            ${notes ? `<div class="print-rx-notes"><strong>Instructions / Notes:</strong> ${escHtml(notes)}</div>` : ''}
            <div class="print-rx-footer">
                <div>Printed: ${now}</div>
                <div class="print-rx-sig">
                    <div>Prescribing Doctor</div>
                    <div class="print-rx-sig-line"></div>
                    <div style="font-weight:600;">${escHtml(doctorName)}</div>
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
        doPrint(meds, diagnosis, notes);
    }
}

// Show feedback toast
function showRxFeedback(message, type = 'success') {
    // Remove existing
    document.querySelectorAll('.rx-feedback-toast').forEach(el => el.remove());
    const toast = document.createElement('div');
    toast.className = `rx-feedback-toast ${type}`;
    toast.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'circle-check' : 'circle-exclamation'}"></i> ${escHtml(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; setTimeout(() => toast.remove(), 500); }, 4000);
}

// Initialize Patient Load tab on page load
document.addEventListener('DOMContentLoaded', function() {
    const mrnInput = document.getElementById('patientLoadMRNInput');
    const mrnSearchBtn = document.getElementById('patientLoadMRNSearchBtn');
    const mrnClearBtn = document.getElementById('patientLoadMRNClearBtn');

    if (mrnSearchBtn) {
        mrnSearchBtn.addEventListener('click', searchPatientByMRN);
    }

    if (mrnInput) {
        // Press Enter to search MRN
        mrnInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPatientByMRN();
            }
        });

        // Toggle clear button
        mrnInput.addEventListener('input', function() {
            if (mrnClearBtn) {
                mrnClearBtn.style.display = mrnInput.value.trim() ? 'flex' : 'none';
            }
            const feedback = document.getElementById('patientMRNSearchFeedback');
            if (!mrnInput.value.trim() && feedback) {
                feedback.style.display = 'none';
            }
        });
    }

    // Modal background click and Escape key listeners for patientInfoModal
    const patientModal = document.getElementById('patientInfoModal');
    if (patientModal) {
        patientModal.addEventListener('click', function(e) {
            if (e.target === patientModal) {
                closePatientInfoModal();
            }
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('patientInfoModal');
            if (modal && modal.style.display === 'flex') {
                closePatientInfoModal();
            }
        }
    });

    // Add first medication row if workspace is empty
    const container = document.getElementById('medicationRowsContainer');
    if (container && container.children.length === 0) {
        addMedicationRow();
    }
});

// Window globals for Patient Load
window.searchPatientByMRN = searchPatientByMRN;
window.clearPatientMRNSearch = clearPatientMRNSearch;
window.closePatientInfoModal = closePatientInfoModal;
window.confirmAndOpenPatientPrescription = confirmAndOpenPatientPrescription;
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
window.printPrescription = printPrescription;
