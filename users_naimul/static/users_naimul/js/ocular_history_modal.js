// =============================================================================
// OCULAR HISTORY MODAL — profile.js extension
// Matching the UI reference: Sx/P | Medicine (History/Allergy) | Others
// =============================================================================

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────────
    const ohState = {
        surgeryEye: null,
        medTab: 'history',   // 'history' | 'allergy'
        entries: [],         // { type:'sxp'|'med'|'other', name, eye, duration, remarks, medTab }
    };

    // ── Open / Close ───────────────────────────────────────────────────────────
    function openOcularHistoryModal() {
        const modal = document.getElementById('ocularHistoryModal');
        if (!modal) return;
        modal.style.display = 'flex';
        // Reset inputs but keep existing entries
        resetOhInputs();
        renderOhSummary();
    }

    function closeOcularHistoryModal() {
        const modal = document.getElementById('ocularHistoryModal');
        if (modal) modal.style.display = 'none';
    }

    function resetOhInputs() {
        setVal('ohSurgerySearch', '');
        setVal('ohSurgeryDuration', '');
        setVal('ohSurgeryRemarks', '');
        setOhSurgeryEye(null);
        setVal('ohMedSearch', '');
        setVal('ohMedDuration', '');
        setVal('ohMedRemarks', '');
        setVal('ohOthersRemarks', '');
        updateAddBtn('btnOhSurgeryAdd', false);
        updateAddBtn('btnOhMedAdd', false);
        updateAddBtn('btnOhOthersAdd', false);
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }

    function updateAddBtn(id, enabled) {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.disabled = !enabled;
    }

    // ── Surgery Eye Segment ────────────────────────────────────────────────────
    function setOhSurgeryEye(eye) {
        ohState.surgeryEye = eye;
        document.querySelectorAll('#ohSurgeryEyeSegment .oh-eye-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.eye === eye);
        });
        onOhSurgeryChange();
    }

    function onOhSurgeryChange() {
        const val = (document.getElementById('ohSurgerySearch') || {}).value || '';
        updateAddBtn('btnOhSurgeryAdd', val.trim().length > 0);
    }

    function handleOhSurgeryKey(e) {
        if (e.key === 'Enter') addOhSurgeryEntry();
    }

    // ── Medicine Tab ───────────────────────────────────────────────────────────
    function switchOhMedTab(tab) {
        ohState.medTab = tab;
        ['history', 'allergy'].forEach(t => {
            const btn = document.getElementById(t === 'history' ? 'ohMedTabHistory' : 'ohMedTabAllergy');
            if (btn) btn.classList.toggle('active', t === tab);
        });
    }

    function onOhMedChange() {
        const val = (document.getElementById('ohMedSearch') || {}).value || '';
        updateAddBtn('btnOhMedAdd', val.trim().length > 0);
    }

    // ── Others ─────────────────────────────────────────────────────────────────
    function onOhOthersChange() {
        const val = (document.getElementById('ohOthersRemarks') || {}).value || '';
        updateAddBtn('btnOhOthersAdd', val.trim().length > 0);
    }

    // ── Add Entries ────────────────────────────────────────────────────────────
    function addOhSurgeryEntry() {
        const name = getVal('ohSurgerySearch').trim();
        if (!name) return;
        ohState.entries.push({
            type: 'sxp',
            name,
            eye: ohState.surgeryEye,
            duration: getVal('ohSurgeryDuration').trim(),
            remarks: getVal('ohSurgeryRemarks').trim(),
        });
        setVal('ohSurgerySearch', '');
        setVal('ohSurgeryDuration', '');
        setVal('ohSurgeryRemarks', '');
        setOhSurgeryEye(null);
        updateAddBtn('btnOhSurgeryAdd', false);
        renderOhSummary();
    }

    function addOhMedEntry() {
        const name = getVal('ohMedSearch').trim();
        if (!name) return;
        ohState.entries.push({
            type: 'med',
            name,
            medTab: ohState.medTab,
            duration: getVal('ohMedDuration').trim(),
            remarks: getVal('ohMedRemarks').trim(),
        });
        setVal('ohMedSearch', '');
        setVal('ohMedDuration', '');
        setVal('ohMedRemarks', '');
        updateAddBtn('btnOhMedAdd', false);
        renderOhSummary();
    }

    function addOhOthersEntry() {
        const remarks = getVal('ohOthersRemarks').trim();
        if (!remarks) return;
        ohState.entries.push({
            type: 'other',
            name: remarks,
            duration: '',
            remarks: '',
        });
        setVal('ohOthersRemarks', '');
        updateAddBtn('btnOhOthersAdd', false);
        renderOhSummary();
    }

    function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function removeOhEntry(idx) {
        ohState.entries.splice(idx, 1);
        renderOhSummary();
    }

    // ── Render Summary Panel ───────────────────────────────────────────────────
    function renderOhSummary() {
        const body = document.getElementById('ohSummaryBody');
        if (!body) return;
        if (!ohState.entries.length) {
            body.innerHTML = '<div class="oh-summary-empty">No ocular history recorded.</div>';
            return;
        }
        body.innerHTML = ohState.entries.map((e, i) => {
            const typeLabel = e.type === 'sxp' ? 'Sx/P' : e.type === 'med' ? (e.medTab === 'allergy' ? 'Allergy' : 'Medicine') : 'Others';
            const typeCls   = e.type === 'sxp' ? 'oh-entry-type-sxp' : e.type === 'med' ? 'oh-entry-type-med' : 'oh-entry-type-other';
            const meta = [e.eye, e.duration, e.remarks].filter(Boolean).join(' · ');
            return `
            <div class="oh-summary-entry">
                <div class="oh-summary-entry-left">
                    <div class="oh-summary-entry-name">${esc(e.name)}</div>
                    ${meta ? `<div class="oh-summary-entry-meta">${esc(meta)}</div>` : ''}
                </div>
                <div style="display:flex;align-items:center;gap:5px;flex-shrink:0;">
                    <span class="oh-summary-entry-type ${typeCls}">${typeLabel}</span>
                    <button type="button" class="btn-oh-remove-entry" onclick="removeOhEntry(${i})" title="Remove">&times;</button>
                </div>
            </div>`;
        }).join('');
    }

    function esc(str) {
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // ── Save & close ───────────────────────────────────────────────────────────
    function saveOcularHistoryModal() {
        // Update the inline EMR display
        const display = document.getElementById('emr_ocular_hist_display');
        const badge   = document.getElementById('emr_ocular_history_badge');

        if (ohState.entries.length === 0) {
            if (display) display.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-eye"></i>
                    <span>Click to record ocular history...</span>
                </div>`;
            if (badge) badge.textContent = 'NIL';
        } else {
            if (display) {
                display.innerHTML = `<div class="oh-emr-pill-list">` +
                    ohState.entries.map((e, i) => {
                        const typeCls = e.type === 'sxp' ? 'oh-emr-sxp-tag' : e.type === 'med' ? 'oh-emr-med-tag' : 'oh-emr-other-tag';
                        const typeLabel = e.type === 'sxp' ? 'Sx/P' : e.type === 'med' ? (e.medTab === 'allergy' ? 'Allergy' : 'Medicine') : 'Others';
                        const meta = [e.eye, e.duration].filter(Boolean).join(' · ');
                        return `
                        <div class="oh-emr-entry-row">
                            <div class="oh-emr-entry-left">
                                <span class="oh-emr-type-tag ${typeCls}">${typeLabel}</span>
                                <span class="oh-emr-name-tag">${esc(e.name)}</span>
                                ${meta ? `<span class="oh-emr-meta-tag">${esc(meta)}</span>` : ''}
                            </div>
                        </div>`;
                    }).join('') +
                `</div>`;
            }
            if (badge) badge.textContent = `${ohState.entries.length} record${ohState.entries.length > 1 ? 's' : ''}`;
        }

        closeOcularHistoryModal();
    }

    // ── Re-workup ──────────────────────────────────────────────────────────────
    function orderOcularHistoryReworkup() {
        alert('Re-workup order noted. Please follow up with the optometry department.');
    }

    // ── Close on backdrop / Escape ─────────────────────────────────────────────
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('ocularHistoryModal');
        if (modal && e.target === modal) closeOcularHistoryModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        const modal = document.getElementById('ocularHistoryModal');
        if (modal && modal.style.display === 'flex') closeOcularHistoryModal();
    });

    // ── Expose globally ────────────────────────────────────────────────────────
    window.openOcularHistoryModal    = openOcularHistoryModal;
    window.closeOcularHistoryModal   = closeOcularHistoryModal;
    window.setOhSurgeryEye           = setOhSurgeryEye;
    window.onOhSurgeryChange         = onOhSurgeryChange;
    window.handleOhSurgeryKey        = handleOhSurgeryKey;
    window.switchOhMedTab            = switchOhMedTab;
    window.onOhMedChange             = onOhMedChange;
    window.onOhOthersChange          = onOhOthersChange;
    window.addOhSurgeryEntry         = addOhSurgeryEntry;
    window.addOhMedEntry             = addOhMedEntry;
    window.addOhOthersEntry          = addOhOthersEntry;
    window.removeOhEntry             = removeOhEntry;
    window.saveOcularHistoryModal    = saveOcularHistoryModal;
    window.orderOcularHistoryReworkup = orderOcularHistoryReworkup;

})();
