// ==============================================================================
// IIEI&H Surgeries & Procedures Console - Client Logic
// ==============================================================================

// ID of the surgery record currently being edited in the Edit Modal
let currentEditSurgeryId = null;

// --- Update Slot Availability Badges in Dropdown ------------------------------
function updateSlotOptionBadges(mode) {
    const roomEl = document.getElementById(mode === 'add' ? 'add_ot_room' : 'edit_ot_room');
    const slotEl = document.getElementById(mode === 'add' ? 'add_ot_slot' : 'edit_ot_slot');
    if (!roomEl || !slotEl || typeof bookedOtSlots === 'undefined') return;

    const selectedRoom = roomEl.value;
    const editingId = mode === 'edit' ? currentEditSurgeryId : null;
    const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';

    Array.from(slotEl.options).forEach(opt => {
        if (!opt.dataset.baseText) {
            opt.dataset.baseText = opt.text.split(' — ')[0].trim();
        }
        const key = selectedRoom + '||' + opt.value;
        const booked = bookedOtSlots[key];
        const isSelf = editingId && booked && String(booked.id) === String(editingId);

        if (booked && !isSelf) {
            opt.text = `${opt.dataset.baseText} — 🔴 Booked (${booked.patient_name})`;
            opt.classList.add('slot-option-booked');
            opt.classList.remove('slot-option-open');
            opt.style.color = isDark ? '#fca5a5' : '#dc2626';
            opt.style.backgroundColor = isDark ? '#1e131d' : '#fef2f2';
        } else {
            opt.text = `${opt.dataset.baseText} — 🟢 Open`;
            opt.classList.add('slot-option-open');
            opt.classList.remove('slot-option-booked');
            opt.style.color = isDark ? '#86efac' : '#15803d';
            opt.style.backgroundColor = isDark ? '#0d1f1b' : '#f0fdf4';
        }
    });
}

// --- Check for OT Slot Clash (Add & Edit Modals) -------------------------------
function checkSurgeriesOtClash(mode) {
    updateSlotOptionBadges(mode);

    const roomEl = document.getElementById(mode === 'add' ? 'add_ot_room' : 'edit_ot_room');
    const slotEl = document.getElementById(mode === 'add' ? 'add_ot_slot' : 'edit_ot_slot');
    const alertEl = document.getElementById(mode === 'add' ? 'add_slot_clash_alert' : 'edit_slot_clash_alert');
    const msgEl = document.getElementById(mode === 'add' ? 'add_slot_clash_msg' : 'edit_slot_clash_msg');
    const submitBtn = document.getElementById(mode === 'add' ? 'add_surgery_submit_btn' : 'edit_surgery_submit_btn');
    const editingId = mode === 'edit' ? currentEditSurgeryId : null;

    if (!roomEl || !slotEl || !alertEl || typeof bookedOtSlots === 'undefined') return false;

    const key = roomEl.value + '||' + slotEl.value;
    const booked = bookedOtSlots[key];
    const isSelf = editingId && booked && String(booked.id) === String(editingId);

    if (booked && !isSelf) {
        msgEl.textContent = `⚠ Slot Clash! ${roomEl.value} / ${slotEl.value} is already booked for ${booked.patient_name} (${booked.patient_mrn}). Registration cannot be completed for this slot. Please select an available slot.`;
        alertEl.style.display = 'flex';
        slotEl.classList.add('slot-clash-active');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.45';
            submitBtn.style.cursor = 'not-allowed';
            submitBtn.title = 'Selected slot is already booked. Please choose an open slot.';
        }
        return true; // clash detected
    } else {
        alertEl.style.display = 'none';
        slotEl.classList.remove('slot-clash-active');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '';
            submitBtn.style.cursor = '';
            submitBtn.title = '';
        }
        return false; // slot is available
    }
}

// --- Form Submit Pre-Validation -----------------------------------------------
function validateSurgeriesOtSlot(mode) {
    const hasClash = checkSurgeriesOtClash(mode);
    if (hasClash) {
        const topErrorEl = document.getElementById(mode === 'add' ? 'addModalError' : 'editModalError');
        const topErrorText = document.getElementById(mode === 'add' ? 'addModalErrorText' : 'editModalErrorText');
        const roomEl = document.getElementById(mode === 'add' ? 'add_ot_room' : 'edit_ot_room');
        const slotEl = document.getElementById(mode === 'add' ? 'add_ot_slot' : 'edit_ot_slot');
        const key = roomEl.value + '||' + slotEl.value;
        const booked = (typeof bookedOtSlots !== 'undefined') ? bookedOtSlots[key] : null;

        if (topErrorEl && topErrorText && booked) {
            topErrorText.textContent = `Registration blocked: ${roomEl.value} / ${slotEl.value} is already booked for ${booked.patient_name} (${booked.patient_mrn}). At a time only one patient can book a slot.`;
            topErrorEl.style.display = 'flex';
        }

        const alertEl = document.getElementById(mode === 'add' ? 'add_slot_clash_alert' : 'edit_slot_clash_alert');
        if (alertEl) {
            alertEl.style.animation = 'none';
            void alertEl.offsetWidth; // trigger reflow
            alertEl.style.animation = 'shakeAlert 0.35s ease-in-out';
        }
        if (slotEl) {
            slotEl.focus();
        }
        return false;
    }
    return true;
}

