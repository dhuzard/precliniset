# app/forms/ckan.py
"""CKAN-related forms."""
from flask_babel import lazy_gettext as _l
from flask_wtf import FlaskForm
from wtforms import BooleanField, StringField, SubmitField
from wtforms.validators import Length, Optional


class CkanSettingsForm(FlaskForm):
    ckan_url = StringField(_l('CKAN Portal URL'), validators=[Optional(), Length(max=255)],
                           description=_l("The base URL of your CKAN instance (e.g., https://data.example.com)."))
    ckan_api_key = StringField(_l('CKAN API Key'), validators=[Optional(), Length(max=255)],
                               description=_l("Your personal API key from your CKAN user profile."))
    ckan_verify_ssl = BooleanField(_l('Verify SSL Certificate'), default=True,
                                   description=_l("Uncheck this if you are using an IP address or self-signed certificate for CKAN."))
    submit_ckan_settings = SubmitField(_l('Save CKAN Settings'))
