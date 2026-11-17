// ─── Clinical Tab Switcher ────────────────────────────────────────────────────
function switchClinicalTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

    const clickedBtn = (typeof event !== 'undefined' && event && event.currentTarget && event.currentTarget.classList && event.currentTarget.classList.contains('tab-btn'))
        ? event.currentTarget
        : document.querySelector(`.tab-btn[onclick*="${tabId}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
        try {
            clickedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } catch (e) { }
    }

    const targetPane = document.getElementById('pane-' + tabId);
    if (targetPane) {
        targetPane.classList.add('active');
    }

    if (window.history && window.history.replaceState) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        window.history.replaceState({}, '', url);
    }
}

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

