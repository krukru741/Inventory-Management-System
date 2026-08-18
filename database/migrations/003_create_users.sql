-- =============================================================================
-- Migration 003: Users & Roles
-- Description : Application users with bcrypt password hashes and
--               role-based access control.
-- =============================================================================

CREATE TABLE users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(150)    NOT NULL,
    email           VARCHAR(255)    NOT NULL,
    password_hash   TEXT            NOT NULL,
    role            user_role       NOT NULL DEFAULT 'staff',
    phone           VARCHAR(30),
    avatar_url      TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique UNIQUE (email)
);

COMMENT ON TABLE  users                 IS 'Application users with role-based permissions.';
COMMENT ON COLUMN users.password_hash   IS 'bcrypt hash (never store plaintext).';
COMMENT ON COLUMN users.role            IS 'admin | manager | staff | viewer';

-- Indexes
CREATE INDEX idx_users_email       ON users (email);
CREATE INDEX idx_users_role        ON users (role);
CREATE INDEX idx_users_is_active   ON users (is_active);

-- Auto-update trigger
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
