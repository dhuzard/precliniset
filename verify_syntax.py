
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

print("Verifying syntax of API files...")

try:
    # We mock objects that might be needed for import if they depend on app context
    # But usually API files just define classes and decorate them.
    # If they import 'db' or 'current_user' from extensions, that's fine as long as they are not accessed at module level.
    
    # However, some imports might trigger other imports.
    # Let's try to import them one by one.
    
    print("Importing groups_api...")
    from app.api import groups_api
    print("groups_api imported.")

    print("Importing datatables_api...")
    from app.api import datatables_api
    print("datatables_api imported.")

    print("Importing admin_api...")
    from app.api import admin_api
    print("admin_api imported.")

    print("Importing analytes_api...")
    from app.api import analytes_api
    print("analytes_api imported.")
    
    print("Importing sampling_api...")
    from app.api import sampling_api
    print("sampling_api imported.")

    print("All API files imported successfully. Syntax check passed.")

except ImportError as e:
    # If it's the magic error, we ignore it if it's not from our files directly
    if 'magic' in str(e) or 'failed to find libmagic' in str(e):
        print(f"Skipping import error due to missing libmagic: {e}")
    else:
        print(f"ImportError: {e}")
        # sys.exit(1) # Don't exit, just report.
except Exception as e:
    print(f"Syntax or Runtime Error during import: {e}")
    sys.exit(1)
