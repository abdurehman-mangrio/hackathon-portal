# Hackathon Portal

## Description
Full-stack hackathon platform with frontend (React/Vite) and backend (Node.js).

## Features
- User registration
- Hackathon registration
- Challenges
- Leaderboard
- File uploads
- WebSocket real-time

## Tech Stack
- Frontend: React, Vite
- Backend: Node.js, Express
- Database: (see `backend/models`)
- Websocket

## Installation
Frontend:
```bash
cd frontend
npm install
npm run dev
```

Backend:
```bash
cd backend
npm install
npm start
```

## Demo / Admin Credentials

### Create the admin user (one-time seed)
This project includes a script to create an admin user in the database and prints the generated password to your terminal.

```bash
cd backend
npm install
npm run create-admin
```

**Demo admin login:**
- **Email:** `admin@hackathon.com`
- **Username:** `admin`
- **Password:** printed in the console output when you run `npm run create-admin`

> ⚠️ The script generates a **temporary random password** each time it runs (only if an admin user does not already exist). Save the password from the output.

### Notes for deployed environments (Vercel)
- The admin user is stored in the **database** (see backend DB config).
- After deployment, run the same seed command in the deployment environment/once-per-environment so the admin account exists in that environment.

## License
MIT
