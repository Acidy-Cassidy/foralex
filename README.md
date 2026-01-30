# CompanyCam Clone

A web application that replicates CompanyCam's photo/video capture and management capabilities.

## Features

- Photo/video capture with GPS tagging and timestamps
- Project management and organization
- Media gallery with filtering and search
- User authentication and authorization
- Cloud storage for media files

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. Set up environment variables:

Backend (create `backend/.env`):
```
DATABASE_URL="postgresql://user:password@localhost:5432/companycam"
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
```

Frontend (create `frontend/.env`):
```
VITE_API_URL=http://localhost:3001/api
```

3. Set up database:
```bash
cd backend
npx prisma migrate dev
```

4. Run development servers:
```bash
npm run dev
```

The frontend will be available at http://localhost:5173
The backend API will be available at http://localhost:3001

## Project Structure

```
companycam-clone/
├── frontend/     # React frontend application
├── backend/      # Node.js backend API
└── README.md
```
