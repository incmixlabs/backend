-- Migration number: 0002 	 2025-01-08T10:18:57.826Z
CREATE TABLE schema_meta (
  id INTEGER PRIMARY KEY,
  version INTEGER,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO
  schema_meta (version)
VALUES
  (1);
