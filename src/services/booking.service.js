const db = require("../config/mysql");
const AppError = require("../utils/AppError");

const TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

exports.TRANSITIONS = TRANSITIONS;

exports.createBooking = async (clientId, { artist_id, event_start, event_end, notes }) => {
  const start = new Date(event_start);
  const end = new Date(event_end);

  if (typeof artist_id !== "string") throw new AppError(400, "artist_id must be a string (user id)");
  if (isNaN(start) || isNaN(end)) throw new AppError(400, "event_start and event_end must be valid ISO dates");
  if (typeof notes !== "string") throw new AppError(400, "notes is required");
  if (end <= start) throw new AppError(400, "event_end must be after event_start");
  if (start <= new Date()) throw new AppError(400, "event_start cannot be in the past");

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Lock the artist row so two concurrent requests cannot both pass the overlap check
    const [artists] = await conn.execute(
      "SELECT user_id, hourly_rate FROM artists WHERE user_id = ? FOR UPDATE",
      [artist_id]
    );
    if (!artists[0]) throw new AppError(404, "Artist not found");

    const [clash] = await conn.execute(
      `SELECT id FROM bookings
       WHERE artist_id = ? AND status = 'confirmed'
         AND event_start < ? AND event_end > ?
       LIMIT 1`,
      [artist_id, end, start]
    );
    if (clash[0]) throw new AppError(409, "Artist already has a confirmed booking in this time window");

    const hours = (end - start) / 36e5;

    const [duplicate] = await conn.execute(
      `SELECT id FROM bookings
       WHERE artist_id = ? AND client_id = ?
         AND status IN ('pending', 'confirmed', 'in_progress')
         AND event_start < ? AND event_end > ?
       LIMIT 1`,
      [artist_id, clientId, end, start]
    );

    if (duplicate[0]) {
      throw new AppError(409, "You already have an active booking request for this artist in this time window");
    }

    const amount = Number((hours * Number(artists[0].hourly_rate)).toFixed(2));

    const [result] = await conn.execute(
      `INSERT INTO bookings (artist_id, client_id, status, amount, event_start, event_end, notes)
       VALUES (?, ?, 'pending', ?, ?, ?, ?)`,
      [artist_id, clientId, amount, start, end, notes]
    );
    await conn.commit();

    return {
      id: result.insertId, artist_id, client_id: clientId, status: "pending",
      amount, event_start: start, event_end: end, notes,
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.updateStatus = async (bookingId, user, newStatus) => {
  if (Number.isNaN(bookingId)) throw new AppError(400, "Invalid booking id");
  if (!Object.keys(TRANSITIONS).includes(newStatus)) {
    throw new AppError(400, `status must be one of: ${Object.keys(TRANSITIONS).join(", ")}`);
  }

  const [rows] = await db.execute(
    "SELECT id, status, client_id, artist_id, event_start, event_end FROM bookings WHERE id = ?",
    [bookingId]
  );
  const booking = rows[0];
  if (!booking) throw new AppError(404, "Booking not found");

  // Ownership
  const isArtistOwner = user.role === "artist" && booking.artist_id === user.id;
  const isClientOwner = user.role === "client" && booking.client_id === user.id;
  if (!isArtistOwner && !isClientOwner) throw new AppError(403, "You do not have access to this booking");

  // Role rule: client can only cancel
  if (isClientOwner && newStatus !== "cancelled") {
    throw new AppError(403, "Clients can only cancel bookings");
  }

  // State machine
  if (!TRANSITIONS[booking.status].includes(newStatus)) {
    throw new AppError(422, `Invalid transition: ${booking.status} -> ${newStatus}`);
  }

  // Time rules
  const now = new Date();
  if (newStatus === "in_progress" && now < new Date(booking.event_start)) {
    throw new AppError(422, "Cannot start the event before its start time");
  }
  if (newStatus === "completed" && now < new Date(booking.event_end)) {
    throw new AppError(422, "Cannot complete the event before its end time");
  }

  // Conditional update guards against a concurrent status change
  const [result] = await db.execute(
    "UPDATE bookings SET status = ? WHERE id = ? AND status = ?",
    [newStatus, bookingId, booking.status]
  );
  if (!result.affectedRows) throw new AppError(409, "Booking status changed, please retry");

  return { id: bookingId, status: newStatus };
};