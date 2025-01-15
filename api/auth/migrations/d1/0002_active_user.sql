-- Migration number: 0002 	 2024-12-26T10:19:18.177Z
alter table
  users
add
  column is_active boolean default true;