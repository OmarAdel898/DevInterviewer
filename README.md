# DevInterviewer

Real-time coding interview platform built with Angular, Node.js, Express, MongoDB, and Socket.io.

## Current Project State (Implemented)

This README reflects what is currently working in the project today.

### Authentication and Roles

- JWT-based login and protected routes
- Roles: `admin`, `interviewer`, `user`
- Refresh token endpoint
- Profile update endpoint (`fullName`)

### Interview Management

- Create interview with:
	- title
	- candidate lookup by email
	- language
	- focus
	- schedule time
- List interviews by role:
	- interviewer/admin see owned interviews
	- user sees assigned interviews
- Delete interview
- Search, filter, and pagination in dashboard and user home lists

### Problem Bank and Assignment

- Problem CRUD API for interviewer/admin
- Dashboard UI for:
	- creating problems
	- listing problems
	- deleting problems
- Assign multiple problems to an interview
- Remove assigned problem from interview
- Interview details include assigned problems for both owner and candidate

### Interview Room (Real Time)

- Shared code updates through Socket.io
- Autosave code to backend
- Run code via backend compiler endpoint
	- supported languages: `javascript`, `python`
- Interview lifecycle:
	- interviewer can start interview
	- candidate sees waiting state before start
	- interviewer can end interview
	- ended interviews lock editor/run and candidate is redirected
- Presence indicator (participants in room)

### User Home Join Flows

- Join from assigned interview cards
- Quick Join by interview ID
	- validates access server-side
	- blocks unassigned users
	- blocks completed interviews
	- pending interviews open room in waiting mode until interviewer starts

### UI

- Angular 21 standalone components
- Tailwind CSS + DaisyUI
- Profile page with local theme switching (saved in localStorage)

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Angular 21, RxJS, Signals |
| Styling | Tailwind CSS, DaisyUI |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Realtime | Socket.io |
| Auth | JWT + refresh token cookie |

## Project Structure

```text
backend/
	controllers/
	middlewares/
	models/
	routes/
	sockets/
	validators/
	docs/
frontend/
	src/app/
		core/
		features/
		shared/
```

## Run Locally

### Prerequisites

- Node.js 18+
- MongoDB instance (local or cloud)

### 1) Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
DB_URL=mongodb://127.0.0.1:27017/devinterviewer
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:4200
```

Run backend:

```bash
npm run dev
```

### 2) Frontend

```bash
cd frontend
npm install
npm start
```

Frontend: `http://localhost:4200`

Backend: `http://127.0.0.1:3000`

Note for Windows PowerShell users: if execution policy blocks npm scripts, use `npm.cmd` instead of `npm`.

## API Reference

Detailed endpoint documentation is available in:

- `backend/docs/API_ENDPOINTS.md`

## Not Implemented Yet (Intentionally Out of Scope for Now)

The following were planned earlier but are not currently implemented:

- WebRTC video/audio interview calls
- Monaco editor integration
- PeerJS media signaling pipeline
- Advanced scorecards and interview analytics
- AI-generated feedback workflow in UI

## Development Notes

- Backend tests are not set up yet.
- Frontend includes Angular test tooling (`ng test`).
- Temporary code execution files are created under `backend/temp/` and cleaned after run.