// --- Modal: New Surgery -------------------------------------------------------
function openNewSurgeryModal() {
    const topError = document.getElementById('addModalError');
    if (topError) topError.style.display = 'none';
    const fieldAlert = document.getElementById('add_slot_clash_alert');
    if (fieldAlert) fieldAlert.style.display = 'none';
    const slotEl = document.getElementById('add_ot_slot');
    if (slotEl) slotEl.classList.remove('slot-clash-active');

    document.getElementById('surgeryModal').style.display = 'flex';
    checkSurgeriesOtClash('add');
}

function closeNewSurgeryModal() {
    document.getElementById('surgeryModal').style.display = 'none';
    const topError = document.getElementById('addModalError');
    if (topError) topError.style.display = 'none';
    const fieldAlert = document.getElementById('add_slot_clash_alert');
    if (fieldAlert) fieldAlert.style.display = 'none';
}

// --- Modal: Edit Surgery ------------------------------------------------------
function openEditSurgeryModal(id, mrn, name, age, gender, eye, type, surgeon, ot_room, ot_slot, outcome, med_history, notes) {
    currentEditSurgeryId = id;
    document.getElementById('edit_surgery_id').value = id;
    document.getElementById('edit_patient_mrn_text').textContent = mrn;
    document.getElementById('edit_patient_name').value = name;
    document.getElementById('edit_patient_age').value = age;
    document.getElementById('edit_patient_gender').value = gender;
    document.getElementById('edit_eye').value = eye;
    document.getElementById('edit_surgery_type').value = type;
    document.getElementById('edit_surgeon_name').value = surgeon;
    document.getElementById('edit_ot_room').value = ot_room;
    document.getElementById('edit_ot_slot').value = ot_slot;
    document.getElementById('edit_outcome').value = outcome;
    document.getElementById('edit_medical_history').value = med_history;
    document.getElementById('edit_notes').value = notes;

    const topError = document.getElementById('editModalError');
    if (topError) topError.style.display = 'none';
    const fieldAlert = document.getElementById('edit_slot_clash_alert');
    if (fieldAlert) fieldAlert.style.display = 'none';
    const slotEl = document.getElementById('edit_ot_slot');
    if (slotEl) slotEl.classList.remove('slot-clash-active');

    document.getElementById('editSurgeryModal').style.display = 'flex';
    checkSurgeriesOtClash('edit');
}

function closeEditSurgeryModal() {
    currentEditSurgeryId = null;
    document.getElementById('editSurgeryModal').style.display = 'none';
    const topError = document.getElementById('editModalError');
    if (topError) topError.style.display = 'none';
    const fieldAlert = document.getElementById('edit_slot_clash_alert');
    if (fieldAlert) fieldAlert.style.display = 'none';
}

// --- Search Error & Patient Not Found Modal Controller -----------------------
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
    const input = document.querySelector('.search-input');
    if (input) {
        try {
            input.focus();
            input.select();
        } catch (e) {}
    }
}
window.closeSearchErrorModal = closeSearchErrorModal;

// --- Close modal on overlay click --------------------------------------------
window.onclick = function (event) {
    const modal = document.getElementById('surgeryModal');
    const editModal = document.getElementById('editSurgeryModal');
    const searchModal = document.getElementById('searchErrorModal');
    if (event.target === modal) {
        closeNewSurgeryModal();
    }
    if (event.target === editModal) {
        closeEditSurgeryModal();
    }
    if (event.target === searchModal) {
        closeSearchErrorModal();
    }
};

// Close modals on Escape key
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeSearchErrorModal();
        closeNewSurgeryModal();
        closeEditSurgeryModal();
    }
});

// --- Auto-dismiss alert toasts after 5 seconds --------------------------------
function dismissToast(toastEl) {
    if (!toastEl || toastEl.classList.contains('fade-out')) return;
    toastEl.classList.add('fade-out');
    setTimeout(() => {
        if (toastEl && toastEl.parentNode) {
            toastEl.remove();
        }
    }, 400);
}
window.dismissToast = dismissToast;

function initAlertToasts() {
    const toasts = document.querySelectorAll('.alert-toast');
    toasts.forEach(toast => {
        setTimeout(() => {
            dismissToast(toast);
        }, 3000);
    });
}

// --- Day / Night Theme Controller --------------------------------------------
function setAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('iieih_theme', theme);
    } catch (e) { }
    document.querySelectorAll('.theme-switch-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-theme-val') === theme);
    });
    // Dynamically refresh slot options if modal is open or loaded
    if (typeof updateSlotOptionBadges === 'function') {
        const addModal = document.getElementById('surgeryModal');
        const editModal = document.getElementById('editSurgeryModal');
        if (addModal && addModal.style.display !== 'none') updateSlotOptionBadges('add');
        if (editModal && editModal.style.display !== 'none') updateSlotOptionBadges('edit');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setAppTheme(currentTheme);
    initAlertToasts();
});

if (document.readyState !== 'loading') {
    initAlertToasts();
}
