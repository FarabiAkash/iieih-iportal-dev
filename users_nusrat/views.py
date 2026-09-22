from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required


def login_view(request):

    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(
            request,
            username=username,
            password=password
        )

        if user is not None:
            login(request, user)

            return redirect('/opd-ipd/')

        else:
            return render(
                request,
                'users_nusrat/login.html',
                {
                    "error": "Invalid username or password"
                }
            )

    return render(
        request,
        'users_nusrat/login.html'
    )



def logout_view(request):

    logout(request)

    return redirect('/nusrat/login/')



@login_required
def profile_view(request):

    profile = request.user.nusratprofile

    context = {
        "profile": profile
    }

    return render(
        request,
        'users_nusrat/profile.html',
        context
    )