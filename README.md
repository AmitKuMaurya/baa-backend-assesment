# BookAnArtist API

Node.js + Express backend. JWT auth, MySQL (users, artists, bookings), MongoDB (reviews), Jest + Supertest.

## Run locally

Needs Node 18+, MySQL 8, MongoDB 4.2+ running locally.

```bash
npm install
cp .env.example .env     # set MYSQL_PASSWORD and JWT_SECRET
npm run seed             # schema + sample data; prints the first artist's UUID
npm start                # http://localhost:3000
npm test
```

Seed logins (password `Password123!`): `artist1@test.com`, `artist2@test.com`, `client@test.com`. No signup endpoint; users come from the seed.

## Endpoints

All responses: `{ success, data }` or `{ success: false, error }`.

**Login** (same 401 for wrong email or password)
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"Password123!"}'
```

**Create booking** (client token). Rejects a past start, an overlap with a confirmed booking (409) and a duplicate active request (409). Starts as `pending`.
```bash
curl -X POST http://localhost:3000/bookings \
  -H "Authorization: Bearer <CLIENT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"artist_id":"<ARTIST_UUID>","event_start":"2026-12-01T18:00:00Z","event_end":"2026-12-01T21:00:00Z","notes":"Wedding"}'
```

**Update status** (booking owner). 422 on an invalid move, clients can only cancel, and `in_progress` / `completed` only after the event start / end.
```bash
curl -X PATCH http://localhost:3000/bookings/<BOOKING_ID>/status \
  -H "Authorization: Bearer <ARTIST_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'
```

**Artist reviews** (public). Completed bookings only, with average, total, 1-5 distribution, pagination, newest first.
```bash
curl "http://localhost:3000/artists/<ARTIST_UUID>/reviews?page=1&limit=10"
```

## Decisions

- **One UUID per person**, used in the JWT and every table. `artists` is a profile table keyed by `users.id`, and bookings hold `artist_id` and `client_id`.
- **Double-booking safe:** booking creation runs in a transaction with `SELECT ... FOR UPDATE` on the artist row.
- **Reviews in MongoDB;** "completed only" is enforced by checking booking ids against MySQL. A MySQL `reviews` table exists for the leaderboard SQL (`TASK3.md`).
- **Prepared statements** everywhere (`execute` with `?`).

## Next steps

Check for clashes when an artist confirms a booking, add schema validation and login rate limiting, and add tests for booking creation and role rules.