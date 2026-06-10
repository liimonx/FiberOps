# Database Schema

Suggested **PostgreSQL 15+** schema with **PostGIS** for geo assets. Adapt naming and tenancy to your conventions.

## Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
```

## Organizations & auth

```sql
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  support_email TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT,                    -- or external IdP subject
  last_active_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE team_role AS ENUM ('admin', 'operator', 'viewer');

CREATE TABLE organization_members (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            team_role NOT NULL DEFAULT 'viewer',
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE team_invites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  role            team_role NOT NULL,
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at      TIMESTAMPTZ,
  UNIQUE (organization_id, email)
);
```

## Assets

```sql
CREATE TYPE asset_kind AS ENUM (
  'pole', 'junction_box', 'splitter', 'onu', 'pop', 'fiber_route'
);

CREATE TYPE asset_status AS ENUM (
  'active', 'degraded', 'down', 'maintenance'
);

CREATE TABLE assets (
  id              TEXT NOT NULL,           -- or UUID; frontend uses slugs today
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  kind            asset_kind NOT NULL,
  name            TEXT NOT NULL,
  status          asset_status NOT NULL DEFAULT 'active',
  location        GEOGRAPHY(POINT, 4326) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);

CREATE INDEX idx_assets_org_kind ON assets (organization_id, kind);
CREATE INDEX idx_assets_location ON assets USING GIST (location);
CREATE INDEX idx_assets_status ON assets (organization_id, status);
```

**API mapping:** expose `location` as `{ lat, lng }` using `ST_Y(location::geometry)` and `ST_X(location::geometry)`.

## Customers

```sql
CREATE TYPE customer_status AS ENUM ('online', 'offline', 'unstable');
CREATE TYPE billing_status AS ENUM ('paid', 'overdue', 'unpaid');

CREATE TABLE customers (
  id              TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  plan            TEXT NOT NULL,
  status          customer_status NOT NULL,
  billing_status  billing_status NOT NULL DEFAULT 'paid',
  related_onu_id  TEXT,
  email           TEXT,
  notes           TEXT,
  location        GEOGRAPHY(POINT, 4326),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, related_onu_id)
    REFERENCES assets (organization_id, id)
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_customers_org_status ON customers (organization_id, status);
CREATE INDEX idx_customers_onu ON customers (organization_id, related_onu_id);
```

**Allowed plans:** enforce via CHECK or application layer:

```sql
ALTER TABLE customers ADD CONSTRAINT customers_plan_check
  CHECK (plan IN (
    'Fiber 50Mbps', 'Fiber 100Mbps', 'Fiber 200Mbps',
    'Fiber 500Mbps', 'Fiber 1Gbps'
  ));
```

## Incidents

```sql
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE incident_status AS ENUM ('new', 'investigating', 'assigned', 'resolved');

CREATE TABLE incidents (
  id               TEXT NOT NULL,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  severity         incident_severity NOT NULL,
  status           incident_status NOT NULL DEFAULT 'new',
  related_asset_id TEXT,
  technician       TEXT,
  notes            TEXT,
  resolution_notes TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at      TIMESTAMPTZ,
  PRIMARY KEY (organization_id, id),
  FOREIGN KEY (organization_id, related_asset_id)
    REFERENCES assets (organization_id, id)
);

CREATE INDEX idx_incidents_org_status ON incidents (organization_id, status);
CREATE INDEX idx_incidents_severity ON incidents (organization_id, severity)
  WHERE status <> 'resolved';
CREATE INDEX idx_incidents_asset ON incidents (organization_id, related_asset_id);
```

## Network topology (Phase 2 — explicit graph)

Optional tables if moving topology server-side:

```sql
CREATE TYPE connection_type AS ENUM ('fiber_route', 'customer_connection');
CREATE TYPE network_status AS ENUM ('ACTIVE', 'INACTIVE', 'WARNING', 'DEGRADED', 'ERROR');

CREATE TABLE network_connections (
  id               TEXT NOT NULL,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_node_id   TEXT NOT NULL,
  target_node_id   TEXT NOT NULL,
  connection_type  connection_type NOT NULL,
  status           network_status NOT NULL DEFAULT 'ACTIVE',
  bandwidth        NUMERIC,
  utilization      SMALLINT CHECK (utilization BETWEEN 0 AND 100),
  route            GEOGRAPHY(LINESTRING, 4326),
  PRIMARY KEY (organization_id, id)
);

