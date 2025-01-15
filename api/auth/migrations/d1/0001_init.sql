-- Migration number: 0001 	 2024-10-01T10:19:18.177Z
create table users (
  id TEXT not null primary key,
  email TEXT not null unique,
  hashed_password TEXT,
  email_verified boolean default false,
  last_loggedin DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_type TEXT CHECK(user_type IN ("super_admin", "member", "user")) not null default "user"
);

create table sessions (
  id TEXT not null primary key,
  expires_at INTEGER not null,
  user_id TEXT not null
);

create table verification_codes (
  id INTEGER not null primary key,
  email TEXT,
  user_id TEXT unique,
  code TEXT,
  expires_at TEXT,
  description TEXT
);

CREATE TABLE accounts (
  account_id TEXT,
  provider TEXT,
  user_id INTEGER,
  PRIMARY KEY (account_id, user_id)
);
