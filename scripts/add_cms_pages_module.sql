-- CMS pages: Terms, About Us, Privacy Policy (fetch by slug)

CREATE TABLE IF NOT EXISTS cms_pages (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(80)     NOT NULL,
  title       VARCHAR(200)    NOT NULL,
  content     LONGTEXT        NULL,
  is_active   TINYINT(1)      NOT NULL DEFAULT 1,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cms_pages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO cms_pages (slug, title, content, is_active) VALUES
  ('terms-conditions', 'Terms & Conditions', '', 1),
  ('about-us',         'About Us',           '', 1),
  ('privacy-policy',   'Privacy Policy',     '', 1);
