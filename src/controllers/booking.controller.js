const service = require("../services/booking.service");
const { ok } = require("../utils/response");

exports.create = async (req, res, next) => {
  try {
    ok(res, await service.createBooking(req.user.id, req.body), 201);
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    ok(res, await service.updateStatus(Number(req.params.id), req.user, req.body.status));
  } catch (e) { next(e); }
};
