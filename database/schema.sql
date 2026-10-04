CREATE DATABASE IF NOT EXISTS campusconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE campusconnect;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'STUDENT',
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_user_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS elections (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description VARCHAR(1200) NOT NULL,
  category VARCHAR(40) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  created_by BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_election_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidates (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  election_id BIGINT NOT NULL,
  name VARCHAR(120) NOT NULL,
  platform VARCHAR(1000),
  INDEX idx_candidates_election (election_id),
  CONSTRAINT fk_candidate_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS votes (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  election_id BIGINT NOT NULL,
  candidate_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  election_category VARCHAR(40) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_vote_election_user UNIQUE (election_id, user_id),
  CONSTRAINT uk_vote_category_user UNIQUE (election_category, user_id),
  CONSTRAINT fk_vote_election FOREIGN KEY (election_id) REFERENCES elections(id),
  CONSTRAINT fk_vote_candidate FOREIGN KEY (candidate_id) REFERENCES candidates(id),
  CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suggestions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  content VARCHAR(1200) NOT NULL,
  author_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNDER_REVIEW',
  created_at DATETIME(6) NOT NULL,
  INDEX idx_suggestions_created (created_at),
  CONSTRAINT fk_suggestion_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS suggestion_reactions (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  suggestion_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  liked BOOLEAN NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT uk_reaction_suggestion_user UNIQUE (suggestion_id, user_id),
  CONSTRAINT fk_reaction_suggestion FOREIGN KEY (suggestion_id) REFERENCES suggestions(id) ON DELETE CASCADE,
  CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS complaints (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  author_id BIGINT NOT NULL,
  subject VARCHAR(180) NOT NULL,
  description VARCHAR(3000) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNDER_REVIEW',
  created_at DATETIME(6) NOT NULL,
  INDEX idx_complaints_created (created_at),
  CONSTRAINT fk_complaint_author FOREIGN KEY (author_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campus_events (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  description VARCHAR(1200) NOT NULL,
  location VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  starts_at DATETIME(6) NOT NULL,
  created_by BIGINT NOT NULL,
  INDEX idx_events_start (starts_at),
  CONSTRAINT fk_event_creator FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB;
