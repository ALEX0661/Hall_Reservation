# Hall Reservation System

A FastAPI-based system for managing hall reservations with admin approval workflows.

## Features

- User authentication with JWT
- Student reservation request system
- Administrative approval workflow
- Resource selection for reservations
- Notifications system
- Feedback collection
- Time conflict detection
- Calendar view for admins

## System Architecture

### Backend
- FastAPI (Python)
- SQLAlchemy ORM
- MySQL Database
- JWT Authentication

### Database Models
- User: Students and administrators
- Hall: Function Hall and PE Hall
- Resource: Equipment/amenities that can be requested
- Reservation: Booking requests with status tracking
- Feedback: User reviews post-event
- Notification: System messages for users

## Installation

### Prerequisites
- Python 3.8+
- MySQL 5.7+

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hall-reservation-system.git
   cd hall-reservation-system
   ```

2. **Set up a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up MySQL database**
   ```bash
   mysql -u root -p < setup_db.sql
   ```

5. **Environment variables**
   Create a `.env` file in the project root with:
   ```
   DATABASE_URL=mysql+pymysql://Hall:Reservation@localhost/hall_reservation
   SECRET_KEY=HallReservationSecretKey
   ```

6. **Initialize the database with default data**
   ```bash
   python -m app.init_db
   ```

7. **Start the application**
   ```bash
   uvicorn app.main:app --reload
   ```

8. **Access the API documentation**
   Open your browser and navigate to http://localhost:8000/docs

## Usage

### Student Panel

1. **Registration and Login**
   - Students can register with school email, student number, and password
   - Authentication is done via JWT tokens

2. **Making Reservations**
   - Select hall (Function Hall or PE Hall)
   - Choose date and time
   - Select required resources (projector, speakers, etc.)
   - Submit request (status will be set to PENDING)

3. **Managing Reservations**
   - View all reservations and their statuses
   - Update pending reservations
   - Cancel reservations
   - Receive notifications about status changes

4. **Feedback**
   - Rate experience (1-5 stars)
   - Provide comments after using the facility

### Admin Panel

1. **Reservation Management**
   - View all reservation requests
   - Approve or deny requests
   - Provide feedback to users when denying requests
   - View calendar of approved reservations

2. **User Management**
   - View all users
   - Review user feedback

3. **Resource Management**
   - Add, remove, or update available resources

## Default Admin Credentials

- Email: admin@example.com
- Password: adminpassword

**IMPORTANT**: Change the default admin password in production!

## API Endpoints

### Authentication
- POST `/auth/signup` - Register new user
- POST `/auth/token` - Login and get JWT token
- GET `/auth/me` - Get current user info

### Reservations
- GET `/halls` - List available halls
- GET `/resources` - List available resources
- POST `/reservations` - Create new reservation
- GET `/reservations` - List user's reservations
- GET `/reservations/{id}` - Get reservation details
- PUT `/reservations/{id}` - Update reservation
- DELETE `/reservations/{id}` - Cancel reservation
- GET `/check-availability` - Check hall availability
- POST `/feedback` - Submit feedback

### Notifications
- GET `/notifications` - List user notifications
- PUT `/notifications/{id}/read` - Mark notification as read
- PUT `/notifications/read-all` - Mark all notifications as read
- GET `/notifications/count` - Get unread notification count

### Admin
- GET `/admin/users` - List all users
- GET `/admin/reservations` - List all reservations
- PUT `/admin/reservations/{id}/approve` - Approve reservation
- PUT `/admin/reservations/{id}/deny` - Deny reservation
- GET `/admin/feedback` - List all feedback
- GET `/admin/calendar` - Get calendar events

## License

This project is licensed under the MIT License.
