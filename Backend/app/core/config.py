from pydantic import BaseSettings

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "mysql+pymysql://Hall:Reservation@localhost/hall_reservation"
    
    # JWT settings
    SECRET_KEY: str = "HallReservationSecretKey"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    class Config:
        env_file = ".env"

settings = Settings()
