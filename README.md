# GlobeTrotter 

**GlobeTrotter** is an intelligent full-stack travel planning platform for creating, optimizing, budgeting, customizing, and sharing trips.

## Product Features

*  User registration, login & JWT authentication
*  Explore countries, cities & activities
*  Create and manage trips
*  Add multi-city destinations with date validation
*  Automatic date-based itinerary ordering
*  Manual drag-and-drop itinerary ordering
*  Automatic activity scheduling
*  Activity conflict & overlap detection
*  Trip budget tracking with exact decimal calculations
*  Budget utilization & spending insights
*  Smart trip health analysis
*  Budget-aware activity recommendations
*  Free-time detection
*  Day-wise itinerary optimization
*  Smart Trip Assistant
*  Public trip sharing with share codes
*  Profile management
*  Role-based admin access
*  Admin dashboard analytics
*  Responsive web interface

##  Smart Planning

```text
Trip
 ↓
Destinations
 ↓
Automatic ordering
 ↓
Activities
 ↓
Smart scheduling
 ↓
Budget analysis
 ↓
Recommendations
 ↓
Day optimization
 ↓
Share / Customize
```

##  Tech Stack

### Frontend

* React 18
* TypeScript
* Vite
* React Router
* TanStack Query
* Zustand
* React Hook Form
* Zod
* Tailwind CSS
* date-fns

### Backend

* Python
* FastAPI
* SQLAlchemy 2.x
* Pydantic
* JWT
* bcrypt
* Alembic

### Database

* MySQL
* PyMySQL
* Relational normalized schema
* Foreign keys & constraints
* `DECIMAL(12,2)` monetary values

##  Structure

```text
GlobeTrotter/
├── backend/
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   ├── utils/
│   ├── alembic/
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── cities/
│   │   │   ├── dashboard/
│   │   │   ├── profile/
│   │   │   └── trips/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── store/
│   │   └── styles/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

##  Core API

```text
/api/auth/*
/api/cities/*
/api/countries/*
/api/trips/*
/api/trips/{id}/stops/*
/api/trips/{id}/activities/*
/api/trips/{id}/budget/*
/api/trips/{id}/insights/*
/api/trips/{id}/smart/*
/api/public/*
/api/admin/*
```

##  Frontend Screens

```text
Login
Register
Dashboard
My Trips
Create Trip
Trip Detail
Itinerary Builder
Trip Timeline
Budget
Explore Cities
City Details
Profile
Public Shared Trip
Admin
```

##  Run Locally

### Backend

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload
```

API: `http://localhost:8000`
Swagger: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

### Database migrations

```bash
cd backend
alembic upgrade head
```

##  Environment

Create `backend/.env`:

```env
DATABASE_URL=mysql+pymysql://root:PASSWORD@localhost:3306/globetrotter
SECRET_KEY=your-secret-key
```

Do not commit secrets.

## Team :
Yashvi Dalsaniya 
Mohil Pipaliya
