CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(160) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    taster_level VARCHAR(40) NOT NULL DEFAULT 'beginner',
    email_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    country VARCHAR(120) NOT NULL,
    UNIQUE (name, country)
);

CREATE TABLE producers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(180) NOT NULL,
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
    website TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7)
);

CREATE TABLE denominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(140) NOT NULL,
    classification VARCHAR(20) CHECK (classification IN ('DOC', 'DOCG', 'IGT', 'OTHER')),
    region_id UUID REFERENCES regions(id) ON DELETE SET NULL
);

CREATE TABLE grapes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL UNIQUE
);

CREATE TABLE wines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    producer_id UUID REFERENCES producers(id) ON DELETE SET NULL,
    denomination_id UUID REFERENCES denominations(id) ON DELETE SET NULL,
    name VARCHAR(190) NOT NULL,
    vintage INTEGER CHECK (vintage BETWEEN 1800 AND 2200),
    color VARCHAR(20) CHECK (color IN ('red', 'white', 'rose', 'sparkling', 'sweet', 'orange')),
    alcohol NUMERIC(4, 2),
    bottle_size_ml INTEGER NOT NULL DEFAULT 750,
    paid_price NUMERIC(10, 2),
    market_price NUMERIC(10, 2),
    purchase_date DATE,
    purchase_place VARCHAR(180),
    cellar_position VARCHAR(120),
    private_notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'aging' CHECK (status IN ('ready', 'aging', 'gift', 'consumed')),
    ideal_from DATE,
    ideal_to DATE,
    serving_temperature VARCHAR(80),
    aging_time VARCHAR(120),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wine_grape (
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    grape_id UUID NOT NULL REFERENCES grapes(id) ON DELETE CASCADE,
    percentage NUMERIC(5, 2),
    PRIMARY KEY (wine_id, grape_id)
);

CREATE TABLE bottles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'consumed', 'gifted', 'reserved')),
    barcode VARCHAR(120),
    acquired_at DATE,
    consumed_at TIMESTAMPTZ
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movement_type VARCHAR(30) NOT NULL CHECK (movement_type IN ('purchase', 'consume', 'gift', 'adjustment')),
    quantity_delta INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tastings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    aroma TEXT NOT NULL,
    color_note TEXT NOT NULL,
    body TEXT NOT NULL,
    acidity TEXT NOT NULL,
    tannins TEXT NOT NULL,
    persistence TEXT NOT NULL,
    balance TEXT NOT NULL,
    complexity TEXT NOT NULL,
    pairing TEXT NOT NULL,
    serving_temperature TEXT NOT NULL,
    occasion TEXT NOT NULL,
    comment TEXT NOT NULL,
    would_buy_again BOOLEAN NOT NULL,
    place TEXT,
    people TEXT,
    photo_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(190) NOT NULL,
    average_price NUMERIC(10, 2),
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    availability VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(190) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(80) NOT NULL,
    title VARCHAR(190) NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE followers (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tasting_id UUID NOT NULL REFERENCES tastings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE likes (
    tasting_id UUID NOT NULL REFERENCES tastings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (tasting_id, user_id)
);

CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    price NUMERIC(10, 2) NOT NULL,
    source VARCHAR(120),
    observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wines_owner_status ON wines(owner_id, status);
CREATE INDEX idx_wines_search ON wines USING gin (to_tsvector('simple', name || ' ' || coalesce(private_notes, '')));
CREATE INDEX idx_movements_wine_created ON inventory_movements(wine_id, created_at DESC);
CREATE INDEX idx_tastings_user_created ON tastings(user_id, created_at DESC);
CREATE INDEX idx_events_geo ON events(latitude, longitude);
