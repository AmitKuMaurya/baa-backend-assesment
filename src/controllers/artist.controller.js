const service = require("../services/review.service");
const { ok } = require("../utils/response");

exports.reviews = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    ok(res, await service.getArtistReviews(req.params.id, page, limit));
  } catch (e) { next(e); }
};