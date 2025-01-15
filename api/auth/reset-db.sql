delete from
  verification_codes;

delete from
  SQLITE_SEQUENCE
where
  name = 'verification_codes';

delete from
  sessions;
