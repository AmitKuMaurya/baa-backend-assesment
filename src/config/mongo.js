const mongoose = require("mongoose");
const { mongoUri } = require("./env");

module.exports = () => mongoose.connect(mongoUri);