CREATE INDEX idx_connections_source ON network_connections (organization_id, source_node_id);
CREATE INDEX idx_connections_target ON network_connections (organization_id, target_node_id);
```

Node ids reference either `assets.id` or `customers.id` in the same org.

## Settings & integrations

```sql
CREATE TYPE integration_provider AS ENUM ('mapbox', 'slack', 'pagerduty', 'stripe');
CREATE TYPE integration_status AS ENUM ('connected', 'disconnected', 'error');

CREATE TABLE integrations (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        integration_provider NOT NULL,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  status          integration_status NOT NULL DEFAULT 'disconnected',
  credentials     BYTEA,                 -- encrypted JSON blob
  PRIMARY KEY (organization_id, provider)
);

CREATE TYPE webhook_event AS ENUM (
  'incident.created', 'incident.resolved', 'outage.detected', 'work_order.updated'
);

CREATE TABLE outbound_webhooks (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  enabled         BOOLEAN NOT NULL DEFAULT false,
  url             TEXT NOT NULL DEFAULT '',
  secret_encrypted BYTEA,
  events          webhook_event[] NOT NULL DEFAULT '{}'
);

CREATE TYPE billing_currency AS ENUM ('USD', 'EUR', 'GBP', 'CAD');
CREATE TYPE invoice_delivery AS ENUM ('email', 'portal');

CREATE TABLE billing_settings (
  organization_id   UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  legal_name        TEXT NOT NULL,
  billing_email     TEXT NOT NULL,
  currency          billing_currency NOT NULL DEFAULT 'USD',
  tax_id            TEXT NOT NULL DEFAULT '',
  invoice_delivery  invoice_delivery NOT NULL DEFAULT 'email',
  last_synced_at    TIMESTAMPTZ
);
```

## Work orders (planned)

```sql
CREATE TYPE work_order_status AS ENUM (
  'new', 'assigned', 'in_progress', 'review', 'done'
);

CREATE TABLE work_orders (
  id               TEXT NOT NULL,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  priority         TEXT NOT NULL,
  work_type        TEXT NOT NULL,
  status           work_order_status NOT NULL DEFAULT 'new',
  assignee_id      UUID REFERENCES users(id),
  related_incident_id TEXT,
  related_asset_id TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, id)
);
```

## Metrics (usage stats)

```sql
CREATE TABLE usage_metrics (
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bucket_start    TIMESTAMPTZ NOT NULL,
  label           TEXT NOT NULL,
  value           DOUBLE PRECISION NOT NULL,
  PRIMARY KEY (organization_id, bucket_start)
);
```

Aggregate into the 13-point daily series returned by `GET /api/stats/usage`.

## Audit log (recommended)

```sql
CREATE TABLE audit_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id        UUID REFERENCES users(id),
  action          TEXT NOT NULL,
  resource_type   TEXT NOT NULL,
  resource_id     TEXT,
  payload         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_org_time ON audit_events (organization_id, created_at DESC);
```

## Seed data reference

Import mock seed data from the frontend repo for dev/staging parity:

| Entity | File |
|--------|------|
| Assets | `src/mocks/data.ts` |
| Customers | `src/mocks/customersData.ts` |
| Incidents | `src/mocks/incidentsData.ts` |
| Settings | `src/mocks/settingsData.ts`, `integrationsData.ts`, `billingData.ts`, `teamData.ts` |

Geographic cluster: **Dhaka, Bangladesh** (~23.79°N, 90.41°E).

## Migration strategy

1. **Phase 1:** Tables for org, assets, customers, incidents + read/write REST
2. **Phase 2:** Explicit topology tables or materialized graph view
3. **Phase 3:** Work orders, metrics pipeline, audit log
4. **Phase 4:** Row-level security policies per `organization_id`

```sql
-- Example RLS (enable after auth middleware sets app.current_org)
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_org_isolation ON assets
  USING (organization_id = current_setting('app.current_org')::uuid);
```
