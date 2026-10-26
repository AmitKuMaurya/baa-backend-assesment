const router = require("express").Router();
const c = require("../controllers/artist.controller");

router.get("/:id/reviews", c.reviews);
module.exports = router;
