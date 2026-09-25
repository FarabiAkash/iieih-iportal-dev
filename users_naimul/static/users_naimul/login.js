// ─── Password Visibility Toggle ───────────────────────────────────────────────
function initPasswordToggle() {
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('passwordEyeIcon');

    if (toggleBtn && passwordInput && eyeIcon) {
        toggleBtn.addEventListener('click', function () {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }
}

// ─── Quick Fill for convenience ──────────────────────────────────────────────
function quickFillDoctor() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    if (usernameInput) usernameInput.value = 'naimul';
    if (passwordInput) passwordInput.value = 'doctor123';

    // Highlight feedback
    const card = document.querySelector('.login-card');
    if (card) {
        card.style.borderColor = '#38bdf8';
        setTimeout(() => {
            card.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        }, 500);
    }
}

// ─── Day / Night Theme Switcher Controller ────────────────────────────────────
function setAppTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
        localStorage.setItem('iieih_theme', theme);
    } catch (e) {}
    document.querySelectorAll('.theme-switch-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-theme-val') === theme;
        btn.classList.toggle('active', isActive);
    });
}

// ─── Sync Button States & Listeners on Load ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setAppTheme(currentTheme);
    initPasswordToggle();
});
