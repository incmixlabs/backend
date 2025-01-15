-- Migration number: 0002 	 2024-09-18T07:22:00.917Z
alter table
  translations
add
  namespace text;
