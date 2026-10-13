// ─── Theme Pre-Init (Anti-flicker) ───────────────────────────────────────────
(function () {
    try {
        const storedTheme = localStorage.getItem('iieih_theme') || 'dark';
        document.documentElement.setAttribute('data-theme', storedTheme);
    } catch (e) { }
})();

// ─── Interactive Behavior Script ─────────────────────────────────────────────
(function () {
    // ── 1. Day / Night Theme Switcher ───────────────────────
    const root = document.documentElement;
    const btnLight = document.getElementById('themeBtnLight');
    const btnDark = document.getElementById('themeBtnDark');

    function applyTheme(theme) {
        root.setAttribute('data-theme', theme);
        try {
            localStorage.setItem('iieih_theme', theme);
        } catch (e) { }

        if (btnLight && btnDark) {
            if (theme === 'light') {
                btnLight.classList.add('active');
                btnLight.setAttribute('aria-pressed', 'true');
                btnDark.classList.remove('active');
                btnDark.setAttribute('aria-pressed', 'false');
            } else {
                btnDark.classList.add('active');
                btnDark.setAttribute('aria-pressed', 'true');
                btnLight.classList.remove('active');
                btnLight.setAttribute('aria-pressed', 'false');
            }
        }
    }

    // Sync with current theme on load
    const currentTheme = root.getAttribute('data-theme') || 'dark';
    applyTheme(currentTheme);

    if (btnLight) btnLight.addEventListener('click', () => applyTheme('light'));
    if (btnDark) btnDark.addEventListener('click', () => applyTheme('dark'));

    // ── 2. Password Show / Hide Toggle ──────────────────────
    const passwordInput = document.getElementById('password');
    const togglePasswordBtn = document.getElementById('togglePasswordBtn');
    const passwordEyeIcon = document.getElementById('passwordEyeIcon');

    if (togglePasswordBtn && passwordInput && passwordEyeIcon) {
        togglePasswordBtn.addEventListener('click', function () {
            const isPassword = passwordInput.getAttribute('type') === 'password';
            passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

            if (isPassword) {
                passwordEyeIcon.classList.remove('fa-eye');
                passwordEyeIcon.classList.add('fa-eye-slash');
                togglePasswordBtn.setAttribute('aria-label', 'Hide password');
            } else {
                passwordEyeIcon.classList.remove('fa-eye-slash');
                passwordEyeIcon.classList.add('fa-eye');
                togglePasswordBtn.setAttribute('aria-label', 'Show password');
            }
        });
    }

    // ── 3. Caps Lock Detection ──────────────────────────────
    const capsWarning = document.getElementById('capsLockWarning');

    function checkCapsLock(event) {
        if (!capsWarning) return;
        if (event.getModifierState && event.getModifierState('CapsLock')) {
            capsWarning.classList.add('active');
        } else {
            capsWarning.classList.remove('active');
        }
    }

    if (passwordInput && capsWarning) {
        passwordInput.addEventListener('keyup', checkCapsLock);
        passwordInput.addEventListener('keydown', checkCapsLock);
        passwordInput.addEventListener('blur', function () {
            capsWarning.classList.remove('active');
        });
    }

    // ── 4. Form Submit Loading Feedback ─────────────────────
    const loginForm = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');

    if (loginForm && submitBtn && passwordInput) {
        loginForm.addEventListener('submit', function () {
            const usernameInput = document.getElementById('username');
            const usernameVal = usernameInput ? usernameInput.value.trim() : '';
            const passwordVal = passwordInput.value.trim();

            if (usernameVal && passwordVal) {
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.85';
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Verifying Credentials...</span>';
            }
        });
    }
})();

// ─── Quick Fill Helper (for dev / testing convenience) ───────────────────────
function quickFillDoctor() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = 'naimul';
    if (passwordInput) passwordInput.value = 'pass@123';
}
window.quickFillDoctor = quickFillDoctor;
