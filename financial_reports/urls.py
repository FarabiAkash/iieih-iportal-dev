from django.urls import path
from . import views


urlpatterns = [

    # FINANCE HOME
    path(
        '',
        views.daily_collection_list_view,
        name='finance_home'
    ),

    # DAILY COLLECTION
    path(
        'collections/',
        views.daily_collection_list_view,
        name='daily_collection_list'
    ),

    path(
        'collections/add/',
        views.daily_collection_create_view,
        name='daily_collection_create'
    ),

    path(
        'collections/<int:pk>/update/',
        views.daily_collection_update_view,
        name='daily_collection_update'
    ),

    path(
        'collections/<int:pk>/delete/',
        views.daily_collection_delete_view,
        name='daily_collection_delete'
    ),

    # CONCESSION RECORD
    path(
        'concessions/',
        views.concession_record_list_view,
        name='concession_record_list'
    ),

    path(
        'concessions/add/',
        views.concession_record_create_view,
        name='concession_record_create'
    ),

    path(
        'concessions/<int:pk>/update/',
        views.concession_record_update_view,
        name='concession_record_update'
    ),

    path(
        'concessions/<int:pk>/delete/',
        views.concession_record_delete_view,
        name='concession_record_delete'
    ),
]