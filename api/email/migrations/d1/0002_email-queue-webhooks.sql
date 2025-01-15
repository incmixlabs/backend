-- Migration number: 0002 	 2024-09-25T11:48:08.420Z
alter table
  email_queue
add
  column sg_id text;

alter table
  email_queue
add
  column should_retry boolean default false;
