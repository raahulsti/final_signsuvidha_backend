-- States & cities master for address dropdowns
-- Run once on live DB. Safe to re-run (CREATE IF NOT EXISTS + idempotent ALTER).

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS states (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(10) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_states_code (code),
  UNIQUE KEY uq_states_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  state_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cities_state_id (state_id),
  UNIQUE KEY uq_cities_state_name (state_id, name),
  CONSTRAINT fk_cities_state FOREIGN KEY (state_id) REFERENCES states (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'customer_addresses' AND COLUMN_NAME = 'state_id') = 0,
  'ALTER TABLE customer_addresses
   ADD COLUMN state_id BIGINT UNSIGNED NULL AFTER state,
   ADD COLUMN city_id BIGINT UNSIGNED NULL AFTER state_id,
   ADD KEY idx_customer_addresses_state_id (state_id),
   ADD KEY idx_customer_addresses_city_id (city_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Seed states (India — 28 states + 8 UTs)
INSERT IGNORE INTO states (name, code, sort_order) VALUES
('Andhra Pradesh', 'AP', 1),
('Arunachal Pradesh', 'AR', 2),
('Assam', 'AS', 3),
('Bihar', 'BR', 4),
('Chhattisgarh', 'CG', 5),
('Goa', 'GA', 6),
('Gujarat', 'GJ', 7),
('Haryana', 'HR', 8),
('Himachal Pradesh', 'HP', 9),
('Jharkhand', 'JH', 10),
('Karnataka', 'KA', 11),
('Kerala', 'KL', 12),
('Madhya Pradesh', 'MP', 13),
('Maharashtra', 'MH', 14),
('Manipur', 'MN', 15),
('Meghalaya', 'ML', 16),
('Mizoram', 'MZ', 17),
('Nagaland', 'NL', 18),
('Odisha', 'OD', 19),
('Punjab', 'PB', 20),
('Rajasthan', 'RJ', 21),
('Sikkim', 'SK', 22),
('Tamil Nadu', 'TN', 23),
('Telangana', 'TG', 24),
('Tripura', 'TR', 25),
('Uttar Pradesh', 'UP', 26),
('Uttarakhand', 'UK', 27),
('West Bengal', 'WB', 28),
('Andaman and Nicobar Islands', 'AN', 29),
('Chandigarh', 'CH', 30),
('Dadra and Nagar Haveli and Daman and Diu', 'DD', 31),
('Delhi', 'DL', 32),
('Jammu and Kashmir', 'JK', 33),
('Ladakh', 'LA', 34),
('Lakshadweep', 'LD', 35),
('Puducherry', 'PY', 36);

-- Seed cities (major cities per state/UT)
INSERT IGNORE INTO cities (state_id, name, sort_order)
SELECT s.id, v.city_name, v.sort_order
FROM (
  SELECT 'AP' AS code, 'Visakhapatnam' AS city_name, 1 AS sort_order UNION ALL
  SELECT 'AP', 'Vijayawada', 2 UNION ALL
  SELECT 'AP', 'Guntur', 3 UNION ALL
  SELECT 'AP', 'Tirupati', 4 UNION ALL
  SELECT 'AP', 'Amaravati', 5 UNION ALL
  SELECT 'AR', 'Itanagar', 1 UNION ALL
  SELECT 'AR', 'Tawang', 2 UNION ALL
  SELECT 'AS', 'Guwahati', 1 UNION ALL
  SELECT 'AS', 'Dibrugarh', 2 UNION ALL
  SELECT 'AS', 'Silchar', 3 UNION ALL
  SELECT 'AS', 'Jorhat', 4 UNION ALL
  SELECT 'BR', 'Patna', 1 UNION ALL
  SELECT 'BR', 'Gaya', 2 UNION ALL
  SELECT 'BR', 'Muzaffarpur', 3 UNION ALL
  SELECT 'BR', 'Bhagalpur', 4 UNION ALL
  SELECT 'CG', 'Raipur', 1 UNION ALL
  SELECT 'CG', 'Bhilai', 2 UNION ALL
  SELECT 'CG', 'Bilaspur', 3 UNION ALL
  SELECT 'GA', 'Panaji', 1 UNION ALL
  SELECT 'GA', 'Margao', 2 UNION ALL
  SELECT 'GA', 'Vasco da Gama', 3 UNION ALL
  SELECT 'GJ', 'Ahmedabad', 1 UNION ALL
  SELECT 'GJ', 'Surat', 2 UNION ALL
  SELECT 'GJ', 'Vadodara', 3 UNION ALL
  SELECT 'GJ', 'Rajkot', 4 UNION ALL
  SELECT 'GJ', 'Gandhinagar', 5 UNION ALL
  SELECT 'HR', 'Gurugram', 1 UNION ALL
  SELECT 'HR', 'Faridabad', 2 UNION ALL
  SELECT 'HR', 'Panipat', 3 UNION ALL
  SELECT 'HR', 'Ambala', 4 UNION ALL
  SELECT 'HP', 'Shimla', 1 UNION ALL
  SELECT 'HP', 'Dharamshala', 2 UNION ALL
  SELECT 'HP', 'Manali', 3 UNION ALL
  SELECT 'JH', 'Ranchi', 1 UNION ALL
  SELECT 'JH', 'Jamshedpur', 2 UNION ALL
  SELECT 'JH', 'Dhanbad', 3 UNION ALL
  SELECT 'KA', 'Bengaluru', 1 UNION ALL
  SELECT 'KA', 'Mysuru', 2 UNION ALL
  SELECT 'KA', 'Mangaluru', 3 UNION ALL
  SELECT 'KA', 'Hubballi', 4 UNION ALL
  SELECT 'KL', 'Thiruvananthapuram', 1 UNION ALL
  SELECT 'KL', 'Kochi', 2 UNION ALL
  SELECT 'KL', 'Kozhikode', 3 UNION ALL
  SELECT 'KL', 'Thrissur', 4 UNION ALL
  SELECT 'MP', 'Bhopal', 1 UNION ALL
  SELECT 'MP', 'Indore', 2 UNION ALL
  SELECT 'MP', 'Gwalior', 3 UNION ALL
  SELECT 'MP', 'Jabalpur', 4 UNION ALL
  SELECT 'MH', 'Mumbai', 1 UNION ALL
  SELECT 'MH', 'Pune', 2 UNION ALL
  SELECT 'MH', 'Nagpur', 3 UNION ALL
  SELECT 'MH', 'Nashik', 4 UNION ALL
  SELECT 'MH', 'Thane', 5 UNION ALL
  SELECT 'MH', 'Aurangabad', 6 UNION ALL
  SELECT 'MN', 'Imphal', 1 UNION ALL
  SELECT 'ML', 'Shillong', 1 UNION ALL
  SELECT 'ML', 'Tura', 2 UNION ALL
  SELECT 'MZ', 'Aizawl', 1 UNION ALL
  SELECT 'NL', 'Kohima', 1 UNION ALL
  SELECT 'NL', 'Dimapur', 2 UNION ALL
  SELECT 'OD', 'Bhubaneswar', 1 UNION ALL
  SELECT 'OD', 'Cuttack', 2 UNION ALL
  SELECT 'OD', 'Rourkela', 3 UNION ALL
  SELECT 'PB', 'Chandigarh', 1 UNION ALL
  SELECT 'PB', 'Ludhiana', 2 UNION ALL
  SELECT 'PB', 'Amritsar', 3 UNION ALL
  SELECT 'PB', 'Jalandhar', 4 UNION ALL
  SELECT 'RJ', 'Jaipur', 1 UNION ALL
  SELECT 'RJ', 'Jodhpur', 2 UNION ALL
  SELECT 'RJ', 'Udaipur', 3 UNION ALL
  SELECT 'RJ', 'Kota', 4 UNION ALL
  SELECT 'SK', 'Gangtok', 1 UNION ALL
  SELECT 'TN', 'Chennai', 1 UNION ALL
  SELECT 'TN', 'Coimbatore', 2 UNION ALL
  SELECT 'TN', 'Madurai', 3 UNION ALL
  SELECT 'TN', 'Tiruchirappalli', 4 UNION ALL
  SELECT 'TG', 'Hyderabad', 1 UNION ALL
  SELECT 'TG', 'Warangal', 2 UNION ALL
  SELECT 'TG', 'Nizamabad', 3 UNION ALL
  SELECT 'TR', 'Agartala', 1 UNION ALL
  SELECT 'UP', 'Lucknow', 1 UNION ALL
  SELECT 'UP', 'Kanpur', 2 UNION ALL
  SELECT 'UP', 'Noida', 3 UNION ALL
  SELECT 'UP', 'Ghaziabad', 4 UNION ALL
  SELECT 'UP', 'Agra', 5 UNION ALL
  SELECT 'UP', 'Varanasi', 6 UNION ALL
  SELECT 'UK', 'Dehradun', 1 UNION ALL
  SELECT 'UK', 'Haridwar', 2 UNION ALL
  SELECT 'UK', 'Rishikesh', 3 UNION ALL
  SELECT 'WB', 'Kolkata', 1 UNION ALL
  SELECT 'WB', 'Howrah', 2 UNION ALL
  SELECT 'WB', 'Durgapur', 3 UNION ALL
  SELECT 'WB', 'Siliguri', 4 UNION ALL
  SELECT 'AN', 'Port Blair', 1 UNION ALL
  SELECT 'CH', 'Chandigarh', 1 UNION ALL
  SELECT 'DD', 'Daman', 1 UNION ALL
  SELECT 'DD', 'Diu', 2 UNION ALL
  SELECT 'DD', 'Silvassa', 3 UNION ALL
  SELECT 'DL', 'New Delhi', 1 UNION ALL
  SELECT 'DL', 'Delhi', 2 UNION ALL
  SELECT 'JK', 'Srinagar', 1 UNION ALL
  SELECT 'JK', 'Jammu', 2 UNION ALL
  SELECT 'LA', 'Leh', 1 UNION ALL
  SELECT 'LA', 'Kargil', 2 UNION ALL
  SELECT 'LD', 'Kavaratti', 1 UNION ALL
  SELECT 'PY', 'Puducherry', 1 UNION ALL
  SELECT 'PY', 'Karaikal', 2
) AS v
INNER JOIN states s ON s.code = v.code;
