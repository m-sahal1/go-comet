# Initialize New Relic agent first, before importing Django
import newrelic.agent
import newrelic.api.exceptions
import os

# Initialize with error handling to prevent conflicts with manage.py
try:
    # Use environment from NEWRELIC_ENVIRONMENT or default to production
    environment = os.environ.get('NEWRELIC_ENVIRONMENT', 'production')
    newrelic.agent.initialize('newrelic.ini', environment)
except newrelic.api.exceptions.ConfigurationError:
    # Already initialized, likely from manage.py - this is fine
    pass

"""
WSGI config for gaming_leaderboard project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gaming_leaderboard.settings')

# Wrap the WSGI application with New Relic
application = newrelic.agent.WSGIApplicationWrapper(get_wsgi_application())
