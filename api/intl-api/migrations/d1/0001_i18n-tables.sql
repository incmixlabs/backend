create table locales (
  id INTEGER primary key,
  lang_code TEXT not null unique,
  is_default BOOLEAN default false
);

create table translations (
  id INTEGER not null primary key,
  locale_id INTEGER not null,
  key TEXT not null,
  value TEXT not null,
  type TEXT CHECK(type IN ("frag", "label")) not null default "label"
);
