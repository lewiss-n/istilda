/**
 * Database schema, as an ordered list of migrations.
 * Never edit a migration that has shipped: add a new one at the end instead.
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_initial",
    sql: `
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE products (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name          TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  slug          TEXT NOT NULL UNIQUE,
  category      TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         INTEGER NOT NULL CHECK (price > 0),
  compare_price INTEGER CHECK (compare_price IS NULL OR compare_price > 0),
  option_label  TEXT NOT NULL DEFAULT '',
  option_values TEXT NOT NULL DEFAULT '',
  in_stock      BOOLEAN NOT NULL DEFAULT TRUE,
  featured      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category);
CREATE INDEX products_created_idx ON products (created_at DESC);
CREATE INDEX products_featured_idx ON products (featured) WHERE featured;

CREATE TABLE product_images (
  id         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  filename   TEXT NOT NULL,
  sort       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX product_images_product_idx ON product_images (product_id, sort);
CREATE INDEX product_images_filename_idx ON product_images (filename);

CREATE TABLE orders (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ref           TEXT NOT NULL UNIQUE,
  channel       TEXT NOT NULL CHECK (channel IN ('website', 'whatsapp')),
  status        TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'delivered', 'cancelled')),
  customer_name TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  notes         TEXT NOT NULL DEFAULT '',
  admin_note    TEXT NOT NULL DEFAULT '',
  subtotal      INTEGER NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  item_count    INTEGER NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX orders_created_idx ON orders (created_at DESC);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);
CREATE INDEX orders_phone_idx ON orders (phone);

CREATE TABLE order_items (
  id           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id     INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id   INTEGER REFERENCES products (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  option_value TEXT NOT NULL DEFAULT '',
  unit_price   INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity     INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE events (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type       TEXT NOT NULL,
  path       TEXT NOT NULL DEFAULT '',
  product_id INTEGER REFERENCES products (id) ON DELETE SET NULL,
  visitor    TEXT NOT NULL,
  session    TEXT NOT NULL,
  referrer   TEXT NOT NULL DEFAULT '',
  device     TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_created_idx ON events (created_at);
CREATE INDEX events_type_created_idx ON events (type, created_at);
CREATE INDEX events_product_idx ON events (product_id, created_at) WHERE product_id IS NOT NULL;

-- Login and order-request throttling, shared by every app instance.
CREATE TABLE rate_limits (
  key      TEXT PRIMARY KEY,
  count    INTEGER NOT NULL,
  reset_at TIMESTAMPTZ NOT NULL
);
`,
  },
];
