-- LAN Party Catering — MariaDB schema
-- This file runs automatically when the Docker volume is first created.

CREATE TABLE IF NOT EXISTS attendees (
  id           CHAR(36)     NOT NULL PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  dietary_restrictions JSON NOT NULL DEFAULT ('[]'),
  payment_status ENUM('unpaid','paid','comped') NOT NULL DEFAULT 'unpaid',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id           CHAR(36)       NOT NULL PRIMARY KEY,
  name         VARCHAR(255)   NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2)  NOT NULL,
  category     VARCHAR(100)   NOT NULL,
  dietary_tags JSON           NOT NULL DEFAULT ('[]'),
  available    BOOLEAN        NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS orders (
  id           CHAR(36)  NOT NULL PRIMARY KEY,
  attendee_id  CHAR(36)  NOT NULL,
  notes        TEXT,
  status       ENUM('pending','preparing','ready') NOT NULL DEFAULT 'pending',
  created_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ready_at     DATETIME,
  email_sent   BOOLEAN   NOT NULL DEFAULT FALSE,
  FOREIGN KEY (attendee_id) REFERENCES attendees(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id           CHAR(36) NOT NULL PRIMARY KEY,
  order_id     CHAR(36) NOT NULL,
  menu_item_id CHAR(36) NOT NULL,
  quantity     INT      NOT NULL DEFAULT 1,
  FOREIGN KEY (order_id)     REFERENCES orders(id),
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);

CREATE TABLE IF NOT EXISTS settings (
  `key`  VARCHAR(100) NOT NULL PRIMARY KEY,
  value  TEXT         NOT NULL
);

-- ── Default settings ──────────────────────────────────────────────────────────
INSERT IGNORE INTO settings (`key`, value) VALUES ('prep_minutes', '10');

-- ── Seed menu items ───────────────────────────────────────────────────────────
INSERT IGNORE INTO menu_items (id, name, description, price, category, dietary_tags, available) VALUES
  (UUID(), 'Margherita Pizza',  'Classic tomato and mozzarella',         12.00, 'food',  '["vegetarian"]',              TRUE),
  (UUID(), 'BBQ Chicken Pizza', 'Smoky BBQ sauce, chicken, red onion',   14.00, 'food',  '[]',                          TRUE),
  (UUID(), 'Vegan Wrap',        'Falafel, hummus, salad in a tortilla',  11.00, 'food',  '["vegan","gluten-free"]',     TRUE),
  (UUID(), 'Chicken Wings (6)', 'Crispy wings with choice of sauce',      9.00, 'food',  '["gluten-free"]',             TRUE),
  (UUID(), 'Loaded Nachos',     'Cheese, jalapeños, sour cream, salsa',   8.00, 'snack', '["vegetarian","gluten-free"]',TRUE),
  (UUID(), 'Mixed Nuts',        'Salted cashews, almonds, peanuts',        4.00, 'snack', '["vegan","gluten-free"]',     TRUE),
  (UUID(), 'Energy Drink',      '500ml, assorted flavours',                3.50, 'drink', '[]',                          TRUE),
  (UUID(), 'Water Bottle',      '750ml still water',                       2.00, 'drink', '["vegan","gluten-free"]',     TRUE),
  (UUID(), 'Craft Beer',        'Local pale ale 330ml',                    5.00, 'drink', '["vegan","gluten-free"]',     TRUE),
  (UUID(), 'Soft Drink',        'Cola, lemonade, or orange',               2.50, 'drink', '["vegan","gluten-free"]',     TRUE);
