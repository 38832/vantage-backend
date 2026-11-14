import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from supabase import create_client
from app.core.config import settings


def main():
    parser = argparse.ArgumentParser(description="Create or update an admin/recruiter account in Supabase Auth.")
    parser.add_argument("email", help="Staff email address (e.g. admin@ugetjob.com)")
    parser.add_argument("password", help="Account password (at least 6 characters)")
    parser.add_argument("--role", default="admin", choices=["admin", "recruiter"], help="Staff role (default: admin)")
    parser.add_argument("--name", default="Admin Staff", help="Full name of staff member")

    args = parser.parse_args()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured in backend/.env")
        sys.exit(1)

    client = create_client(settings.supabase_url, settings.supabase_service_role_key)

    # Check if user already exists
    existing_users = client.auth.admin.list_users()
    target_user = next((u for u in existing_users if u.email.lower() == args.email.lower()), None)

    if target_user:
        print(f"User {args.email} already exists (ID: {target_user.id}). Updating password and role...")
        client.auth.admin.update_user_by_id(
            target_user.id,
            {
                "password": args.password,
                "app_metadata": {"role": args.role},
                "user_metadata": {"full_name": args.name},
                "email_confirm": True,
            }
        )
        print(f"✓ Success: Updated {args.email} as {args.role.upper()}!")
    else:
        print(f"Creating new staff account for {args.email} with role: {args.role}...")
        res = client.auth.admin.create_user({
            "email": args.email,
            "password": args.password,
            "email_confirm": True,
            "app_metadata": {"role": args.role},
            "user_metadata": {"full_name": args.name},
        })
        user = getattr(res, "user", res)
        print(f"✓ Success: Created {args.email} (ID: {getattr(user, 'id', 'new')}) with role: {args.role.upper()}!")

    print("\nYou can now log in at:")
    print(f"  Email:    {args.email}")
    print(f"  Password: {'*' * len(args.password)}")
    print(f"  Role:     {args.role.upper()}")


if __name__ == "__main__":
    main()
