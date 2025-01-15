-- Migration number: 0001 	 2024-09-30T11:13:11.540Z
create table user_profiles(
  -- Id is foreign key to users table
  id TEXT primary key,
  email TEXT not null unique,
  full_name TEXT NOT NULL,
  profile_image TEXT,
  locale_id INTEGER not null
);
