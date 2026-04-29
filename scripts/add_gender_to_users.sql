ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gender ENUM('male', 'female', 'other') NULL AFTER phone;
