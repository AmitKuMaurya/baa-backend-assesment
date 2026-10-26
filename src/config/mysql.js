const mysql = require("mysql2/promise");
const { mysql: cfg } = require("./env");

module.exports = mysql.createPool({
  ...cfg,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "Z", // store/read everything as UTC
});
