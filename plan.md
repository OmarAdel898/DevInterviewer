## Plan: DevInterviewer Finalization Roadmap

Ship the remaining scope in five phases with contract-first sequencing: stabilize backend/frontend response shape, then interview management, then interview workspace with debounced persistence, then AI evaluation/reporting, and finally UX hardening. This keeps architecture clean and prevents frontend rework.

**Steps**
1. Phase 1 - Contract and auth foundation.
2. Phase 1 - Navbar UX completion.
3. Phase 2 - Interview backend domain (model + routes + controllers).
4. Phase 2 - Dashboard API integration and create flow.
5. Phase 3 - Interview room with Monaco and auto-save.
6. Phase 3 - Workspace right drawer for AI and instructions.
7. Phase 4 - AI hint and final evaluation API/frontend flow.
8. Phase 4 - Read-only report page.
9. Phase 5 - Theme switcher, loading interceptor, final route guard coverage.

**Execution Detail (Simplified Logic + High-End DaisyUI UI Code Pattern)**
1. Unified Auth Response.
Simplified Logic: Normalize every backend success/error payload to success, message, data optional. Keep controllers and error middleware aligned, then map frontend response typing once in AuthService.
High-End UI Code: Use a uniform feedback shell with alert alert-success and alert alert-error blocks in auth views and modal submissions.

2. State Persistence.
Simplified Logic: During AuthService initialization, read token and user from localStorage, hydrate currentUser signal, and expose computed authenticated state. On login/register/logout, keep signal and localStorage in sync.
High-End UI Code: Show compact session status chip with badge badge-neutral while restoring and badge badge-success after hydrate.

3. Global Navbar responsive design.
Simplified Logic: One menu model rendered as desktop horizontal menu and mobile drawer menu using a shared action handler.
High-End UI Code: Build shell with navbar bg-base-100 border-b border-base-300, drawer drawer-end, menu menu-horizontal, menu menu-sm, btn btn-ghost, btn btn-primary.

4. Conditional rendering from currentUser signal.
Simplified Logic: Derive isLoggedIn from currentUser and switch guest controls versus profile dropdown.
High-End UI Code: Guest state uses btn btn-outline and btn btn-primary; authenticated state uses dropdown dropdown-end with avatar placeholder and menu.

5. logout behavior.
Simplified Logic: Clear currentUser signal, remove auth keys from localStorage, clear interview-related transient state, redirect to login.
High-End UI Code: In dropdown menu place logout action as text-error and active:bg-error active:text-error-content with a separator using divider.

6. Interview Schema.
Simplified Logic: Add Interview schema with title, candidateName, language, code, aiFeedback, status, owner reference, timestamps, and strict enum validation.
High-End UI Code: Map status to badge variants badge-info, badge-warning, badge-success for In-Progress, Pending, Completed.

7. Dashboard fetch interviews.
Simplified Logic: On dashboard init, call protected list endpoint for authenticated user and store in interviews signal with loading/error signals.
High-End UI Code: Loading uses loading loading-spinner loading-md centered inside card bg-base-100 shadow-sm.

8. SaaS-style interview cards.
Simplified Logic: Transform API item to card view model with title, candidateName, language, updatedAt, status, and quick actions.
High-End UI Code: card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition with card-body, badge, stat-like meta row, btn btn-outline btn-sm.

9. Empty state UI.
Simplified Logic: If interviews length equals zero and not loading, render call-to-action panel to create first interview.
High-End UI Code: hero min-h-64 rounded-box bg-base-200 with hero-content text-center, heading, muted copy, and btn btn-primary.

10. Create Interview modal.
Simplified Logic: Open modal, validate title and language, POST create endpoint, close on success, refresh list.
High-End UI Code: modal modal-open optional state, modal-box, form-control, input input-bordered, select select-bordered, modal-action, btn btn-primary, btn btn-ghost.

11. Navigate to interview route on create success.
Simplified Logic: Read created id from response data and navigate to interview/id immediately.
High-End UI Code: Optional transition toast-style notice via alert alert-success in a fixed top container.

12. Monaco integration.
Simplified Logic: Install and configure ngx-monaco-editor-v2 for standalone Angular component usage and lazy-load interview route.
High-End UI Code: Editor shell in card bg-base-100 border border-base-300 with toolbar row using join and badge elements.

13. Bind editor value to reactive state.
Simplified Logic: Bind Monaco content to signal or FormControl, track dirty state and lastSavedSnapshot to prevent redundant writes.
High-End UI Code: toolbar badges badge badge-outline for Dirty and badge badge-success for Synced.

14. Debounced auto-save (selected approach).
Simplified Logic: Stream editor changes, apply debounceTime(800), distinctUntilChanged, switchMap to PATCH endpoint, cancel stale requests on new typing, and recover from errors without interrupting editing.
High-End UI Code: save indicator badge badge-warning while request in-flight showing Saving..., then badge badge-success showing Saved; on failure show badge badge-error Retry Needed.

15. Workspace sidebar layout.
Simplified Logic: Main editor pane remains primary; right panel toggles for AI Assistance and Interview Instructions.
High-End UI Code: drawer drawer-end with drawer-content for editor and drawer-side containing tabs tabs-box and collapsible sections using collapse collapse-arrow.

16. AI Proxy Route.
Simplified Logic: Backend endpoint accepts interview id plus mode hint or final, sends safe prompt to provider, parses response, returns normalized shape.
High-End UI Code: During generation show inline alert alert-info with loading loading-dots.

