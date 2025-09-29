# Lumnicode - AI-Powered Online Code Editor

![Lumnicode Logo](https://via.placeholder.com/150x50/6366f1/ffffff?text=Lumnicode)

Lumnicode is a modern, AI-powered online code editor built with React (frontend) and FastAPI (backend). It provides real-time code editing, project management, and AI-assisted coding features.

## 🚀 Features

- **AI-Powered Code Assistance**: Get intelligent suggestions and code improvements
- **Project Management**: Create, organize, and manage coding projects
- **Real-time Code Editor**: Monaco Editor integration with syntax highlighting
- **Authentication**: Secure user authentication with Clerk
- **File Management**: Complete CRUD operations for project files
- **Modern UI**: Responsive design inspired by VS Code
- **Cloud Database**: Powered by Neon.tech PostgreSQL

## 🏗️ Architecture

### Backend (FastAPI)
- **Framework**: FastAPI with Python 3.11+
- **Database**: PostgreSQL (Neon.tech)
- **Authentication**: Clerk JWT verification
- **ORM**: SQLAlchemy with Alembic migrations
- **API**: RESTful endpoints for projects, files, and AI assistance

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Routing**: React Router
- **Authentication**: Clerk React

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **Python** (v3.11 or higher)
- **Clerk Account** (for authentication)
- **Neon.tech Account** (for PostgreSQL database)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd lumnicode
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your configuration:

```env
# Database (from Neon.tech)
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.aws.neon.tech/neondb

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# Application Settings
DEBUG=True
APP_NAME=Lumnicode
```

### 3. Database Migration

```bash
# Generate initial migration
alembic revision --autogenerate -m "Initial migration"

# Run migrations
alembic upgrade head
```

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `frontend/.env` with your Clerk configuration:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Running the Application

### Option 1: Using Docker Compose

#### For Development (with hot reload):
```bash
# From the root directory
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- Backend API at `http://localhost:8000` (with hot reload)
- Frontend dev server at `http://localhost:3000` (with hot reload)

#### For Production (with Nginx):
```bash
# From the root directory
docker-compose up --build
```

This will start:
- Backend API at `http://localhost:8000`
- Frontend app served by Nginx at `http://localhost` (port 80)

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
# Activate virtual environment
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 📚 API Documentation

Once the backend is running, you can access:

- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

### Main Endpoints

- `GET /health` - Health check
- `GET /auth/me` - Get current user info
- `GET /projects` - List user projects
- `POST /projects` - Create new project
- `GET /files?project_id=X` - List project files
- `POST /files` - Create new file
- `POST /assist` - AI code assistance

## 🔧 Development

### Backend Development

```bash
cd backend

# Install development dependencies
pip install black ruff

# Format code
black .

# Lint code
ruff check .

# Run tests
pytest
```

### Frontend Development

```bash
cd frontend

# Format code
npm run format

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### Database Operations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## 📁 Project Structure

```
lumnicode/
├── backend/
│   ├── src/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── db/           # Database configuration
│   ├── alembic/          # Database migrations
│   ├── main.py           # FastAPI app entry point
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   └── lib/          # Utilities and API client
│   ├── public/           # Static assets
│   └── package.json      # Node.js dependencies
└── docker-compose.yml    # Docker configuration
```

## 🔐 Authentication Setup

### Clerk Configuration

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your publishable and secret keys from the dashboard
4. Add the keys to your `.env` files

### Environment Variables

**Backend (.env):**
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `DATABASE_URL`: Your Neon.tech database URL

**Frontend (.env):**
- `VITE_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key

## 🗃️ Database Schema

### Users Table
- `id`: Primary key
- `clerk_id`: Unique Clerk user identifier
- `email`: User email
- `first_name`, `last_name`: User names
- `created_at`, `updated_at`: Timestamps

### Projects Table
- `id`: Primary key
- `name`: Project name
- `description`: Project description
- `owner_id`: Foreign key to users
- `is_public`: Visibility flag
- `created_at`, `updated_at`: Timestamps

### Files Table
- `id`: Primary key
- `name`: File name
- `path`: File path within project
- `content`: File content
- `language`: Programming language
- `project_id`: Foreign key to projects
- `created_at`, `updated_at`: Timestamps

## 🚀 Deployment

### Backend Deployment (Railway/Render)

1. Connect your repository to Railway or Render
2. Set environment variables in the platform dashboard
3. The service will automatically build and deploy

### Frontend Deployment (Vercel)

1. Connect your repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### Environment Variables for Production

Make sure to set these in your deployment platform:

**Backend:**
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`

**Frontend:**
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL` (your backend URL)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error:**
- Verify your Neon.tech DATABASE_URL is correct
- Check if your IP is whitelisted in Neon.tech dashboard

**Clerk Authentication Error:**
- Ensure your Clerk keys are correctly set in environment variables
- Verify the keys match your Clerk application dashboard

**Frontend Build Issues:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility

**Backend Import Errors:**
- Ensure you're in the correct virtual environment
- Reinstall requirements: `pip install -r requirements.txt`

### Getting Help

- Open an issue in the GitHub repository
- Check the API documentation at `/docs`
- Review the browser console and server logs for error details

---

Built with ❤️ using FastAPI, React, and modern web technologies.