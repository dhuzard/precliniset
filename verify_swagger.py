
import sys
import os
import json

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app import create_app
    os.environ['FLASK_CONFIG'] = 'testing'
    app = create_app()
    
    with app.app_context():
        from app.api import api
        # Trigger swagger generation
        schema = api.__schema__
        print("Swagger schema generated successfully.")
        # print(json.dumps(schema, indent=2))
        
except Exception as e:
    print(f"Error generating Swagger schema: {e}")
    sys.exit(1)
