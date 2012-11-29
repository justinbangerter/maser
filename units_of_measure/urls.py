__author__ = 'Justin Bangerter'
from django.conf.urls import patterns, url

urlpatterns = patterns('units_of_measure.views',
    url(r'^$', 'index'),
)