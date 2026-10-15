# College Attendance Frontend

React + Vite frontend for the College Attendance MVP backend.

## Run

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and adjust `VITE_API_BASE_URL` if required.

3. Start the development server:

```bash
npm run dev
```

The default frontend URL is `http://localhost:5173`.

## Backend

The UI expects the backend at:

`http://localhost:4000/api`

The frontend uses:
- JWT access tokens in localStorage
- the backend HTTP-only refresh-token cookie
- `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/logout`
- academic year and calendar endpoints
- standards, subjects, students and absence-type CRUD endpoints
- attendance session endpoints
- attendance correction endpoint
- report endpoints

Some backend modules in the current MVP are deliberately scaffolded and return HTTP 501. Their frontend pages are included as shells so they can be connected when those services are implemented.

## Structure

```text
src/
├── api/
├── components/
├── context/
├── pages/
├── utils/
├── App.jsx
├── main.jsx
└── styles.css
```

## Permission-driven UI

- Menus come from `src/shared/access/navigation.js`; an item is shown only if the user holds
  one of its permissions.
- Routes are wrapped in `RequirePermission` (see `src/App.jsx`); buttons use
  `useAuth().hasPermission(...)` / `<Can>`.
- New pages: **Users** (`/users`) and **Roles & Permissions** (`/roles`) with a grouped
  permission picker that adds required read access automatically.
- The user's permissions are re-read whenever the browser tab regains focus, so changes made
  by an administrator show up without a re-login (the API enforces them immediately).
