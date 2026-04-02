# Finance Dashboard API

## Overview

A RESTful backend API for a finance dashboard system built with Node.js and Express.js. It manages financial records, users, roles, and provides analytics through well-structured endpoints. The system enforces role-based access control ensuring each user type can only perform actions appropriate to their role.

**Tech Stack:** Node.js · Express.js · SQLite (better-sqlite3) · JWT Authentication

---

## Features

- User authentication with JWT tokens
- Role-based access control (Admin, Analyst, Viewer)
- Financial records management with full CRUD operations
- Advanced filtering and pagination for records
- Dashboard analytics and summary APIs
- Comprehensive input validation and error handling
- Rate limiting and security headers (helmet, cors)
- Soft delete for financial records to preserve data history

---

## Tech Stack

| Layer          | Technology              |
|----------------|-------------------------|
| Runtime        | Node.js                 |
| Framework      | Express.js              |
| Database       | SQLite via better-sqlite3 |
| Authentication | JSON Web Tokens (JWT)   |
| Password Hashing | bcryptjs              |
| Security       | helmet, cors, express-rate-limit |

---

## Project Structure

```
finance-dashboard-api/
├── src/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── record.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── role.middleware.js
│   │   └── validate.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── record.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── record.routes.js
│   │   └── user.routes.js
│   └── utils/
│       └── response.js
├── .env
├── .gitignore
├── index.js
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm v7 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VinodRathod1/finance-dashboard-api.git
   cd finance-dashboard-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory
   ```env
   PORT=5000
   JWT_SECRET=finance_dashboard_secret_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. The server will start at **http://localhost:5000**

> The SQLite database file (`database.sqlite`) is created automatically on first run.

### Default Admin Account

A default admin account is created automatically on the first server startup:

| Field    | Value                |
|----------|----------------------|
| Email    | admin@finance.com    |
| Password | admin123             |
| Role     | admin                |

---

## API Documentation

### Base URL

```
http://localhost:5000/api/v1
```

### Authentication

All protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

### Auth Endpoints

#### POST `/auth/register`
Register a new user account.

- **Access:** Public
- **Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "john1234",
  "role": "analyst"
}
```
- **Response:** `201 Created` with user data

---

#### POST `/auth/login`
Login with existing credentials and receive a JWT token.

- **Access:** Public
- **Request Body:**
```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```
- **Response:** `200 OK` with token and user data

---

### User Endpoints

| Method | Endpoint                  | Description                        | Access              |
|--------|---------------------------|------------------------------------|---------------------|
| GET    | `/users/me`               | Get current user profile           | All roles           |
| GET    | `/users`                  | Get all users                      | Admin only          |
| GET    | `/users/:id`              | Get user by ID                     | Admin or own profile|
| PUT    | `/users/:id`              | Update user                        | Admin or own profile|
| DELETE | `/users/:id`              | Delete user                        | Admin only          |
| POST   | `/users/change-password`  | Change own password                | All roles           |

---

### Financial Records Endpoints

| Method | Endpoint       | Description                          | Access          |
|--------|----------------|--------------------------------------|-----------------|
| POST   | `/records`     | Create a new financial record        | Admin, Analyst  |
| GET    | `/records`     | Get all records with filters         | All roles       |
| GET    | `/records/:id` | Get a single record by ID            | All roles       |
| PUT    | `/records/:id` | Update an existing record            | Admin, Analyst  |
| DELETE | `/records/:id` | Soft delete a record                 | Admin only      |

#### Query Parameters for `GET /records`

| Parameter    | Type   | Description                        |
|--------------|--------|------------------------------------|
| `type`       | string | Filter by `income` or `expense`    |
| `category`   | string | Filter by category name            |
| `start_date` | string | Filter from date (`YYYY-MM-DD`)    |
| `end_date`   | string | Filter until date (`YYYY-MM-DD`)   |
| `page`       | number | Page number (default: `1`)         |
| `limit`      | number | Records per page (default: `10`, max: `50`) |

---

### Dashboard Endpoints

| Method | Endpoint                       | Description                          | Access    |
|--------|--------------------------------|--------------------------------------|-----------|
| GET    | `/dashboard/summary`           | Total income, expenses, net balance  | All roles |
| GET    | `/dashboard/category-totals`   | Totals grouped by category and type  | All roles |
| GET    | `/dashboard/monthly-trends`    | Monthly income and expense breakdown | All roles |
| GET    | `/dashboard/recent-activity`   | Most recent financial records        | All roles |
| GET    | `/dashboard/weekly-trends`     | Weekly income and expense breakdown  | All roles |

#### Query Parameters

| Endpoint              | Parameter | Description                          |
|-----------------------|-----------|--------------------------------------|
| `/monthly-trends`     | `year`    | Year to filter (default: current year)|
| `/recent-activity`    | `limit`   | Number of records (default: `5`, max: `20`) |
| `/weekly-trends`      | `weeks`   | Number of weeks back (default: `4`, max: `12`) |

---

## Role Permissions

| Action                | Admin | Analyst | Viewer |
|-----------------------|:-----:|:-------:|:------:|
| View records          |  ✅   |   ✅    |   ✅   |
| Create records        |  ✅   |   ✅    |   ❌   |
| Update records        |  ✅   |   ✅    |   ❌   |
| Delete records        |  ✅   |   ❌    |   ❌   |
| View dashboard        |  ✅   |   ✅    |   ✅   |
| Manage all users      |  ✅   |   ❌    |   ❌   |
| View own profile      |  ✅   |   ✅    |   ✅   |
| Change own password   |  ✅   |   ✅    |   ✅   |

---

## Error Handling

All errors return a consistent JSON response:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"]
}
```

### HTTP Status Codes

| Code | Meaning               |
|------|-----------------------|
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request / Validation Error |
| 401  | Unauthorized          |
| 403  | Forbidden             |
| 404  | Not Found             |
| 409  | Conflict              |
| 429  | Too Many Requests     |
| 500  | Internal Server Error |

---

## Assumptions and Design Decisions

1. **SQLite** was chosen for simplicity and zero configuration — no database server setup required.
2. **Soft delete** is used for financial records to preserve data history and maintain accurate analytics.
3. **Hard delete** is used for users as user data cleanup is acceptable for this use case.
4. **JWT tokens** expire in 7 days, balancing security and usability.
5. **Rate limiting** is set to 100 requests per 15 minutes per IP to prevent abuse.
6. A **default admin user** is created on first server startup to allow immediate access.
7. **Analysts** can create and update records but cannot delete them, as deletion is a destructive action.
8. **Viewers** have read-only access to all records and dashboard data.
9. All SQL queries are written as **raw SQL** without an ORM for performance transparency and full control.

---

## Future Improvements

- Add refresh token support for better session management
- Add email verification on registration
- Add export to CSV/PDF functionality for records
- Add more granular permissions per resource
- Add audit logs for all user actions
- Switch to PostgreSQL for production deployments
- Add comprehensive unit and integration tests
- Add API versioning strategy for backward compatibility
