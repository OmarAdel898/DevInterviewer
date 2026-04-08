# DevInterviewer API Documentation

API for authentication and interview management in the DevInterviewer platform.

## Base Routes

| Area | Base Route |
| --- | --- |
| Authentication | `/auth` |
| Interviews | `/interviews` |

## Quick Start Flow

1. Register with `POST /auth/register`.
2. Login with `POST /auth/login`.
3. Use the returned access token in `Authorization: Bearer <token>`.
4. Call interview endpoints under `/interviews`.

## Endpoint Cheat Sheet

| Method | Path | Auth Required | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Create a new user |
| POST | `/auth/login` | No | Authenticate and get access token |
| POST | `/interviews` | Yes | Create interview |
| GET | `/interviews` | Yes | List my interviews |
| PATCH | `/interviews/:id` | Yes | Update code or status |
| DELETE | `/interviews/:id` | Yes | Delete interview |

## Authentication Endpoints

### 1. Register a New User

**Endpoint**: `POST /auth/register`

**Request Body**

```json
{
  "fullName": "Omar Adel",
  "email": "omar@gmail.com",
  "password": "yourpassword123",
  "role": "interviewer"
}
```

**Success Response (201 Created)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "69c84...",
    "fullName": "Omar Adel",
    "email": "omar@gmail.com"
  }
}
```

### 2. Login

**Endpoint**: `POST /auth/login`

**Request Body**

```json
{
  "email": "...",
  "password": "..."
}
```

**Success Response (200 OK)**

Sets an `httpOnly` refresh-token cookie and returns:

```json
{
  "success": true,
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "...",
    "fullName": "...",
    "role": "interviewer"
  }
}
```

## Interview Endpoints

All interview endpoints require this header:

```http
Authorization: Bearer <token>
```

### 1. Create Interview

**Endpoint**: `POST /interviews`

**Request Body**

```json
{
  "title": "Frontend Developer Mock",
  "candidateName": "Ahmed Ali",
  "language": "javascript"
}
```

**Success Response (201 Created)**

Returns the full Interview object, including the assigned owner.

### 2. Get My Interviews (Dashboard)

**Endpoint**: `GET /interviews`

**Description**

Returns all interviews where the logged-in user is the owner.

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "title": "...",
      "status": "pending",
      "createdAt": "..."
    }
  ]
}
```

### 3. Update Code (Auto-save)

**Endpoint**: `PATCH /interviews/:id`

**Description**

Updates the code snippet or interview status.

**Request Body**

```json
{
  "code": "console.log('Syncing...');",
  "status": "in-progress"
}
```

### 4. Delete Interview

**Endpoint**: `DELETE /interviews/:id`

**Description**

Deletes an interview owned by the authenticated user.

If the interview does not exist or belongs to another user, the endpoint returns `404`.

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Interview deleted"
}
```

## Error Responses

All errors follow a unified structure for easier frontend handling.

| Status Code | Description |
| --- | --- |
| 400 | Bad Request: Validation failed (for example, title is too short). |
| 401 | Unauthorized: Token missing, expired, or invalid. |
| 404 | Not Found: Interview ID does not exist or user is not the owner. |
| 500 | Server Error: Something went wrong on the backend. |

**Example Error Body**

```json
{
  "success": false,
  "message": "Interview title is required",
  "errors": [
    {
      "msg": "Interview title is required",
      "path": "title"
    }
  ]
}
```
