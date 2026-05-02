# Project Harmony — Backend API

Production-ready REST API for the Project Harmony project management application.  
Built with **Node.js · Express · MongoDB (Mongoose) · JWT · bcrypt · Joi**.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Setup & Installation](#setup--installation)
4. [Environment Variables](#environment-variables)
5. [Running the Server](#running-the-server)
6. [API Reference](#api-reference)
7. [Role-Based Access Control](#role-based-access-control)
8. [Error Response Format](#error-response-format)
9. [Postman Quick-Start](#postman-quick-start)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express 4 |
| Database | MongoDB via Mongoose 8 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs (salt rounds: 12) |
| Validation | Joi |
| Logging | Winston + Morgan |
| Security | Helmet, express-mongo-sanitize, express-rate-limit |

---

## Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   ├── taskController.js
│   └── dashboardController.js
├── middleware/
│   ├── authMiddleware.js       # JWT verification
│   ├── roleMiddleware.js       # RBAC enforcement
│   ├── validateRequest.js      # Joi validation factory
│   ├── errorHandler.js         # Centralised error handler
│   └── validators/
│       ├── authValidators.js
│       ├── projectValidators.js
│       └── taskValidators.js
├── models/
│   ├── User.js
│   ├── Project.js
│   └── Task.js
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── taskRoutes.js
│   └── dashboardRoutes.js
├── utils/
│   ├── ApiError.js             # Custom error class
│   ├── apiResponse.js          # Standardised response helpers
│   ├── logger.js               # Winston logger
│   └── pagination.js           # Pagination helper
├── logs/                       # Auto-created at runtime
├── app.js                      # Express app setup
├── server.js                   # Entry point
├── .env                        # Local environment (git-ignored)
├── .env.example                # Template
└── package.json
```

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally **or** a MongoDB Atlas connection string

### Steps

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Copy the example env file and fill in your values
cp .env.example .env
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `development` | `development` / `production` |
| `MONGO_URI` | `mongodb://localhost:27017/project_harmony` | MongoDB connection string |
| `JWT_SECRET` | — | **Required.** Long random string |
| `JWT_EXPIRES_IN` | `7d` | Token expiry (e.g. `1d`, `7d`, `30d`) |
| `CLIENT_URL` | `http://localhost:8080` | Allowed CORS origin(s), comma-separated |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit window in ms (15 min) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window per IP |

---

## Running the Server

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

Health check endpoint: `GET http://localhost:5000/health`

---

## API Reference

All endpoints are prefixed with `/api`.  
Protected routes require the header: `Authorization: Bearer <token>`

### Auth

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/auth/signup` | ✗ | — | Register a new user |
| POST | `/api/auth/login` | ✗ | — | Login and receive JWT |
| GET | `/api/auth/me` | ✓ | Any | Get current user profile |

**Signup body:**
```json
{
  "name": "Jane Cooper",
  "email": "jane@example.com",
  "password": "securepassword",
  "role": "Admin"
}
```

**Login body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

---

### Projects

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/projects` | ✓ | Admin | Create a project |
| GET | `/api/projects` | ✓ | Any | List accessible projects |
| GET | `/api/projects/:id` | ✓ | Any | Get project by ID |
| PUT | `/api/projects/:id` | ✓ | Admin | Update project |
| DELETE | `/api/projects/:id` | ✓ | Admin | Delete project + tasks |
| POST | `/api/projects/:id/members` | ✓ | Admin | Add members |
| DELETE | `/api/projects/:id/members/:memberId` | ✓ | Admin | Remove a member |

**Query params (GET /api/projects):**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` — full-text search on title/description

---

### Tasks

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/api/tasks` | ✓ | Admin | Create a task |
| GET | `/api/tasks` | ✓ | Any | List accessible tasks |
| GET | `/api/tasks/:id` | ✓ | Any | Get task by ID |
| PUT | `/api/tasks/:id` | ✓ | Admin / Assigned Member | Update task |
| DELETE | `/api/tasks/:id` | ✓ | Admin | Delete task |

**Query params (GET /api/tasks):**
- `page`, `limit`
- `status` — `Pending` | `In Progress` | `Completed`
- `priority` — `Low` | `Medium` | `High`
- `projectId` — filter by project
- `search` — full-text search

**Create task body:**
```json
{
  "title": "Design landing page",
  "description": "Update hero section",
  "status": "Pending",
  "priority": "High",
  "dueDate": "2026-06-15",
  "assignedTo": "<userId>",
  "projectId": "<projectId>"
}
```

---

### Dashboard

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/dashboard` | ✓ | Any | Role-scoped stats |

**Admin response includes:**
- `stats`: totalTasks, completedTasks, pendingTasks, inProgressTasks, overdueTasks, totalProjects
- `projects`: all admin projects with per-project progress %
- `recentTasks`: last 5 tasks

**Member response includes:**
- `stats`: same shape, scoped to assigned tasks only
- `projects`: projects the member belongs to
- `recentTasks`: last 5 tasks assigned to the member

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create project | ✓ (own) | ✗ |
| View projects | ✓ (own) | ✓ (member of) |
| Update/delete project | ✓ (own) | ✗ |
| Add/remove members | ✓ (own) | ✗ |
| Create task | ✓ (own projects) | ✗ |
| View tasks | ✓ (own projects) | ✓ (assigned only) |
| Update task (all fields) | ✓ (own projects) | ✗ |
| Update task status | ✗ | ✓ (assigned only) |
| Delete task | ✓ (own projects) | ✗ |
| Dashboard (full stats) | ✓ | ✗ |
| Dashboard (personal stats) | ✗ | ✓ |

---

## Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": ["field-level validation messages (optional)"],
  "stack": "stack trace (development only)"
}
```

Common HTTP status codes:
- `400` Bad Request / Validation failed
- `401` Unauthenticated
- `403` Forbidden (insufficient role or ownership)
- `404` Not found
- `409` Conflict (duplicate email, etc.)
- `429` Too many requests
- `500` Internal server error

---

## Postman Quick-Start

1. Create an Admin account via `POST /api/auth/signup` with `"role": "Admin"`
2. Login via `POST /api/auth/login` — copy the `token` from the response
3. Set a collection variable `{{token}}` and use `Bearer {{token}}` as the Authorization header
4. Create a project → add members → create tasks → check the dashboard

---

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- JWT secret must be a long random string in production
- MongoDB injection is prevented via `express-mongo-sanitize`
- HTTP headers are hardened with `helmet`
- Rate limiting is applied globally (100 req/15 min) and strictly on auth routes (20 req/15 min)
- Sensitive data (passwords) is never returned in API responses
