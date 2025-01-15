-- Migration number: 0001 	 2024-09-20T10:17:28.133Z
create table email_queue (
  id integer primary key,
  recipient text not null,
  template text not null,
  payload text not null,
  status text CHECK(status IN ("pending", "delivered", "failed")) not null default "pending",
  sendgrid_data text
);
