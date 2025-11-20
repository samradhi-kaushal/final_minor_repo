# CryptoVault Setup Guide

This guide will help you get the CryptoVault application up and running.

## Prerequisites

- Python 3.8+ installed
- Node.js 18+ and npm installed
- MongoDB (optional - only if using MongoDB for file storage)
- Virtual environment tool (venv or virtualenv)

## Backend Setup (Django)

1. **Navigate to the backend directory:**
   ```bash
   cd CryptoVault-backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser (optional, for admin access):**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```
   The backend will be available at `http://127.0.0.1:8000`

## Frontend Setup (React + Vite)

1. **Navigate to the project root directory:**
   ```bash
   cd ..
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:8080` (or the port shown in the terminal)

## Running the Application

### Development Mode (Recommended)

1. **Terminal 1 - Start Django backend:**
   ```bash
   cd CryptoVault-backend
   python manage.py runserver
   ```

2. **Terminal 2 - Start React frontend:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   - Frontend: `http://localhost:8080`
   - Backend API: `http://127.0.0.1:8000/api/v1/`
   - Admin Panel: `http://127.0.0.1:8000/admin/`

### Production Mode (Django serves both frontend and backend)

1. **Build the frontend:**
   ```bash
   npm run build
   ```
   This creates a `dist` folder with the compiled React app.

2. **Start Django (it will serve the built frontend):**
   ```bash
   cd CryptoVault-backend
   python manage.py runserver
   ```

3. **Open your browser:**
   - Application: `http://127.0.0.1:8000`

## Important Notes

- **CORS Configuration**: The backend is configured to allow requests from `localhost:8080` and `localhost:5173` (Vite default port)
- **Media Files**: Uploaded files are stored in the `media/` directory at the project root
- **Database**: SQLite is used by default (no additional setup needed)
- **MongoDB**: Optional - only required if you're using MongoDB for file storage (configured in `api/utils.py`)

## Troubleshooting

### Backend Issues

- **Port 8000 already in use**: Change the port with `python manage.py runserver 8001`
- **Migration errors**: Run `python manage.py makemigrations` then `python manage.py migrate`
- **Module not found**: Ensure you're in the virtual environment and all dependencies are installed

### Frontend Issues

- **Port 8080 already in use**: Vite will automatically use the next available port
- **API connection errors**: Ensure the Django backend is running on port 8000
- **Build errors**: Clear `node_modules` and reinstall with `rm -rf node_modules && npm install`

### Common Issues

- **CORS errors**: Check that `CORS_ALLOWED_ORIGINS` in `settings.py` includes your frontend URL
- **Static files not loading**: Run `python manage.py collectstatic` (for production)
- **Media files not accessible**: Ensure `MEDIA_ROOT` path is correct in `settings.py`

## API Endpoints

- **Authentication:**
  - `POST /api/v1/auth/register/` - User registration
  - `POST /api/v1/auth/login/` - User login (returns JWT tokens)
  - `POST /api/v1/auth/token/refresh/` - Refresh access token

- **Files:**
  - `GET /api/v1/files/vault_files/` - Get user's vault files
  - `GET /api/v1/files/shared_files/` - Get shared files
  - `POST /api/v1/uploadfiles/` - Upload a file
  - `GET /api/v1/files/<id>/` - Get file details
  - `POST /api/v1/files/<id>/decrypt_and_download/` - Decrypt and download file

## Next Steps

1. Create a user account via the signup page
2. Log in to access the vault
3. Upload files to your secure vault
4. Share files with other users
5. View audit logs of file activities

