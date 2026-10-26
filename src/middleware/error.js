const { fail } = require("../utils/response");

exports.notFound = (req, res) => fail(res, 404, "Route not found");

// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, next) => {
  if (!err.status) console.error(err);
  fail(res, err.status || 500, err.status ? err.message : "Internal server error");
};
