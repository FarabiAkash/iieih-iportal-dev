/**
 * =============================================================================
 * COMPLAINTS POPUP MODAL JAVASCRIPT (complaints_modal.js)
 * Hospital EMR Standard — Ispahani Islamia Eye Institute & Hospital
 *
 * Capabilities:
 * - Full complaints state management (shared with profile.js)
 * - Custom autocomplete dropdown with keyboard navigation, clear spacing,
 *   distinct highlight for selected option, and subtle hover color
 * - Top complaints pill selection placed directly below the search bar
 * - Two-column side panel summary rendering with edit, remove, and clear all
 * - Live prescription text preview
 * - SessionStorage draft persistence & AJAX save to backend
 * - Responsive support for desktop and mobile
 * =============================================================================
 */

(function () {
    'use strict';

    // ── Master Clinical Complaints Catalog ────────────────────────────────────
    const COMPLAINTS_CATALOG = [
        { name: 'Dimness of vision', category: 'Vision', icon: 'fa-eye' },
        { name: 'Blurring of vision', category: 'Vision', icon: 'fa-eye' },
        { name: 'Double Vision', category: 'Vision', icon: 'fa-eye' },
        { name: 'Eye pain', category: 'Pain', icon: 'fa-triangle-exclamation' },
        { name: 'Redness of eye', category: 'Surface', icon: 'fa-eye-dropper' },
        { name: 'Watering of eye', category: 'Surface', icon: 'fa-droplet' },
        { name: 'Foreign body sensation', category: 'Surface', icon: 'fa-hand-dots' },
        { name: 'Itching of eyes', category: 'Allergy', icon: 'fa-hand' },
        { name: 'Floaters', category: 'Vitreous', icon: 'fa-circle-notch' },
        { name: 'Flashes of light', category: 'Retina', icon: 'fa-bolt' },
        { name: 'Photophobia', category: 'Sensitivity', icon: 'fa-sun' },
        { name: 'Dry eyes', category: 'Surface', icon: 'fa-wind' },
        { name: 'Eye strain / Asthenopia', category: 'Refractive', icon: 'fa-glasses' },
        { name: 'Discharge from eyes', category: 'Infection', icon: 'fa-bacteria' },
        { name: 'Swelling of eyelid', category: 'Adnexa', icon: 'fa-circle-exclamation' },
        { name: 'Night blindness', category: 'Retina', icon: 'fa-moon' },
        { name: 'Colored halos around lights', category: 'Cornea/IOP', icon: 'fa-rainbow' },
        { name: 'Distortion of vision', category: 'Macula', icon: 'fa-wave-square' },
        { name: 'Drooping of eyelid', category: 'Adnexa', icon: 'fa-angles-down' },
        { name: 'Sudden loss of vision', category: 'Emergency', icon: 'fa-circle-radiation' },
        { name: 'Gradual loss of vision', category: 'Chronic', icon: 'fa-hourglass-half' },
        { name: 'Burning sensation', category: 'Surface', icon: 'fa-fire' },
        { name: 'Twitching of eyelid', category: 'Neuromuscular', icon: 'fa-bolt' },
        { name: 'Trauma / Injury to eye', category: 'Trauma', icon: 'fa-crutch' },
        { name: 'Headache', category: 'General', icon: 'fa-head-side-virus' },
        { name: 'Fever', category: 'Systemic', icon: 'fa-temperature-high' },
        { name: 'Chest Pain', category: 'Systemic', icon: 'fa-heart-pulse' }
    ];

    // ── Global State (Attached to Window for cross-file interoperability) ────
    window._currentComplaints = window._currentComplaints || [];
    window._complaintSelectedEye = window._complaintSelectedEye || 'BE';
    window._complaintVisitMeta = window._complaintVisitMeta || {
        purpose: '',
        remarks: '',
        informant: 'Patient',
        specify_informant: ''
    };

    let dropdownHighlightedIndex = -1;
    let currentDropdownMatches = [];

    // ── HTML Escaping Utility ────────────────────────────────────────────────
    function safeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[m]));
    }

    // ── Modal Open / Close ───────────────────────────────────────────────────
    function openComplaintsModal() {
        const modal = document.getElementById('complaintsModal');
        if (!modal) return;

        const searchInput = document.getElementById('complaintSearchInput');
        const purposeSelect = document.getElementById('complaintPurposeOfVisit');
        const remarksInput = document.getElementById('complaintRemarks');
        const informantSelect = document.getElementById('complaintInformant');
        const specInfInput = document.getElementById('complaintSpecifyInformant');

        if (purposeSelect) purposeSelect.value = window._complaintVisitMeta.purpose || '';
        if (remarksInput) remarksInput.value = window._complaintVisitMeta.remarks || '';
        if (informantSelect) informantSelect.value = window._complaintVisitMeta.informant || 'Patient';
        if (specInfInput) specInfInput.value = window._complaintVisitMeta.specify_informant || '';

        setComplaintEye(window._complaintSelectedEye || 'BE');
        onInformantChange();
        renderComplaintsSummary();
        onComplaintInputChange();

        modal.style.display = 'flex';

        if (searchInput) {
            setTimeout(() => {
                searchInput.focus();
                filterComplaintDropdown('');
            }, 120);
        }
    }

    function closeComplaintsModal() {
        const modal = document.getElementById('complaintsModal');
        if (modal) modal.style.display = 'none';
        closeComplaintDropdown();
    }

    // ── Eye Segment Selector ─────────────────────────────────────────────────
    function setComplaintEye(eye) {
        window._complaintSelectedEye = eye || 'BE';
        document.querySelectorAll('#complaintEyeSegment .eye-seg-btn').forEach(btn => {
            if (btn.dataset.eye === window._complaintSelectedEye) {
                btn.classList.add('active');
                btn.setAttribute('aria-pressed', 'true');
            } else {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    }

    // ── Top Complaints Selection ─────────────────────────────────────────────
    function selectTopComplaint(name) {
        const searchInput = document.getElementById('complaintSearchInput');
        if (searchInput) {
            searchInput.value = name;
            onComplaintInputChange();
            closeComplaintDropdown();

            const durInput = document.getElementById('complaintDurationNum');
            if (durInput && !durInput.value) {
                durInput.focus();
            } else {
                const addBtn = document.getElementById('btnAddComplaint');
                if (addBtn && !addBtn.disabled) addBtn.focus();
            }
        }
        syncTopPillActiveState(name);
    }

    function syncTopPillActiveState(selectedName) {
        const normalized = (selectedName || '').trim().toLowerCase();
        document.querySelectorAll('#complaintTopPills .complaint-quick-pill').forEach(btn => {
            if (normalized && btn.textContent.trim().toLowerCase() === normalized) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    // ── Search Input Changes & Clear ─────────────────────────────────────────
    function onComplaintInputChange() {
        const searchInput = document.getElementById('complaintSearchInput');
        const addBtn = document.getElementById('btnAddComplaint');
        const clearBtn = document.getElementById('btnComplaintSearchClear');
        const val = (searchInput?.value || '').trim();

        if (clearBtn) {
            clearBtn.style.display = val.length > 0 ? 'inline-flex' : 'none';
        }

        if (addBtn) {
            if (val.length > 0) {
                addBtn.disabled = false;
                addBtn.classList.remove('disabled');
            } else {
                addBtn.disabled = true;
                addBtn.classList.add('disabled');
            }
        }

        syncTopPillActiveState(val);
        filterComplaintDropdown(val);
    }

    function clearComplaintSearch() {
        const searchInput = document.getElementById('complaintSearchInput');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        onComplaintInputChange();
        syncTopPillActiveState('');
        filterComplaintDropdown('');
    }

    // ── Custom Autocomplete Dropdown Logic ───────────────────────────────────
    function openComplaintDropdown() {
        const searchInput = document.getElementById('complaintSearchInput');
        const query = (searchInput?.value || '').trim();
        filterComplaintDropdown(query);
    }

    function closeComplaintDropdown() {
        const dropdown = document.getElementById('complaintSearchDropdown');
        if (dropdown) dropdown.style.display = 'none';
        dropdownHighlightedIndex = -1;
        currentDropdownMatches = [];
    }

    function filterComplaintDropdown(query) {
        const dropdown = document.getElementById('complaintSearchDropdown');
        if (!dropdown) return;

        const q = (query || '').trim().toLowerCase();
        let matches = [];

        if (!q) {
            // Default top suggestions when input is empty
            matches = COMPLAINTS_CATALOG.slice(0, 9);
        } else {
            // Filter matches
            matches = COMPLAINTS_CATALOG.filter(c => c.name.toLowerCase().includes(q));
        }

        currentDropdownMatches = matches;
        dropdownHighlightedIndex = -1;

        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div class="complaint-dropdown-empty">
                    <span>No predefined match. Press <strong>Enter</strong> or click <strong>+ Add</strong> to record custom complaint.</span>
                </div>
            `;
            dropdown.style.display = 'flex';
            return;
        }

        let html = '';
        matches.forEach((item, idx) => {
            let displayName = safeHtml(item.name);
            if (q) {
                const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                displayName = safeHtml(item.name).replace(regex, '<span class="item-match">$1</span>');
            }

            html += `
                <div class="complaint-dropdown-item" data-index="${idx}" data-name="${safeHtml(item.name)}"
                     onmouseenter="highlightDropdownItem(${idx})" onclick="selectDropdownOption('${safeHtml(item.name)}')">
                    <div class="item-name-wrap">
                        <i class="fa-solid ${safeHtml(item.icon || 'fa-notes-medical')} item-icon"></i>
                        <span>${displayName}</span>
                    </div>
                    <span class="item-category">${safeHtml(item.category)}</span>
                </div>
            `;
        });

        dropdown.innerHTML = html;
        dropdown.style.display = 'flex';
    }

    function highlightDropdownItem(index) {
        dropdownHighlightedIndex = index;
        const items = document.querySelectorAll('#complaintSearchDropdown .complaint-dropdown-item');
        items.forEach((el, i) => {
            if (i === index) {
                el.classList.add('is-selected');
                el.scrollIntoView({ block: 'nearest' });
            } else {
                el.classList.remove('is-selected');
            }
        });
    }

    function selectDropdownOption(name) {
        const searchInput = document.getElementById('complaintSearchInput');
        if (searchInput) {
            searchInput.value = name;
        }
        closeComplaintDropdown();
        onComplaintInputChange();
        syncTopPillActiveState(name);

        const durNum = document.getElementById('complaintDurationNum');
        if (durNum) {
            durNum.focus();
        } else {
            const addBtn = document.getElementById('btnAddComplaint');
            if (addBtn && !addBtn.disabled) addBtn.focus();
        }
    }

    // ── Keyboard Navigation (Search Input & Dropdown) ────────────────────────
    function handleComplaintInputKey(event) {
        const dropdown = document.getElementById('complaintSearchDropdown');
        const isDropdownOpen = dropdown && dropdown.style.display !== 'none';

        if (event.key === 'ArrowDown') {
            if (!isDropdownOpen) {
                openComplaintDropdown();
                return;
            }
            event.preventDefault();
            if (currentDropdownMatches.length > 0) {
                const nextIndex = (dropdownHighlightedIndex + 1) % currentDropdownMatches.length;
                highlightDropdownItem(nextIndex);
            }
        } else if (event.key === 'ArrowUp') {
            if (isDropdownOpen) {
                event.preventDefault();
                if (currentDropdownMatches.length > 0) {
                    const prevIndex = (dropdownHighlightedIndex - 1 + currentDropdownMatches.length) % currentDropdownMatches.length;
                    highlightDropdownItem(prevIndex);
                }
            }
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (isDropdownOpen && dropdownHighlightedIndex >= 0 && dropdownHighlightedIndex < currentDropdownMatches.length) {
                selectDropdownOption(currentDropdownMatches[dropdownHighlightedIndex].name);
            } else {
                closeComplaintDropdown();
                addCurrentComplaint();
            }
        } else if (event.key === 'Escape') {
            if (isDropdownOpen) {
                event.preventDefault();
                closeComplaintDropdown();
            } else {
                closeComplaintsModal();
            }
        }
    }

    // ── Helper formatters for Complaint Summary format (Title – Eye – Duration) ─
    function formatComplaintEye(eye) {
        if (!eye) return 'Both Eyes';
        const s = String(eye).trim();
        if (s === 'RE' || /^right(\s+eye)?(\s*\(od\))?$/i.test(s)) return 'Right Eye';
        if (s === 'LE' || /^left(\s+eye)?(\s*\(os\))?$/i.test(s)) return 'Left Eye';
        if (s === 'BE' || /^both(\s+eyes?)?(\s*\(ou\))?$/i.test(s)) return 'Both Eyes';
        return s;
    }

    function formatComplaintDuration(duration) {
        if (!duration) return '';
        const s = String(duration).trim();
        const parts = s.split(/\s+/);
        if (parts.length >= 2 && !isNaN(parts[0])) {
            return `${parts[0]} ${parts.slice(1).join(' ').toLowerCase()}`;
        }
        return s;
    }

    function formatComplaintItemText(item) {
        if (!item) return '';
        const title = (item.name || '').trim();
        const eye = formatComplaintEye(item.eye);
        const duration = formatComplaintDuration(item.duration);

        const parts = [];
        if (title) parts.push(title);
        if (eye) parts.push(eye);
        if (duration) parts.push(duration);

        return parts.join(' \u2013 ');
    }

    // ── Add Current Complaint ────────────────────────────────────────────────
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
            durationStr = `${num} ${unit.toLowerCase()}`;
        }

        const eyeCode = window._complaintSelectedEye || 'BE';
        const eyeLabel = eyeCode === 'RE' ? 'Right Eye (OD)' : eyeCode === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)';

        window._currentComplaints.push({
            name: name,
            eye: eyeCode,
            eye_label: eyeLabel,
            duration: durationStr
        });

        renderComplaintsSummary();
        updateEMRComplaintsDisplay();

        if (window._rxPatient && window._rxPatient.mrn) {
            saveComplaintsDraft(window._rxPatient.mrn, window._currentComplaints, window._complaintVisitMeta);
        }

        // Reset inputs
        if (searchInput) searchInput.value = '';
        if (durNum) durNum.value = '';
        syncTopPillActiveState('');
        onComplaintInputChange();
        closeComplaintDropdown();

        if (searchInput) searchInput.focus();
    }

    // ── Remove & Edit Complaints ─────────────────────────────────────────────
    function removeComplaintItem(index) {
        if (index >= 0 && index < window._currentComplaints.length) {
            window._currentComplaints.splice(index, 1);
            renderComplaintsSummary();
            updateEMRComplaintsDisplay();
            if (window._rxPatient && window._rxPatient.mrn) {
                saveComplaintsDraft(window._rxPatient.mrn, window._currentComplaints, window._complaintVisitMeta);
            }
        }
    }

    function clearAllComplaints() {
        if (window._currentComplaints.length === 0) return;
        window._currentComplaints = [];
        renderComplaintsSummary();
        updateEMRComplaintsDisplay();
        if (window._rxPatient && window._rxPatient.mrn) {
            saveComplaintsDraft(window._rxPatient.mrn, window._currentComplaints, window._complaintVisitMeta);
        }
    }

    function editComplaintItem(index) {
        if (index < 0 || index >= window._currentComplaints.length) return;
        const item = window._currentComplaints[index];

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
                    const matchedOpt = Array.from(durUnit.options).find(o => o.value.toLowerCase() === parts[1].toLowerCase());
                    durUnit.value = matchedOpt ? matchedOpt.value : parts[1];
                } else if (parts.length === 1 && !isNaN(parts[0])) {
                    durNum.value = parts[0];
                }
            }
        }

        window._currentComplaints.splice(index, 1);
        renderComplaintsSummary();
        updateEMRComplaintsDisplay();
        onComplaintInputChange();
        closeComplaintDropdown();
        if (durNum) durNum.focus();
    }

    // ── Render Summary Side Panel ───────────────────────────────────────────
    function renderComplaintsSummary() {
        const body = document.getElementById('complaintsSummaryBody');
        const countBadge = document.getElementById('complaintsCountBadge');
        const clearBtn = document.getElementById('btnComplaintsClearAll');
        const footerCount = document.getElementById('complaintsFooterCount');
        const livePreview = document.getElementById('complaintsLivePreview');

        const count = window._currentComplaints.length;

        if (countBadge) countBadge.textContent = String(count);
        if (clearBtn) clearBtn.style.display = count > 0 ? 'inline-block' : 'none';
        if (footerCount) {
            footerCount.textContent = count === 1 ? '1 complaint recorded' : `${count} complaints recorded`;
        }

        // Live preview generation
        const formattedPreview = buildFormattedSummaryString();
        if (livePreview) {
            livePreview.textContent = formattedPreview || 'No complaints recorded.';
        }

        if (!body) return;

        if (count === 0) {
            body.innerHTML = `
                <div class="complaints-empty-state">
                    <div class="empty-state-icon"><i class="fa-regular fa-clipboard"></i></div>
                    <p class="empty-state-title">No complaints added</p>
                    <p class="empty-state-desc">Select a top complaint or search on the left to record symptoms.</p>
                </div>
            `;
            return;
        }

        let html = '';
        window._currentComplaints.forEach((item, idx) => {
            const complaintDisplay = formatComplaintItemText(item);
            html += `
                <div class="complaint-summary-card">
                    <div class="summary-card-left">
                        <span class="summary-card-title" onclick="editComplaintItem(${idx})" title="Click to edit ${safeHtml(item.name)}">
                            ${safeHtml(complaintDisplay)}
                        </span>
                    </div>
                    <div class="summary-card-actions">
                        <button type="button" class="btn-card-action edit" onclick="editComplaintItem(${idx})" title="Edit complaint">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button type="button" class="btn-card-action delete" onclick="removeComplaintItem(${idx})" title="Remove complaint">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        body.innerHTML = html;
    }

    function buildFormattedSummaryString() {
        const textLines = [];
        window._currentComplaints.forEach(c => {
            const formatted = formatComplaintItemText(c);
            if (formatted) textLines.push(formatted);
        });

        const metaParts = [];
        if (window._complaintVisitMeta.purpose) metaParts.push(`Purpose: ${window._complaintVisitMeta.purpose}`);
        if (window._complaintVisitMeta.informant && window._complaintVisitMeta.informant !== 'Patient') {
            let inf = `Informant: ${window._complaintVisitMeta.informant}`;
            if (window._complaintVisitMeta.specify_informant) inf += ` - ${window._complaintVisitMeta.specify_informant}`;
            metaParts.push(inf);
        }
        if (window._complaintVisitMeta.remarks) metaParts.push(`Remarks: ${window._complaintVisitMeta.remarks}`);

        let fullSummaryText = textLines.join('; ');
        if (metaParts.length > 0) {
            fullSummaryText += (fullSummaryText ? ' | ' : '') + metaParts.join(' | ');
        }
        return fullSummaryText;
    }

    // ── Metadata Change Handlers ─────────────────────────────────────────────
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
        renderComplaintsSummary();
    }

    // ── Save Complaints Modal & Persist ──────────────────────────────────────
    async function saveComplaintsModal() {
        const searchInput = document.getElementById('complaintSearchInput');
        if (searchInput && searchInput.value.trim()) {
            addCurrentComplaint();
        }

        window._complaintVisitMeta.purpose = document.getElementById('complaintPurposeOfVisit')?.value || '';
        window._complaintVisitMeta.remarks = document.getElementById('complaintRemarks')?.value || '';
        window._complaintVisitMeta.informant = document.getElementById('complaintInformant')?.value || 'Patient';
        window._complaintVisitMeta.specify_informant = document.getElementById('complaintSpecifyInformant')?.value || '';

        updateEMRComplaintsDisplay();
        closeComplaintsModal();

        const complaintsSummary = document.getElementById('rx_complaints')?.value || '';

        if (window._rxPatient && window._rxPatient.mrn) {
            saveComplaintsDraft(window._rxPatient.mrn, window._currentComplaints, window._complaintVisitMeta);
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
            payload.append('complaints_json', JSON.stringify(window._currentComplaints));
            payload.append('complaint_meta_json', JSON.stringify(window._complaintVisitMeta));
            payload.append('complaints_summary', complaintsSummary);
            if (window._rxPrescriptionId) {
                payload.append('prescription_id', window._rxPrescriptionId);
            }
            if (window._rxPatient) {
                payload.append('patient_mrn', window._rxPatient.mrn || '');
                payload.append('patient_name', window._rxPatient.name || '');
                payload.append('patient_age', window._rxPatient.age || 0);
                payload.append('patient_gender', window._rxPatient.gender || 'Male');
                payload.append('eye', window._rxPatient.eye || 'BE');
            }

            const csrfToken = typeof window.getPatientLoadCsrf === 'function' ? window.getPatientLoadCsrf() : getCookie('csrftoken');

            const resp = await fetch(window.location.pathname, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: payload
            });

            const data = await resp.json();
            if (data.success) {
                if (data.prescription_id && !window._rxPrescriptionId) {
                    window._rxPrescriptionId = data.prescription_id;
                }
                const msg = data.message || `Complaints saved (${window._currentComplaints.length} item${window._currentComplaints.length === 1 ? '' : 's'}).`;
                if (typeof window.showRxFeedback === 'function') {
                    window.showRxFeedback(msg, 'success');
                }
            } else {
                if (typeof window.showRxFeedback === 'function') {
                    window.showRxFeedback(data.error || 'Complaints recorded locally.', 'info');
                }
            }
        } catch (err) {
            if (typeof window.showRxFeedback === 'function') {
                window.showRxFeedback(`Complaints recorded locally (${window._currentComplaints.length} item${window._currentComplaints.length === 1 ? '' : 's'}).`, 'info');
            }
        } finally {
            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = origHtml;
            }
        }
    }

    // ── Helper to read CSRF Cookie if needed ─────────────────────────────────
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue || '';
    }

    // ── EMR Profile Left Section Display Sync ────────────────────────────────
    function updateEMRComplaintsDisplay() {
        const displayEl = document.getElementById('emr_complaints_display');
        const rxComplaints = document.getElementById('rx_complaints');

        if (!displayEl) return;

        if (window._currentComplaints.length === 0 && !window._complaintVisitMeta.purpose && !window._complaintVisitMeta.remarks) {
            displayEl.innerHTML = `
                <div class="emr-empty-complaints-hint">
                    <i class="fa-regular fa-comment-dots"></i>
                    <span>Click to record complaints...</span>
                </div>
            `;
            if (rxComplaints) rxComplaints.value = '';
            return;
        }

        const fullSummaryText = buildFormattedSummaryString();
        if (rxComplaints) {
            rxComplaints.value = fullSummaryText;
        }

        let html = '<div class="emr-complaints-pill-list">';
        window._currentComplaints.forEach((c, idx) => {
            html += `
                <div class="emr-complaint-badge-row">
                    <div class="emr-complaint-badge-left" onclick="event.stopPropagation(); editComplaintItem(${idx})" title="Click to edit ${safeHtml(c.name)}">
                        <span class="emr-complaint-name-tag">${safeHtml(c.name)}</span>
                        <span class="emr-complaint-eye-tag">${safeHtml(c.eye)}</span>
                        ${c.duration ? `<span class="emr-complaint-dur-tag">${safeHtml(c.duration)}</span>` : ''}
                    </div>
                    <span class="emr-complaints-edit-btn" onclick="event.stopPropagation(); editComplaintItem(${idx})" title="Edit ${safeHtml(c.name)}"><i class="fa-solid fa-pen-to-square"></i></span>
                </div>
            `;
        });

        const metaParts = [];
        if (window._complaintVisitMeta.purpose) metaParts.push(`Purpose: ${window._complaintVisitMeta.purpose}`);
        if (window._complaintVisitMeta.informant && window._complaintVisitMeta.informant !== 'Patient') {
            let inf = `Informant: ${window._complaintVisitMeta.informant}`;
            if (window._complaintVisitMeta.specify_informant) inf += ` - ${window._complaintVisitMeta.specify_informant}`;
            metaParts.push(inf);
        }
        if (window._complaintVisitMeta.remarks) metaParts.push(`Remarks: ${window._complaintVisitMeta.remarks}`);

        if (metaParts.length > 0) {
            html += `<div class="emr-complaint-meta-note">${safeHtml(metaParts.join(' • '))}</div>`;
        }
        html += '</div>';

        displayEl.innerHTML = html;
    }

    // ── Reset State Helper ───────────────────────────────────────────────────
    function resetComplaintsState() {
        window._currentComplaints = [];
        window._complaintSelectedEye = 'BE';
        window._complaintVisitMeta = {
            purpose: '',
            remarks: '',
            informant: 'Patient',
            specify_informant: ''
        };
        updateEMRComplaintsDisplay();
        renderComplaintsSummary();
    }

    function orderComplaintsReworkup() {
        if (typeof window.showRxFeedback === 'function') {
            window.showRxFeedback('Clinical re-workup requested. Flagged for optometry review.', 'success');
        } else {
            alert('Clinical re-workup requested.');
        }
    }

    // ── SessionStorage Draft Storage ─────────────────────────────────────────
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
                window._currentComplaints = Array.isArray(parsed.complaints) ? parsed.complaints.slice() : [];
                window._complaintVisitMeta = Object.assign({
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

    // ── Fallback Parser for Plain Notes ──────────────────────────────────────
    function parseComplaintsFromNotesText(notesText) {
        window._currentComplaints = [];
        window._complaintVisitMeta = { purpose: '', remarks: '', informant: 'Patient', specify_informant: '' };
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
                        window._complaintVisitMeta.purpose = seg.substring('Purpose:'.length).trim();
                    } else if (seg.startsWith('Informant:')) {
                        const inf = seg.substring('Informant:'.length).trim();
                        if (inf.includes(' - ')) {
                            const parts = inf.split(' - ');
                            window._complaintVisitMeta.informant = parts[0].trim();
                            window._complaintVisitMeta.specify_informant = parts.slice(1).join(' - ').trim();
                        } else {
                            window._complaintVisitMeta.informant = inf;
                        }
                    } else if (seg.startsWith('Remarks:')) {
                        window._complaintVisitMeta.remarks = seg.substring('Remarks:'.length).trim();
                    }
                }

                const itemTokens = itemsStr.split(';').map(t => t.trim()).filter(Boolean);
                itemTokens.forEach(token => {
                    // Support "Title – Eye – Duration" format (en-dash or hyphen)
                    const dashMatch = token.match(/^(.+?)\s+[–—-]\s+(Right Eye|Left Eye|Both Eyes|RE|LE|BE)(?:\s+[–—-]\s+(.+))?$/i);
                    if (dashMatch) {
                        const name = dashMatch[1].trim();
                        const eyeRaw = dashMatch[2].trim();
                        const dur = dashMatch[3] ? dashMatch[3].trim() : '';
                        const eyeCode = (eyeRaw === 'RE' || /^right/i.test(eyeRaw)) ? 'RE'
                            : (eyeRaw === 'LE' || /^left/i.test(eyeRaw)) ? 'LE' : 'BE';
                        const eyeLabel = eyeCode === 'RE' ? 'Right Eye (OD)' : eyeCode === 'LE' ? 'Left Eye (OS)' : 'Both Eyes (OU)';
                        window._currentComplaints.push({
                            name: name,
                            eye: eyeCode,
                            eye_label: eyeLabel,
                            duration: dur
                        });
                        return;
                    }

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
                        window._currentComplaints.push({
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

    // ── Global Document Click & Key Listeners ────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        // Backdrop click to close modal
        document.getElementById('complaintsModal')?.addEventListener('click', function (e) {
            if (e.target === this) {
                closeComplaintsModal();
            }
        });

        // Click outside search input or dropdown closes the dropdown
        document.addEventListener('click', function (e) {
            const dropdown = document.getElementById('complaintSearchDropdown');
            const searchWrap = document.querySelector('.complaint-search-box-wrap');
            if (dropdown && dropdown.style.display !== 'none') {
                if (searchWrap && !searchWrap.contains(e.target)) {
                    closeComplaintDropdown();
                }
            }
        });

        // Escape closes modal if open
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                const modal = document.getElementById('complaintsModal');
                if (modal && modal.style.display !== 'none') {
                    const dropdown = document.getElementById('complaintSearchDropdown');
                    if (dropdown && dropdown.style.display !== 'none') {
                        closeComplaintDropdown();
                    } else {
                        closeComplaintsModal();
                    }
                }
            }
        });
    });

    // ── Window Exports ───────────────────────────────────────────────────────
    window.openComplaintsModal = openComplaintsModal;
    window.closeComplaintsModal = closeComplaintsModal;
    window.selectTopComplaint = selectTopComplaint;
    window.setComplaintEye = setComplaintEye;
    window.onComplaintInputChange = onComplaintInputChange;
    window.clearComplaintSearch = clearComplaintSearch;
    window.openComplaintDropdown = openComplaintDropdown;
    window.closeComplaintDropdown = closeComplaintDropdown;
    window.highlightDropdownItem = highlightDropdownItem;
    window.selectDropdownOption = selectDropdownOption;
    window.handleComplaintInputKey = handleComplaintInputKey;
    window.addCurrentComplaint = addCurrentComplaint;
    window.removeComplaintItem = removeComplaintItem;
    window.editComplaintItem = editComplaintItem;
    window.clearAllComplaints = clearAllComplaints;
    window.renderComplaintsSummary = renderComplaintsSummary;
    window.onInformantChange = onInformantChange;
    window.saveComplaintsModal = saveComplaintsModal;
    window.updateEMRComplaintsDisplay = updateEMRComplaintsDisplay;
    window.resetComplaintsState = resetComplaintsState;
    window.orderComplaintsReworkup = orderComplaintsReworkup;
    window.saveComplaintsDraft = saveComplaintsDraft;
    window.restoreComplaintsDraft = restoreComplaintsDraft;
    window.parseComplaintsFromNotesText = parseComplaintsFromNotesText;
    window.formatComplaintEye = formatComplaintEye;
    window.formatComplaintDuration = formatComplaintDuration;
    window.formatComplaintItemText = formatComplaintItemText;

})();
