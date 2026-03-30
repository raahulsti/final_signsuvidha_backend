-- Generic image assets module
-- Supports current types (wallpaper/base/frame/pylon) and future types via image_type string.

CREATE TABLE IF NOT EXISTS image_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_type_id INT UNSIGNED NOT NULL,
  image_type VARCHAR(50) NOT NULL,
  title VARCHAR(150) DEFAULT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_image_assets_product_type (product_type_id),
  KEY idx_image_assets_type (image_type),
  KEY idx_image_assets_active (is_active),
  KEY idx_image_assets_type_product (image_type, product_type_id),
  CONSTRAINT fk_image_assets_product_type
    FOREIGN KEY (product_type_id) REFERENCES product_types(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample rows (adjust product_type_id based on your DB values)
INSERT INTO image_assets
  (product_type_id, image_type, title, image_url, thumbnail_url, sort_order, is_active)
VALUES
  (1, 'wallpaper', 'Matte Brick Texture', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/wallpaper-1.jpg', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/wallpaper-1-thumb.jpg', 1, 1),
  (1, 'base', 'Acrylic Base Blue', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/base-1.jpg', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/base-1-thumb.jpg', 2, 1),
  (2, 'frame', 'Golden Frame Classic', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/frame-1.jpg', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/frame-1-thumb.jpg', 1, 1),
  (3, 'pylon', 'Outdoor Pylon Sample', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/pylon-1.jpg', 'https://example-bucket.s3.ap-south-1.amazonaws.com/image-assets/pylon-1-thumb.jpg', 1, 1);
