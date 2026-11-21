// =============================================================================
// SYSTEMIC HISTORY MODAL — profile.js extension
// Tabs: Systemic History | Social & Family | Birth | Immunization | Myopia
// =============================================================================

(function () {
    'use strict';

    // ── Conditions definition ──────────────────────────────────────────────────
    const SYSTEMIC_CONDITIONS = [
        { key: 'asthma',           label: 'Asthma' },
        { key: 'cardiac',          label: 'Cardiac' },
        { key: 'diabetes',         label: 'Diabetes' },
        { key: 'epilepsy',         label: 'Epilepsy/Seizures' },
        { key: 'malignancy',       label: 'History of Malignancy' },
        { key: 'hyperlipidemia',   label: 'Hyperlipidemia' },
        { key: 'hypertension',     label: 'Hypertension' },
        { key: 'nonHealingUlcers', label: 'Non-Healing Ulcers in hand/Foot' },
        { key: 'renalDisease',     label: 'Renal Disease' },
        { key: 'strokeNeuro',      label: 'Stroke/Neuro' },
        { key: 'tb',               label: 'TB' },
        { key: 'thyroidStatus',    label: 'Thyroid Status' },
        { key: 'otherAllergies',   label: 'Other Allergies' },
        { key: 'drugAllergies',    label: 'Drug Allergies' },
        { key: 'nonOcularSx',      label: 'Non-Ocular Sx' },
        { key: 'others',           label: 'Others' },
    ];

    // ── State ──────────────────────────────────────────────────────────────────
    let _state = buildEmptyState();

    function buildEmptyState() {
        const systemic = {};
        SYSTEMIC_CONDITIONS.forEach(c => { systemic[c.key] = 'No'; });
        return {
            activeTab: 'systemic',
            noSystemicHistory: false,
            systemic,
            systemicRemarks: '',
        };
    }

    // ── Open / Close ───────────────────────────────────────────────────────────
    function openHistoryModal() {
        const modal = document.getElementById('historyModal');
        if (!modal) return;
        modal.style.display = 'flex';
        renderConditionsList();
        setHistoryTab(_state.activeTab);
        syncNoSystemicCheckbox();
        renderSummaryPanel();
    }

    function closeHistoryModal() {
        const modal = document.getElementById('historyModal');
        if (modal) modal.style.display = 'none';
    }

    // ── Tab switching ──────────────────────────────────────────────────────────
    function setHistoryTab(tab) {
        _state.activeTab = tab;
        // Update tab button active state
        document.querySelectorAll('.history-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        // Show/hide panes
        document.querySelectorAll('.history-tab-pane').forEach(pane => {
            pane.style.display = pane.id === 'historyTabPane_' + tab ? 'block' : 'none';
        });
        // Show/hide No Systemic History checkbox (only on systemic tab)
        const noSysWrap = document.getElementById('historyNoSysWrap');
        if (noSysWrap) noSysWrap.style.display = tab === 'systemic' ? 'flex' : 'none';
    }

    // ── No Systemic History toggle ─────────────────────────────────────────────
    function toggleNoSystemicHistory(checked) {
        _state.noSystemicHistory = checked;
        if (checked) {
            SYSTEMIC_CONDITIONS.forEach(c => { _state.systemic[c.key] = 'No'; });
            renderConditionsList();
        }
        // Disable/enable condition buttons
        document.querySelectorAll('.history-no-btn, .history-yes-btn').forEach(btn => {
            btn.disabled = checked;
        });
        renderSummaryPanel();
    }

    function syncNoSystemicCheckbox() {
        const cb = document.getElementById('historyNoSystemicCheckbox');
        if (cb) cb.checked = _state.noSystemicHistory;
        // Apply disabled state
        document.querySelectorAll('.history-no-btn, .history-yes-btn').forEach(btn => {
            btn.disabled = _state.noSystemicHistory;
        });
    }

    // ── Set condition value ────────────────────────────────────────────────────
    function setHistoryField(key, value) {
        if (_state.noSystemicHistory) return;
        _state.systemic[key] = value;
        // Update button active states for this condition row
        const row = document.querySelector('[data-condition-key="' + key + '"]');
        if (row) {
            row.querySelectorAll('.history-no-btn').forEach(b => b.classList.toggle('active', value === 'No'));
            row.querySelectorAll('.history-yes-btn').forEach(b => b.classList.toggle('active', value === 'Yes'));
        }
        renderSummaryPanel();
    }

    // ── Render condition list ──────────────────────────────────────────────────
    function renderConditionsList() {
        const container = document.getElementById('historyConditionsList');
        if (!container) return;

        container.innerHTML = SYSTEMIC_CONDITIONS.map(c => {
            const val = _state.systemic[c.key] || 'No';
            return `
            <div class="history-condition-row" data-condition-key="${c.key}">
                <span class="history-condition-label">${c.label} <span class="history-required-star">*</span></span>
                <div class="history-no-yes-toggle">
                    <button type="button"
                        class="history-no-btn${val === 'No' ? ' active' : ''}"
                        onclick="setHistoryField('${c.key}', 'No')"
                        ${_state.noSystemicHistory ? 'disabled' : ''}>No</button>
                    <button type="button"
                        class="history-yes-btn${val === 'Yes' ? ' active' : ''}"
                        onclick="setHistoryField('${c.key}', 'Yes')"
                        ${_state.noSystemicHistory ? 'disabled' : ''}>Yes</button>
                </div>
            </div>`;
        }).join('');
    }

    // ── Render summary panel ───────────────────────────────────────────────────
    function renderSummaryPanel() {
        const positives = SYSTEMIC_CONDITIONS
            .filter(c => _state.systemic[c.key] === 'Yes')
            .map(c => c.label);

        const allergyKeys = ['otherAllergies', 'drugAllergies'];
        const allergyPositives = SYSTEMIC_CONDITIONS
            .filter(c => allergyKeys.includes(c.key) && _state.systemic[c.key] === 'Yes')
            .map(c => c.label);

        const nonAllergyPositives = positives.filter(l =>
            !allergyPositives.includes(l));

        const sysEl = document.getElementById('historySummary_systemic');
        const allergyEl = document.getElementById('historySummary_allergies');

        if (sysEl) {
            sysEl.textContent = _state.noSystemicHistory
                ? 'No Systemic History'
                : (nonAllergyPositives.length ? nonAllergyPositives.join(', ') : 'Nil');
        }
        if (allergyEl) {
            allergyEl.textContent = allergyPositives.length ? allergyPositives.join(', ') : 'Nil';
        }
    }

    // ── Save remarks ───────────────────────────────────────────────────────────
    function saveHistoryTab() {
        const remarksEl = document.getElementById('historySystemicRemarks');
        if (remarksEl) _state.systemicRemarks = remarksEl.value;
        // Flash save button feedback
        const btn = document.querySelector('.btn-history-save-tab');
        if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
            btn.style.background = '#059669';
            setTimeout(() => {
                btn.innerHTML = orig;
                btn.style.background = '';
            }, 1200);
        }
    }

    // ── Done — save & close, update EMR display ────────────────────────────────
    function saveAndCloseHistoryModal() {
        saveHistoryTab();
        updateHistoryEMRDisplay();
        closeHistoryModal();
    }

    function updateHistoryEMRDisplay() {
        const positives = SYSTEMIC_CONDITIONS
            .filter(c => _state.systemic[c.key] === 'Yes')
            .map(c => c.label);

        const allergyKeys = ['otherAllergies', 'drugAllergies'];
        const allergyPositives = positives.filter(l =>
            SYSTEMIC_CONDITIONS.find(c => c.label === l && allergyKeys.includes(c.key)));
        const nonAllergyPositives = positives.filter(l => !allergyPositives.includes(l));

        const sysText = _state.noSystemicHistory
            ? 'No Systemic History'
            : (nonAllergyPositives.length ? nonAllergyPositives.join(', ') : 'Nil');
        const allergyText = allergyPositives.length ? allergyPositives.join(', ') : 'Nil';

        // EMR left panel
        const sysVal = document.getElementById('emr_sys_hist_val');
        const allergyVal = document.getElementById('emr_allergies_val');
        if (sysVal) sysVal.textContent = sysText;
        if (allergyVal) allergyVal.textContent = allergyText;

        // Yellow badge bar
        const badge = document.getElementById('emr_sys_history_badge');
        if (badge) {
            badge.textContent = positives.length
                ? 'Sys: ' + positives.slice(0, 2).join(', ') + (positives.length > 2 ? ' +' + (positives.length - 2) + ' more' : '')
                : 'Systemic History: Nil';
            badge.style.background = positives.length ? 'rgba(220,38,38,0.12)' : '';
            badge.style.color = positives.length ? '#dc2626' : '';
        }
    }

    // ── Reset on new patient load ──────────────────────────────────────────────
    function resetHistoryState() {
        _state = buildEmptyState();
        const remarksEl = document.getElementById('historySystemicRemarks');
        if (remarksEl) remarksEl.value = '';
        const badge = document.getElementById('emr_sys_history_badge');
        if (badge) {
            badge.textContent = 'Systemic History: Nil';
            badge.style.background = '';
            badge.style.color = '';
        }
        const sysVal = document.getElementById('emr_sys_hist_val');
        const allergyVal = document.getElementById('emr_allergies_val');
        if (sysVal) sysVal.textContent = 'Nil';
        if (allergyVal) allergyVal.textContent = 'Nil';
    }

    // ── Backdrop click close ───────────────────────────────────────────────────
    document.addEventListener('click', function (e) {
        const modal = document.getElementById('historyModal');
        if (modal && e.target === modal) closeHistoryModal();
    });

    // ── Escape key close ───────────────────────────────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('historyModal');
            if (modal && modal.style.display !== 'none') closeHistoryModal();
        }
    });

    // ── Exports ────────────────────────────────────────────────────────────────
    window.openHistoryModal = openHistoryModal;
    window.closeHistoryModal = closeHistoryModal;
    window.setHistoryTab = setHistoryTab;
    window.toggleNoSystemicHistory = toggleNoSystemicHistory;
    window.setHistoryField = setHistoryField;
    window.saveHistoryTab = saveHistoryTab;
    window.saveAndCloseHistoryModal = saveAndCloseHistoryModal;
    window.resetHistoryState = resetHistoryState;

})();
