require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "dev_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1h",
  mysql: {
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "amit@MySql$69",
    database: process.env.MYSQL_DATABASE || "bookanartist",
  },
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bookanartist?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.8.2",
};