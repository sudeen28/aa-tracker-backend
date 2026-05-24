# ✈ AA Tracker — Backend API

Node.js + Express + Prisma + Neon PostgreSQL

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/booking/:pnr` | Lookup booking by PNR |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/setup` | Create first super admin (one-time) |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/register` | Create new admin (super admin only) |
| GET | `/api/auth/users` | List all users (super admin only) |
| DELETE | `/api/auth/users/:id` | Delete a user (super admin only) |
| PATCH | `/api/auth/change-password` | Change your password |

### Admin (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | List all bookings |
| GET | `/api/admin/bookings/:id` | Get single booking |
| POST | `/api/admin/bookings` | Create new booking |
| PUT | `/api/admin/bookings/:id` | Update booking |
| DELETE | `/api/admin/bookings/:id` | Delete booking |

---

## Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in your Neon DB connection string and a JWT secret.

### 3. Push schema to Neon DB
```bash
npm run db:push
```

### 4. Start dev server
```bash
npm run dev
```
API runs at `http://localhost:4000`

### 5. Create your first super admin account
```bash
curl -X POST http://localhost:4000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"you@email.com","password":"yourpassword"}'
```
This only works once — when no users exist in the DB.

---

## Deploy to Render

1. Push this folder to a GitHub repo
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo
4. Set these:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push`
   - **Start Command:** `npm start`
5. Add environment variables (DATABASE_URL, JWT_SECRET, FRONTEND_URL)
6. Deploy

---

## Create a Booking (example)

```bash
# 1. Login
curl -X POST https://your-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@email.com","password":"yourpassword"}'

# Copy the token from the response

# 2. Create booking
curl -X POST https://your-api.onrender.com/api/admin/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "passenger": {
      "title": "MR",
      "firstName": "James",
      "lastName": "Mitchell",
      "frequentFlyer": "AA-9284710",
      "passport": "***4821"
    },
    "segments": [
      {
        "flightNumber": "AA 0081",
        "aircraft": "Boeing 777-300ER",
        "fromCode": "LOS", "fromCity": "Lagos",
        "fromTerminal": "Terminal 2", "fromGate": "G14",
        "fromLat": 6.5774, "fromLng": 3.3212,
        "toCode": "LHR", "toCity": "London Heathrow",
        "toTerminal": "Terminal 3", "toGate": "B22",
        "toLat": 51.470, "toLng": -0.4543,
        "departsDate": "Jun 14, 2026", "departsTime": "23:45",
        "arrivesDate": "Jun 15, 2026", "arrivesTime": "06:30",
        "duration": "6h 45m",
        "seat": "14A", "cabinClass": "Economy", "meal": "Dinner + Breakfast"
      }
    ],
    "fare": {
      "basis": "YLOWUS", "cabinClass": "Economy (N)",
      "ticketFare": "USD 842.00", "fuelSurcharge": "USD 312.40",
      "taxes": "USD 98.60", "serviceCharge": "USD 24.00",
      "aviationLevy": "USD 18.50", "total": "USD 1,295.50",
      "payment": "CREDIT CARD ·············7842",
      "purchaseDate": "May 18, 2026"
    },
    "baggage": {
      "personal": "1 personal item",
      "carryOn": "1 x 10kg",
      "checked": "1 x 23kg"
    }
  }'
```

The API returns the generated PNR — share that with your passenger.
