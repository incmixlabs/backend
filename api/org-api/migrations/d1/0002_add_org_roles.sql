-- Migration number: 0010 	 2024-09-06T05:44:38.821Z
INSERT INTO
  roles (id, name)
VALUES
  (1, 'admin'),
  (2, 'owner'),
  (3, 'viewer'),
  (4, 'editor'),
  (5, 'commenter');