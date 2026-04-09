# DevInterviewer API Documentation

API for authentication, interview lifecycle management, and reusable problem assignment.

## Base Routes

| Area | Base Route |
| --- | --- |
| Authentication | `/auth` |
| Interviews | `/interviews` |
| Problems | `/problems` |

## Auth Header

All protected endpoints require:

```http
Authorization: Bearer <token>
```

## Quick Start Flow

1. Register with `POST /auth/register`.
2. Login with `POST /auth/login`.
3. Store `accessToken` and send it in `Authorization` header.
4. Create problems under `/problems`.
5. Create interviews under `/interviews`.
6. Assign problems with `PATCH /interviews/:id/problems`.
7. Start and end lifecycle with `/interviews/:id/start` and `/interviews/:id/end`.

## Endpoint Cheat Sheet

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login and return access token |
| GET | `/auth/refresh-token` | No (cookie) | Refresh access token |
| POST | `/auth/user` | Yes | Lookup user by email |
| PATCH | `/auth/profile` | Yes | Update current user full name |
| GET | `/interviews` | Yes | List interviews for current user (owner or candidate view) |
| GET | `/interviews/:id` | Yes (participant) | Get interview details |
| POST | `/interviews` | Yes | Create interview |
| PATCH | `/interviews/:id` | Yes (participant) | Update interview code |
| PATCH | `/interviews/:id/start` | Yes (owner) | Start interview |
| PATCH | `/interviews/:id/end` | Yes (owner) | End interview |
| GET | `/interviews/:id/problems` | Yes (participant) | List assigned problems |
| PATCH | `/interviews/:id/problems` | Yes (owner) | Assign one or more problems |
| DELETE | `/interviews/:id/problems/:problemId` | Yes (owner) | Remove assigned problem |
| DELETE | `/interviews/:id` | Yes | Delete interview |
| GET | `/problems` | Yes (admin/interviewer) | List my problem bank |
| GET | `/problems/:id` | Yes (admin/interviewer) | Get one problem |
| POST | `/problems` | Yes (admin/interviewer) | Create problem |
| PATCH | `/problems/:id` | Yes (admin/interviewer) | Update problem |
| DELETE | `/problems/:id` | Yes (admin/interviewer) | Delete problem |

## Authentication Endpoints

### Register

`POST /auth/register`

```json
{
  "fullName": "Omar Adel",
  "email": "omar@gmail.com",
  "password": "yourpassword123",
  "role": "interviewer"
}
```

### Login

`POST /auth/login`

```json
{
  "email": "omar@gmail.com",
  "password": "yourpassword123"
}
```

Returns `accessToken` and user object.

### Update Profile

`PATCH /auth/profile`

```json
{
  "fullName": "Omar A."
}
```

Returns updated user data.

## Interview Endpoints

### Create Interview

`POST /interviews`

```json
{
  "title": "Frontend Pairing",
  "candidateName": "Ahmed Ali",
  "language": "javascript",
  "focus": "System design and APIs",
  "time": "2026-04-15T12:00:00.000Z",
  "candidate": "67f..."
}
```

### Update Code

`PATCH /interviews/:id`

```json
{
  "code": "console.log('autosave payload')"
}
```

### Start Interview (Owner Only)

`PATCH /interviews/:id/start`

No body required.

### End Interview (Owner Only)

`PATCH /interviews/:id/end`

No body required.

### Assign Problems to Interview (Owner Only)

`PATCH /interviews/:id/problems`

```json
{
  "problemIds": ["67f...", "680..."]
}
```

Adds non-duplicate problem assignments and returns updated interview with populated assigned problems.

### Remove Assigned Problem (Owner Only)

`DELETE /interviews/:id/problems/:problemId`

Removes one assignment from the interview.

## Problem Endpoints

### Create Problem

`POST /problems`

```json
{
  "title": "Two Sum",
  "description": "Return indices of two numbers that add up to target.",
  "difficulty": "easy",
  "language": "javascript",
  "starterCode": "function solve(nums, target) {}",
  "topics": ["arrays", "hashing"]
}
```

### Update Problem

`PATCH /problems/:id`

Supports partial updates for `title`, `description`, `difficulty`, `language`, `starterCode`, and `topics`.

## Error Responses

Standard format:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Problem title is required",
      "path": "title"
    }
  ]
}
```

Common status codes: `400`, `401`, `403`, `404`, `500`.
