-- +goose Up
CREATE TABLE IF NOT EXISTS partner_offers (
  id SERIAL PRIMARY KEY,
  manufacturer_id INT REFERENCES manufacturers(id) ON DELETE CASCADE,
  dealer_name TEXT NOT NULL,
  dealer_type TEXT NOT NULL CHECK (dealer_type IN ('dealer', 'broker', 'manufacturer', 'chandler', 'yard')),
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  website_url TEXT,
  location_city TEXT,
  location_country TEXT,
  service_area TEXT,
  specializations TEXT[],
  offer_type TEXT NOT NULL CHECK (offer_type IN ('new_sales', 'used_sales', 'charter', 'service', 'repair', 'brokerage', 'parts', 'consultation')),
  offer_title TEXT NOT NULL,
  offer_description TEXT,
  price_range_min NUMERIC,
  price_range_max NUMERIC,
  currency TEXT DEFAULT 'EUR',
  validity_start TIMESTAMPTZ,
  validity_end TIMESTAMPTZ,
  source_confidence INT CHECK (source_confidence >= 1 AND source_confidence <= 5),
  data_source TEXT NOT NULL,
  data_source_url TEXT,
  last_verified_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique index to prevent duplicate offers for same dealer+manufacturer
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_offers_manufacturer_dealer ON partner_offers(manufacturer_id, dealer_name);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_offers_manufacturer_active ON partner_offers(manufacturer_id, is_active);
CREATE INDEX IF NOT EXISTS idx_partner_offers_type_active ON partner_offers(offer_type, is_active);
CREATE INDEX IF NOT EXISTS idx_partner_offers_location ON partner_offers(location_country, location_city);
CREATE INDEX IF NOT EXISTS idx_partner_offers_validity ON partner_offers(validity_start, validity_end);

-- +goose Down
DROP TABLE IF EXISTS partner_offers;