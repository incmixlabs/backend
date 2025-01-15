-- Migration number: 0004 	 2024-12-27T10:23:16.428Z
alter table
  organisations
add
  column handle text not null;

create unique index uniq_handle ON organisations(handle);