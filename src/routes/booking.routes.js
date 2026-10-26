const router = require("express").Router();
const c = require("../controllers/booking.controller");
const { authenticate, requireRole } = require("../middleware/auth");

router.post("/", authenticate, requireRole("client"), c.create);
router.patch("/:id/status", authenticate, c.updateStatus);
module.exports = router;
