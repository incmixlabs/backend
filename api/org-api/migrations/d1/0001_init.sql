-- Migration number: 0001 	 2024-09-30T10:10:25.400Z
create table roles (
  id INTEGER primary key,
  name TEXT CHECK(
    name IN (
      'admin',
      'owner',
      'viewer',
      'editor',
      'commenter'
    )
  ) not null unique
);

create table permissions (
  id INTEGER primary key,
  role_id INTEGER not null,
  action TEXT not null,
  subject TEXT not null,
  conditions TEXT
);

create table organisations (
  id TEXT not null primary key,
  name TEXT not null unique
);

create table members (
  user_id TEXT not null,
  org_id TEXT not null,
  role_id INTEGER not null,
  primary key (user_id, org_id)
);
