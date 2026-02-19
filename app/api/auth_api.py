# app/api/auth_api.py
from flask import g
from flask_restx import Resource, fields
from . import api
from .auth import token_required

ns = api.namespace('auth', description='Authentication related operations')

user_info_model = ns.model('UserInfo', {
    'id': fields.Integer(readonly=True, description='The user unique identifier'),
    'email': fields.String(description='The user email address'),
    'is_super_admin': fields.Boolean(description='Whether the user is a super administrator'),
    'username': fields.String(description='The user name')
})

@ns.route('/me')
class Me(Resource):
    decorators = [token_required]

    @ns.doc('get_current_user_info', security='BearerAuth')
    @ns.marshal_with(user_info_model)
    def get(self):
        """
        Get information about the current authenticated user.
        This endpoint can be used to verify API token connectivity.
        """
        user = g.current_user
        return {
            'id': user.id,
            'email': user.email,
            'is_super_admin': user.is_super_admin,
            'username': user.username
        }
