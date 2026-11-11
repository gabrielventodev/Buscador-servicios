-- Prospectos: prestadores a los que se invita a sumarse.
-- Los datos de contacto se cargan a mano o los da el propio prestador.
-- Nunca se guardan nombres ni teléfonos traídos de Google (solo place_id).
CREATE TABLE IF NOT EXISTS prospects (
  id             SERIAL PRIMARY KEY,
  code           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  trade          TEXT NOT NULL,
  phone          TEXT NOT NULL UNIQUE,
  source         TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'referido', 'places')),
  place_id       TEXT,
  variant        TEXT NOT NULL CHECK (variant IN ('A', 'B')),
  status         TEXT NOT NULL DEFAULT 'pendiente'
                 CHECK (status IN ('pendiente', 'enviado', 'interesado', 'registrado', 'baja')),
  opt_out_reason TEXT CHECK (opt_out_reason IN ('no_me_interesa', 'manual', 'sin_respuesta')),
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at        TIMESTAMPTZ,
  interested_at  TIMESTAMPTZ,
  registered_at  TIMESTAMPTZ,
  opted_out_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS prospects_status_idx ON prospects (status, created_at);

-- Prestadores registrados con consentimiento (opt-in).
CREATE TABLE IF NOT EXISTS providers (
  id              SERIAL PRIMARY KEY,
  prospect_id     INTEGER REFERENCES prospects (id),
  name            TEXT NOT NULL,
  trade           TEXT NOT NULL,
  zone            TEXT NOT NULL,
  whatsapp        TEXT NOT NULL UNIQUE,
  consent_version TEXT NOT NULL,
  consent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
