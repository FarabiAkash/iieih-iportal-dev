from django.http import HttpResponse

def home(request):
    return HttpResponse("""
    <html>
        <head><title>IIEH iPortal Dev</title></head>
        <body style="font-family: sans-serif; padding: 2rem;">
            <h1>IIEH iPortal - Eye Hospital Management Reporting System</h1>
            <h3>Intern Workspaces & Skeletal Endpoints</h3>
            <ul>
                <li><strong>Naimul:</strong> <a href="/naimul/login/">/naimul/login/</a> &bull; <a href="/surgeries/">/surgeries/</a></li>
                <li><strong>Nusrat:</strong> <a href="/nusrat/login/">/nusrat/login/</a> &bull; <a href="/opd-ipd/">/opd-ipd/</a></li>
                <li><strong>Ruhul:</strong> <a href="/ruhul/login/">/ruhul/login/</a> &bull; <a href="/finance/">/finance/</a></li>
                <li><strong>App 4 (Executive Dashboard):</strong> <a href="/dashboard/">/dashboard/</a></li>
                <li><strong>Admin:</strong> <a href="/admin/">/admin/</a></li>
            </ul>
        </body>
    </html>
    """)
