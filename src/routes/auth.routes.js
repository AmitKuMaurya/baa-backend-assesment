const router = require("express").Router();
const c = require("../controllers/auth.controller");

router.post("/login", c.login);
module.exports = router;
