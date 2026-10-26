const request = require("supertest");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const app = require("../src/app");
const db = require("../src/config/mysql");
const { jwtSecret } = require("../src/config/env");

let artistId, clientId, bookingId, token;

beforeAll(async () => {
  artistId = randomUUID();
  clientId = randomUUID();

  await db.execute(
    "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, 'x', 'artist')",
    [artistId, `t_a_${artistId}@test.com`]
  );
  await db.execute(
    "INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, 'x', 'client')",
    [clientId, `t_c_${clientId}@test.com`]
  );
  await db.execute(
    "INSERT INTO artists (user_id, name, category, hourly_rate) VALUES (?, 'Test', 'DJ', 100)",
    [artistId]
  );
  const [b] = await db.execute(
    `INSERT INTO bookings (artist_id, client_id, status, amount, event_start, event_end)
     VALUES (?, ?, 'pending', 100, NOW() + INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY)`,
    [artistId, clientId]
  );
  bookingId = b.insertId;

  // Works whether auth.js reads payload.sub or payload.userId
  token = jwt.sign({ sub: artistId, userId: artistId, role: "artist" }, jwtSecret);
});

afterAll(async () => {
  await db.query("SET FOREIGN_KEY_CHECKS=0");
  await db.execute("DELETE FROM bookings WHERE id = ?", [bookingId]);
  await db.execute("DELETE FROM artists WHERE user_id = ?", [artistId]);
  await db.execute("DELETE FROM users WHERE id IN (?, ?)", [artistId, clientId]);
  await db.query("SET FOREIGN_KEY_CHECKS=1");
  await db.end();
});

describe("PATCH /bookings/:id/status", () => {
  it("returns 422 with an error message for an invalid transition (pending -> completed)", async () => {
    const res = await request(app)
      .patch(`/bookings/${bookingId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid transition/i);
  });
});