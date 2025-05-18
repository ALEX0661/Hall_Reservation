from fastapi import FastAPI
from app.db.session import Base, engine
from app.routers import auth, reservations, notifications, admin
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hall Reservation System")
# Allow frontend on localhost:3000
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# create tables
Base.metadata.create_all(bind=engine)



# include routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(reservations.router, prefix="", tags=["Reservations"])
app.include_router(notifications.router, prefix="", tags=["Notifications"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
