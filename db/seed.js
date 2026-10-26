const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const mongoose = require("mongoose");
const cfg = require("../src/config/env");
const Review = require("../src/models/Review");

(async () => {
  const { database, ...conn } = cfg.mysql;
  const db = await mysql.createConnection({ ...conn, multipleStatements: true });
  await db.query(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));
  await db.query(`USE ${database}`);
  await db.query("SET FOREIGN_KEY_CHECKS=0");
  for (const t of ["reviews", "bookings", "artists", "users"]) await db.query(`TRUNCATE ${t}`);
  await db.query("SET FOREIGN_KEY_CHECKS=1");

  const hash = await bcrypt.hash("Password123!", 10);
  const artist1 = randomUUID(), artist2 = randomUUID(), client = randomUUID();

  await db.query(
    `INSERT INTO users (id, email, password_hash, role) VALUES
     (?, 'artist1@test.com', ?, 'artist'),
     (?, 'artist2@test.com', ?, 'artist'),
     (?, 'client@test.com', ?, 'client')`,
    [artist1, hash, artist2, hash, client, hash]
  );
  await db.query(
    `INSERT INTO artists (user_id, name, category, hourly_rate) VALUES
     (?, 'Aria Singh', 'Singer', 5000), (?, 'DJ Kabir', 'DJ', 8000)`,
    [artist1, artist2]
  );

  const day = 864e5;
  const past = (d) => new Date(Date.now() - d * day);
  const future = new Date(Date.now() + 7 * day);
  await db.query(
    `INSERT INTO bookings (artist_id, client_id, status, amount, event_start, event_end) VALUES
     (?, ?, 'completed', 10000, ?, ?),
     (?, ?, 'completed', 10000, ?, ?),
     (?, ?, 'pending', 16000, ?, ?)`,
    [
      artist1, client, past(10), past(10),
      artist1, client, past(5), past(5),
      artist2, client, future, new Date(future.getTime() + 2 * 36e5),
    ]
  );
  await db.query(
    `INSERT INTO reviews (booking_id, artist_id, score, comment, created_at) VALUES
     (1, ?, 5, 'Amazing', ?), (2, ?, 4, 'Great', ?)`,
    [artist1, past(9), artist1, past(4)]
  );

  await mongoose.connect(cfg.mongoUri);
  await Review.deleteMany({});
  await Review.insertMany([
    { booking_id: 1, artist_id: artist1, client_id: client, score: 5, comment: "Amazing", created_at: past(9) },
    { booking_id: 2, artist_id: artist1, client_id: client, score: 4, comment: "Great", created_at: past(4) },
  ]);

  console.log("Seeded. Artist 1 id (use in /artists/:id/reviews):", artist1);
  console.log("Logins: artist1@test.com / client@test.com, password Password123!");
  await db.end();
  await mongoose.disconnect();
})();