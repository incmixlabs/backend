create type TIMESTAMPS as (
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

create type CREATED_BY_UPDATED_BY as (created_by TEXT, updated_by TEXT);