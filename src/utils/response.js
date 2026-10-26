exports.ok = (res, data = {}, status = 200) =>
  res.status(status).json({ success: true, data });

exports.fail = (res, status, message) =>
  res.status(status).json({ success: false, error: message });
