// =============================================================================
// REMARKS MODAL — Hospital EMR Extension
// Ispahani Islamia Eye Institute & Hospital
// Features:
//   - Open / Close with Escape key support
//   - Quick-tag pills append to textarea
//   - Character counter with near-limit / at-limit highlighting
//   - Save remark card to side panel with category, priority, timestamp
//   - Delete individual remarks; Clear all
//   - Synchronizes with Prescription rx_notes field and remarks_advice_badge
//   - Persists to remarksData array; exposes getRemarksData() for EMR save
// =============================================================================

(function () {
    'use strict';

    // ── State ──────────────────────────────────────────────────────────────────
    let remarksData = [];   // { id, text, category, priority, visibility, timestamp }
    let remarkIdSeq  = 0;

    // ── Open / Close ───────────────────────────────────────────────────────────
    window.openRemarksModal = function () {
        const overlay = document.getElementById('remarksModal');
        if (!overlay) return;

        // If remarksData is empty, populate from prescription's rx_notes if present
        const rxNotes = document.getElementById('rx_notes');
        if (remarksData.length === 0 && rxNotes && rxNotes.value.trim()) {
            const lines = rxNotes.value.split('\n').map(s => s.trim()).filter(Boolean);
            lines.forEach(line => {
                const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    remarksData.push({
                        id: ++remarkIdSeq,
                        text: cleaned,
                        category: 'Clinical',
                        priority: 'Normal',
                        visibility: 'All Staff',
                        timestamp: _now()
                    });
                }
            });
        }

        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Reset input fields for a fresh entry
        _resetInputFields();
        _renderSavedRemarks();
        _updateFooterStatus();

        setTimeout(() => {
            const ta = document.getElementById('remarksTextarea');
            if (ta) ta.focus();
        }, 120);
    };

    window.closeRemarksModal = function () {
        const overlay = document.getElementById('remarksModal');
        if (!overlay) return;
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    };

    // Close on overlay click (outside card)
    document.addEventListener('DOMContentLoaded', function () {
        const overlay = document.getElementById('remarksModal');
        if (overlay) {
            overlay.addEventListener('click', function (e) {
                if (e.target === overlay) closeRemarksModal();
            });
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const overlay = document.getElementById('remarksModal');
            if (overlay && overlay.style.display !== 'none') {
                closeRemarksModal();
            }
        }
    });

    // ── Quick Tag Pills ────────────────────────────────────────────────────────
    window.appendRemarkTag = function (tag) {
        const ta = document.getElementById('remarksTextarea');
        if (!ta) return;

        const current = ta.value.trim();
        if (current.length === 0) {
            ta.value = tag;
        } else if (current.endsWith('.') || current.endsWith(',') || current.endsWith(';')) {
            ta.value = current + ' ' + tag;
        } else {
            ta.value = current + '. ' + tag;
        }

        // Visual feedback on pill
        const pills = document.querySelectorAll('.remarks-quick-pill');
        pills.forEach(p => {
            if (p.textContent.trim() === tag) {
                p.classList.add('active');
                setTimeout(() => p.classList.remove('active'), 500);
            }
        });

        onRemarksInput();
        ta.focus();
    };

    // ── Textarea Input Handler ─────────────────────────────────────────────────
    window.onRemarksInput = function () {
        const ta       = document.getElementById('remarksTextarea');
        const counter  = document.getElementById('remarksCharCount');
        const clearBtn = document.getElementById('btnRemarksClearText');

        if (!ta) return;
        const len = ta.value.length;
        const max = parseInt(ta.getAttribute('maxlength') || '1000', 10);

        if (counter) {
            counter.textContent = len;
            const wrap = counter.parentElement;
            if (wrap) {
                wrap.classList.remove('near-limit', 'at-limit');
                if (len >= max)             wrap.classList.add('at-limit');
                else if (len >= max * 0.85) wrap.classList.add('near-limit');
            }
        }

        if (clearBtn) {
            clearBtn.style.display = len > 0 ? 'inline-flex' : 'none';
        }
    };

    // ── Clear Textarea ─────────────────────────────────────────────────────────
    window.clearRemarksText = function () {
        const ta = document.getElementById('remarksTextarea');
        if (ta) { ta.value = ''; ta.focus(); }
        onRemarksInput();
    };

    // ── Add Single Remark to List (from current input) ─────────────────────────
    window.addRemarkRecord = function () {
        const ta     = document.getElementById('remarksTextarea');
        const catSel = document.getElementById('remarksCategorySelect');
        const priSel = document.getElementById('remarksPrioritySelect');
        const visSel = document.getElementById('remarksVisibilitySelect');

        const text = ta ? ta.value.trim() : '';
        if (!text) {
            _shakeTextarea();
            return false;
        }

        const remark = {
            id:         ++remarkIdSeq,
            text:       text,
            category:   catSel  ? (catSel.value  || 'Clinical') : 'Clinical',
            priority:   priSel  ? (priSel.value   || 'Normal')   : 'Normal',
            visibility: visSel  ? (visSel.value   || 'All Staff'): 'All Staff',
            timestamp:  _now()
        };

        remarksData.push(remark);
        _resetInputFields();
        _renderSavedRemarks();
        _updateFooterStatus();
        return true;
    };

    // ── Save Remarks Modal (Applies to Prescription & Closes) ─────────────────
    window.saveRemarksModal = function () {
        const ta = document.getElementById('remarksTextarea');
        const currentText = ta ? ta.value.trim() : '';

        // If there is pending text in textarea, add it to remarksData
        if (currentText) {
            const catSel = document.getElementById('remarksCategorySelect');
            const priSel = document.getElementById('remarksPrioritySelect');
            const visSel = document.getElementById('remarksVisibilitySelect');
            remarksData.push({
                id:         ++remarkIdSeq,
                text:       currentText,
                category:   catSel  ? (catSel.value  || 'Clinical') : 'Clinical',
                priority:   priSel  ? (priSel.value   || 'Normal')   : 'Normal',
                visibility: visSel  ? (visSel.value   || 'All Staff'): 'All Staff',
                timestamp:  _now()
            });
            _resetInputFields();
        }

        // Synchronize with prescription rx_notes
        const rxNotes = document.getElementById('rx_notes');
        if (rxNotes) {
            rxNotes.value = remarksData.map(r => r.text).join('\n');
        }

        // Expand or collapse advice preview content row
        const advContent = document.getElementById('adv_content_remarks');
        if (advContent) {
            advContent.style.display = remarksData.length > 0 ? 'block' : 'none';
        }

        // Update badge in prescription advice header
        updateRemarksBadge(remarksData.length);

        if (typeof window.showRxFeedback === 'function' && remarksData.length > 0) {
            window.showRxFeedback('Remarks updated in prescription.', 'success');
        }

        closeRemarksModal();
    };

    // ── Delete Single Remark ───────────────────────────────────────────────────
    window.deleteRemark = function (id) {
        remarksData = remarksData.filter(r => r.id !== id);
        _renderSavedRemarks();
        _updateFooterStatus();
    };

    // ── Clear All Remarks ──────────────────────────────────────────────────────
    window.clearAllRemarks = function () {
        if (remarksData.length === 0) return;
        if (!confirm('Remove all saved remarks?')) return;
        remarksData = [];
        remarkIdSeq = 0;
        _renderSavedRemarks();
        _updateFooterStatus();
    };

    // ── Update Prescription Badge ──────────────────────────────────────────────
    function updateRemarksBadge(count) {
        const badge = document.getElementById('remarks_advice_badge');
        if (!badge) return;
        if (count > 0) {
            badge.style.display = 'inline-flex';
            badge.textContent = `${count} item${count !== 1 ? 's' : ''}`;
        } else {
            badge.style.display = 'none';
        }
    }
    window.updateRemarksBadge = updateRemarksBadge;

    // ── Public API: get saved remarks for EMR save ─────────────────────────────
    window.getRemarksData = function () {
        return [...remarksData];
    };

    window.setRemarksData = function (data) {
        remarksData = Array.isArray(data) ? data : [];
        remarkIdSeq = remarksData.reduce((m, r) => Math.max(m, r.id || 0), 0);
        _renderSavedRemarks();
        _updateFooterStatus();
        updateRemarksBadge(remarksData.length);
    };

    window.setRemarksFromText = function (text) {
        remarksData = [];
        remarkIdSeq = 0;
        if (text && text.trim()) {
            const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
            lines.forEach(line => {
                const cleaned = line.replace(/^[•\-\*]\s*/, '').trim();
                if (cleaned) {
                    remarksData.push({
                        id: ++remarkIdSeq,
                        text: cleaned,
                        category: 'Clinical',
                        priority: 'Normal',
                        visibility: 'All Staff',
                        timestamp: _now()
                    });
                }
            });
        }
        _renderSavedRemarks();
        _updateFooterStatus();
        updateRemarksBadge(remarksData.length);
    };

    window.resetRemarksState = function () {
        remarksData = [];
        remarkIdSeq = 0;
        _resetInputFields();
        _renderSavedRemarks();
        _updateFooterStatus();
        updateRemarksBadge(0);
        const advContent = document.getElementById('adv_content_remarks');
        if (advContent) advContent.style.display = 'none';
    };

    // ── Render Saved Remarks ───────────────────────────────────────────────────
    function _renderSavedRemarks() {
        const body      = document.getElementById('remarksSavedBody');
        const badge     = document.getElementById('remarksCountBadge');
        const clearAll  = document.getElementById('btnRemarksClearAll');
        const emptyState = document.getElementById('remarksEmptyState');

        if (!body) return;

        const count = remarksData.length;
        if (badge)    badge.textContent = count;
        if (clearAll) clearAll.style.display = count > 0 ? 'inline-flex' : 'none';

        // Clear existing cards (keep empty state element)
        const existing = body.querySelectorAll('.remark-saved-card');
        existing.forEach(el => el.remove());

        if (count === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Render newest first
        [...remarksData].reverse().forEach(r => {
            const card = _buildCard(r);
            body.appendChild(card);
        });
    }

    function _buildCard(r) {
        const priority = r.priority || 'Normal';
        const priorityClass = 'priority-' + priority.toLowerCase().replace(/\s+/g, '-');

        const card = document.createElement('div');
        card.className = `remark-saved-card ${priorityClass}`;
        card.dataset.id = r.id;

        card.innerHTML = `
            <div class="remark-card-top">
                <span class="remark-card-text">${_escapeHtml(r.text)}</span>
                <div class="remark-card-actions">
                    <button type="button" class="btn-remark-card-action delete"
                        onclick="deleteRemark(${r.id})" title="Remove">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            <div class="remark-card-meta">
                ${r.category ? `<span class="remark-card-badge category">${_escapeHtml(r.category)}</span>` : ''}
                ${r.priority ? `<span class="remark-card-badge ${priorityClass}">${_escapeHtml(r.priority)}</span>` : ''}
                <span class="remark-card-time">${_escapeHtml(r.timestamp)}</span>
            </div>`;

        return card;
    }

    // ── Footer Status ──────────────────────────────────────────────────────────
    function _updateFooterStatus() {
        const el = document.getElementById('remarksFooterStatus');
        if (!el) return;
        const n = remarksData.length;
        el.textContent = n === 0 ? '' : `${n} remark${n === 1 ? '' : 's'} recorded`;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────
    function _resetInputFields() {
        const ta    = document.getElementById('remarksTextarea');
        const cat   = document.getElementById('remarksCategorySelect');
        const pri   = document.getElementById('remarksPrioritySelect');
        const vis   = document.getElementById('remarksVisibilitySelect');
        const clear = document.getElementById('btnRemarksClearText');

        if (ta)    ta.value = '';
        if (cat)   cat.value = '';
        if (pri)   pri.value = 'Normal';
        if (vis)   vis.value = 'All Staff';
        if (clear) clear.style.display = 'none';

        const counter = document.getElementById('remarksCharCount');
        if (counter) {
            counter.textContent = '0';
            const wrap = counter.parentElement;
            if (wrap) wrap.classList.remove('near-limit', 'at-limit');
        }
    }

    function _shakeTextarea() {
        const ta = document.getElementById('remarksTextarea');
        if (!ta) return;
        ta.style.borderColor = '#ef4444';
        ta.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.15)';
        ta.focus();
        setTimeout(() => {
            ta.style.borderColor = '';
            ta.style.boxShadow   = '';
        }, 900);
    }

    function _now() {
        const d = new Date();
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const mo = d.toLocaleString('default', { month: 'short' });
        return `${dd} ${mo}, ${h}:${m}`;
    }

    function _escapeHtml(str) {
        if (typeof str !== 'string') return '';
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/'/g,  '&#39;');
    }

})();
