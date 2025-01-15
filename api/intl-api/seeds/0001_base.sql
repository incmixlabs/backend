-- select
--   *
-- from
--   translations;
DELETE FROM
  locales;

delete from
  SQLITE_SEQUENCE
where
  name = 'locales';

delete from
  SQLITE_SEQUENCE
where
  name = 'translations';

insert into
  locales(id, lang_code, is_default)
values
  (1, "en", 1),
  (2, "pt", 0);