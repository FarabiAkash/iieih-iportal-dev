import hashlib

from django.contrib.auth import authenticate, login, logout
from django.core.cache import cache
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_POST

DEFAULT_REDIRECT = '/pharmacy/'
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60


def _next_url(request):
    """Raw ?next= / hidden-field value (not yet validated)."""
    return request.POST.get('next') or request.GET.get('next') or ''


def _safe_next_url(request):
    """Return the next target only if it stays on this site, else the default."""
    target = _next_url(request)
    if (
        target
        and target != request.path
        and url_has_allowed_host_and_scheme(
            target,
            allowed_hosts={request.get_host()},
            require_https=request.is_secure(),
        )
    ):
        return target
    return DEFAULT_REDIRECT


def _throttle_key(request, username):
    """Cache key per IP + username (hashed so odd characters are safe)."""
    ip = request.META.get('REMOTE_ADDR', 'unknown')
    digest = hashlib.sha256(f'{ip}|{username.lower()}'.encode()).hexdigest()
    return f'adnan_login_fail:{digest}'


@never_cache
def login_view(request):
    # Already signed in: skip the form
    if request.user.is_authenticated:
        return redirect(_safe_next_url(request))

    error = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')

        key = _throttle_key(request, username)
        failures = cache.get(key, 0)

        if failures >= MAX_FAILED_ATTEMPTS:
            error = 'Too many failed attempts. Please try again in 15 minutes.'
        else:
            user = authenticate(request, username=username, password=password)
            if user is not None:
                cache.delete(key)
                login(request, user)
                return redirect(_safe_next_url(request))
            cache.set(key, failures + 1, LOCKOUT_SECONDS)
            error = 'Invalid username or password.'

    return render(request, 'users_adnan/login.html', {
        'error': error,
        'next': _next_url(request),
    })


@require_POST
def logout_view(request):
    logout(request)
    return redirect('users_adnan:login')