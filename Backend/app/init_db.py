from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models import Base, User, Hall, Resource
from app.core.security import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

def init_db():
    db = SessionLocal()
    
    try:
        # Check if admin user exists
        admin_user = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin_user:
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                password_hash=hash_password("adminpassword"),
                full_name="System Admin",
                is_admin=True  # Set admin flag
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print("Admin user created.")
        
        # Check if halls exist
        halls = db.query(Hall).all()
        if not halls:
            # Create default halls
            function_hall = Hall(name="Function Hall", capacity=200)
            pe_hall = Hall(name="PE Hall", capacity=500)
            
            db.add_all([function_hall, pe_hall])
            db.commit()
            print("Default halls created.")
        
        # Check if resources exist
        resources = db.query(Resource).all()
        if not resources:
            # Create default resources
            default_resources = [
                Resource(name="Projector"),
                Resource(name="Speaker System"),
                Resource(name="Microphone"),
                Resource(name="Tables"),
                Resource(name="Chairs"),
                Resource(name="Whiteboard")
            ]
            
            db.add_all(default_resources)
            db.commit()
            print("Default resources created.")
            
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization completed.")