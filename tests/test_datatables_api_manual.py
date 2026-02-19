
import unittest
import sys
from unittest.mock import MagicMock
sys.modules['magic'] = MagicMock()

from app import create_app, db
from app.config import TestingConfig
from flask_wtf.csrf import generate_csrf
from app.models.auth import User
from app.models import ExperimentalGroup as Group, Project, ProtocolModel as Protocol, DataTable, AnimalModel
import json
from datetime import date

class TestDataTablesAPI(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestingConfig)
        self.client = self.app.test_client()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()
        
        # Create Dummy Data
        self.user = User(email='test@example.com', email_confirmed=True, is_super_admin=True)
        self.user.set_password('password')
        db.session.add(self.user)
        
        from app.models.teams import Team, TeamMembership
        self.team = Team(name='Test Team')
        db.session.add(self.team)
        db.session.commit()
        
        # Add user to team
        member = TeamMembership(user_id=self.user.id, team_id=self.team.id)
        db.session.add(member)
        db.session.commit()

        self.project = Project(name='Test Project', slug='test-project', team_id=self.team.id, owner_id=self.user.id)
        db.session.add(self.project)
        db.session.commit()
        
        self.animal_model = AnimalModel(name='Test Model')
        db.session.add(self.animal_model)
        db.session.commit()
        
        self.protocol = Protocol(name='Test Protocol')
        db.session.add(self.protocol)
        
        self.group = Group(
            name='Test Group', 
            project_id=self.project.id,
            team_id=self.team.id,
            owner_id=self.user.id,
            model_id=self.animal_model.id
        )
        db.session.add(self.group)
        db.session.commit()
        
        self.dt1 = DataTable(
            date=date(2023, 1, 1),
            group_id=self.group.id,
            protocol_id=self.protocol.id,
            creator_id=self.user.id,
            # user=self.user, # DataTable has creator_id/assigned_to_id, not user
            # filename='test1.csv' # DataTable has NO filename
        )
        # Note: DataTable does not have a filename column directly, usually files are separate.
        # But wait, checking attributes...
        # DataTable columns: id, group_id, protocol_id, date, creator_id, assigned_to_id... 
        # It does NOT have filename.
        
        db.session.add(self.dt1)
        
        self.dt2 = DataTable(
            date=date(2023, 2, 1),
            group_id=self.group.id,
            protocol_id=self.protocol.id,
            creator_id=self.user.id
        )
        db.session.add(self.dt2)
        db.session.commit()
        
        # Manual Login via Session
        self.csrf_token = 'my-test-csrf-token'
        with self.client.session_transaction() as sess:
            sess['_user_id'] = str(self.user.id)
            sess['csrf_token'] = self.csrf_token
            sess['_fresh'] = True
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_fetch_datatables_basic(self):
        """Test basic fetching of datatables for a group."""
        response = self.client.get(f'/api/v1/server_side_datatables/server_side?draw=1&start=0&length=10&group_id={self.group.id}', headers={'X-CSRFToken': self.csrf_token})
        
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        
        self.assertIn('data', data)
        self.assertEqual(len(data['data']), 2)
        self.assertEqual(data['recordsTotal'], 2)
        self.assertEqual(data['recordsFiltered'], 2)
        
        # Verify structure expected by React frontend
        first_row = data['data'][0]
        self.assertIn('id', first_row)
        self.assertIn('date', first_row)
        self.assertIn('protocol_name', first_row)
        self.assertIn('group_name', first_row)
        self.assertIn('project_name', first_row)
        self.assertIn('can_view', first_row)
        self.assertIn('can_edit', first_row)
        self.assertIn('can_delete', first_row)
        self.assertIn('action_urls', first_row)
        self.assertIsInstance(first_row['action_urls'], dict)
        self.assertIn('view', first_row['action_urls'])
        self.assertIn('edit', first_row['action_urls'])
        self.assertIn('analyze', first_row['action_urls'])
        self.assertIn('download', first_row['action_urls'])
        self.assertIn('delete', first_row['action_urls'])

    def test_filter_by_protocol(self):
        """Test filtering by protocol."""
        # Create another protocol and datatable
        p2 = Protocol(name='Other Protocol')
        db.session.add(p2)
        db.session.commit()
        
        dt3 = DataTable(
            date=date(2023, 3, 1),
            group_id=self.group.id,
            protocol_id=p2.id,
            creator_id=self.user.id
        )
        db.session.add(dt3)
        db.session.commit()
        
        response = self.client.get(
            f'/api/v1/server_side_datatables/server_side?draw=1&start=0&length=10&group_id={self.group.id}&protocol_id={self.protocol.id}',
            headers={'X-CSRFToken': self.csrf_token}
        )
        data = json.loads(response.data)
        
        self.assertEqual(len(data['data']), 2) # Only the 2 from setUp
        for row in data['data']:
            self.assertEqual(row['protocol_name'], 'Test Protocol')

    def test_filter_by_date(self):
        """Test filtering by date range."""
        # Filter for Feb 2023 only
        response = self.client.get(
            f'/api/v1/server_side_datatables/server_side?draw=1&start=0&length=10&group_id={self.group.id}&date_from=2023-01-15&date_to=2023-02-15',
            headers={'X-CSRFToken': self.csrf_token}
        )
        data = json.loads(response.data)
        
        self.assertEqual(len(data['data']), 1)
        self.assertEqual(data['data'][0]['date'], '2023-02-01')

if __name__ == '__main__':
    unittest.main()
