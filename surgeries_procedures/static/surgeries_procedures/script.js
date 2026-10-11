// --- Modal: New Surgery -------------------------------------------------------
function openNewSurgeryModal() {
    document.getElementById('surgeryModal').style.display = 'flex';
}

function closeNewSurgeryModal() {
    document.getElementById('surgeryModal').style.display = 'none';
}

// --- Modal: Edit Surgery ------------------------------------------------------
function openEditSurgeryModal(id, mrn, name, age, gender, eye, type, surgeon, ot_room, ot_slot, outcome, med_history, notes) {
    document.getElementById('edit_surgery_id').value = id;
    document.getElementById('edit_patient_mrn').value = mrn;
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

    document.getElementById('editSurgeryModal').style.display = 'flex';
}

function closeEditSurgeryModal() {
    document.getElementById('editSurgeryModal').style.display = 'none';
}

// --- Close modal on overlay click --------------------------------------------
window.onclick = function (event) {
    const modal = document.getElementById('surgeryModal');
    const editModal = document.getElementById('editSurgeryModal');
    if (event.target === modal) {
        closeNewSurgeryModal();
    }
    if (event.target === editModal) {
        closeEditSurgeryModal();
    }
};

// --- Day / Night Theme Controller --------------------------------------------
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
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setAppTheme(currentTheme);
});

