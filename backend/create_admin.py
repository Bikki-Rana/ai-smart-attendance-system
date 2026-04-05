from database import SessionLocal
from models import User
from auth_utils import hash_password

def create_admin(name, email, password):
    db = SessionLocal()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"User {email} already exists. Updating role to admin and changing password.")
        existing_user.role = "admin"
        existing_user.password_hash = hash_password(password)
        db.commit()
        print("Updated successfully.")
        return

    admin_user = User(
        name=name,
        email=email,
        password_hash=hash_password(password),
        role="admin"
    )
    db.add(admin_user)
    db.commit()
    print(f"Admin user '{email}' created successfully.")

if __name__ == "__main__":
    create_admin("Super Admin", "admin@smartattend.com", "Admin@12345!")
    print("Login with: admin@smartattend.com AND Admin@12345!")
