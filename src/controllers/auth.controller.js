const service = require("../services/auth.service");
const { ok } = require("../utils/response");

exports.login = async (req, res, next) => {
  try {
    ok(res, await service.login(req.body.email, req.body.password));
  } catch (e) { next(e); }
};