17. Get AI Hint button.
Simplified Logic: Send current code and context to hint endpoint, append concise guidance to right panel history.
High-End UI Code: btn btn-accent btn-sm and hint cards with card bg-base-200 border border-base-300 plus badge badge-accent label.

18. Finish Interview flow.
Simplified Logic: Confirm action, persist latest code, call final evaluation endpoint, mark interview Completed, navigate to report.
High-End UI Code: confirmation with modal, destructive action btn btn-error, primary action btn btn-primary.

19. Report view.
Simplified Logic: Fetch interview details by id and render read-only code plus score, strengths, weaknesses from aiFeedback.
High-End UI Code: stats shadow with stat blocks, score bar via progress progress-primary, strengths/weaknesses cards, and readonly code container.

20. Theme switcher.
Simplified Logic: Dropdown in navbar sets data-theme and writes selected theme to localStorage, restored at bootstrap.
High-End UI Code: dropdown dropdown-end menu with theme options light dark retro nord, each row showing badge preview tokens.

21. Loading interceptor.
Simplified Logic: Global interceptor increments active request counter on start and decrements on finalize; app-level signal controls loading visibility.
High-End UI Code: top progress bar progress progress-primary w-full fixed at page top and optional loading loading-ring near navbar actions.

22. Auth guard finalization.
Simplified Logic: Functional guard checks hydrated auth state, redirects guests to login with returnUrl, protects dashboard and interview/report routes.
High-End UI Code: while auth hydration resolves, show skeleton skeleton-text and skeleton avatar placeholders in guarded layouts.

**Relevant files**
- [backend/app.js](backend/app.js) - mount interview and AI routes and preserve middleware order.
- [backend/controllers/auth.controller.js](backend/controllers/auth.controller.js) - unify auth success payload shape.
- [backend/middlewares/errorHandler.middleware.js](backend/middlewares/errorHandler.middleware.js) - normalize backend error payload.
- [backend/middlewares/auth.middleware.js](backend/middlewares/auth.middleware.js) - enforce protected ownership checks.
- [backend/routes/auth.router.js](backend/routes/auth.router.js) - keep auth route contract consistent.
- [frontend/src/app/core/services/auth-service.ts](frontend/src/app/core/services/auth-service.ts) - persistence hydrate and logout sync.
- [frontend/src/app/shared/components/navbar/navbar.ts](frontend/src/app/shared/components/navbar/navbar.ts) - conditional auth menu and theme switching logic.
- [frontend/src/app/shared/components/navbar/navbar.html](frontend/src/app/shared/components/navbar/navbar.html) - responsive drawer/menu rendering.
- [frontend/src/app/app.routes.ts](frontend/src/app/app.routes.ts) - add guarded interview and report routes.
- [frontend/src/app/features/dashboard/dashboard.ts](frontend/src/app/features/dashboard/dashboard.ts) - list/create flow and navigation.
- [frontend/src/app/features/dashboard/dashboard.html](frontend/src/app/features/dashboard/dashboard.html) - cards, empty state, modal UI.
- [frontend/src/app/core/guards/auth.guard.ts](frontend/src/app/core/guards/auth.guard.ts) - finalized route protection.
- [frontend/src/app/core/interceptors/auth-token.interceptor.ts](frontend/src/app/core/interceptors/auth-token.interceptor.ts) - token and shared interceptor compatibility.
- [frontend/src/app/app.config.ts](frontend/src/app/app.config.ts) - register interceptors/providers.
- [frontend/src/styles.css](frontend/src/styles.css) - global progress bar and utility polish.
- [frontend/src/index.html](frontend/src/index.html) - theme bootstrap from persisted value.
- [frontend/package.json](frontend/package.json) - Monaco dependency addition.

**Verification**
1. Contract check: login/register errors and successes always return success, message, data optional.
2. Persistence check: refresh and browser reopen keep auth state; logout clears all auth state.
3. Navbar check: mobile drawer and desktop menu render correctly in guest and logged-in states.
4. Dashboard check: loading, populated list, and empty state all render correctly.
5. Create flow check: modal submit creates interview and routes to interview/id.
6. Auto-save check: PATCH triggers only after 800 ms idle; badge transitions Saving... to Saved.
7. AI flow check: Get AI Hint returns concise hint; Finish Interview returns score, strengths, weaknesses and persists.
8. Report check: read-only report displays final code and evaluation stats/progress accurately.
9. Global loading check: progress indicator appears for all active HTTP calls and clears after completion.
10. Guard check: unauthenticated users cannot access dashboard/interview/report routes; returnUrl redirect works.
11. Theme check: light, dark, retro, nord persist across refresh.

**Decisions**
- Auto-save strategy fixed to debounceTime(800) with PATCH updates.
- Save UX fixed to DaisyUI badge states Saving... and Saved.
- Response contract fixed to success, message, data optional.
- Included scope: single-user interview lifecycle with AI hint and final evaluation report.
- Excluded scope: collaborative realtime editing and socket synchronization.

**Further Considerations**
1. AI abstraction: use provider adapter pattern to switch OpenAI and Gemini by environment setting without frontend changes.
2. Evaluation storage: persist both normalized summary and raw provider payload for prompt iteration and audit.
3. Save conflict strategy: keep last-write-wins for this release, reserve versioned conflict resolution for a later iteration.
