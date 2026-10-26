CREATE DATABASE IF NOT EXISTS bookanartist;
USE bookanartist;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('artist','client') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artists (
  user_id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  artist_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  status ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
  amount DECIMAL(10,2) NOT NULL,
  event_start DATETIME NOT NULL,
  event_end DATETIME NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES artists(user_id),
  FOREIGN KEY (client_id) REFERENCES users(id),
  INDEX idx_artist_status_time (artist_id, status, event_start, event_end)
);

-- Used by the leaderboard query (Task A). The API's review endpoint reads from MongoDB.
CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  booking_id INT UNSIGNED NOT NULL UNIQUE,
  artist_id CHAR(36) NOT NULL,
  score TINYINT UNSIGNED NOT NULL,
  comment TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (artist_id) REFERENCES artists(user_id),
  INDEX idx_artist_created_score (artist_id, created_at, score)
);