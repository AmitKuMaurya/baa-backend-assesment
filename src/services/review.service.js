const db = require("../config/mysql");
const Review = require("../models/Review");
const AppError = require("../utils/AppError");

exports.getArtistReviews = async (artistId, page, limit) => {
  const [artist] = await db.execute(
    "SELECT user_id FROM artists WHERE user_id = ?",
    [artistId]
  );
  if (!artist[0]) throw new AppError(404, "Artist not found");

  // Only reviews tied to completed bookings (MySQL is the source of truth)
  const [done] = await db.execute(
    "SELECT id FROM bookings WHERE artist_id = ? AND status = 'completed'",
    [artistId]
  );
  const bookingIds = done.map((r) => r.id);

  const [result] = await Review.aggregate([
    { $match: { artist_id: artistId, booking_id: { $in: bookingIds } } },
    {
      $facet: {
        summary: [{ $group: { _id: null, avg: { $avg: "$score" }, count: { $sum: 1 } } }],
        distribution: [{ $group: { _id: "$score", n: { $sum: 1 } } }],
        items: [
          { $sort: { created_at: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ],
      },
    },
  ]);

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result.distribution.forEach((d) => { dist[d._id] = d.n; });
  const s = result.summary[0];

  return {
    summary: {
      average_score: s ? Number(s.avg.toFixed(2)) : 0,
      total_count: s ? s.count : 0,
      distribution: dist,
    },
    reviews: result.items,
    pagination: { page, limit, total: s ? s.count : 0 },
  };
};