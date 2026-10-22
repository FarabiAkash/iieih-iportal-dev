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
    if (e.target === dossier) closePatientDossier();
    if (e.target === ocular) closeOcularReport();
    if (e.target === editModal) closeEditSurgeryModal();
    if (e.target === searchModal) closeSearchErrorModal();
    if (e.target === scheduleModal && typeof closeSchedulePatientModal === 'function') closeSchedulePatientModal();
};

// Close modals on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeSearchErrorModal();
        closePatientDossier();
        closeOcularReport();
        closeEditSurgeryModal();
        if (typeof closeSchedulePatientModal === 'function') closeSchedulePatientModal();
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
