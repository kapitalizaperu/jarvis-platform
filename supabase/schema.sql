-- ─────────────────────────────────────────────────────────────────────────────
-- JARVIS Multi-Tenant Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tenants (agencies) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'agency' CHECK (plan IN ('agency', 'elite', 'enterprise')),
  max_clients INTEGER NOT NULL DEFAULT 10,
  active_agents TEXT[] DEFAULT ARRAY['marketing','sales'],
  industry TEXT,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trial',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Clients (Level 2 — businesses the agency manages) ─────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  industry TEXT,
  plan TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  agents_enabled TEXT[] DEFAULT ARRAY['sales'],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Conversations ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  channel TEXT NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'email', 'call')),
  agent_type TEXT NOT NULL DEFAULT 'orchestrator',
  messages JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Agent Tasks ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  agent_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── WhatsApp Messages ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'received',
  whatsapp_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Agent Metrics (daily rollup) ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_completed INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  revenue_influenced DECIMAL(10,2) DEFAULT 0,
  UNIQUE(tenant_id, agent_type, date)
);

-- ── Row Level Security ─────────────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Tenants: users can only see their own tenant
CREATE POLICY "tenant_owner_access" ON tenants
  FOR ALL USING (owner_id = auth.uid());

-- Clients: agency can see their own clients
CREATE POLICY "agency_clients_access" ON clients
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- Conversations: same tenant isolation
CREATE POLICY "tenant_conversations_access" ON conversations
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE POLICY "tenant_tasks_access" ON agent_tasks
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE POLICY "tenant_whatsapp_access" ON whatsapp_messages
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

CREATE POLICY "tenant_metrics_access" ON agent_metrics
  FOR ALL USING (
    tenant_id IN (SELECT id FROM tenants WHERE owner_id = auth.uid())
  );

-- ── Auto-create tenant on user signup ─────────────────────────────────────

CREATE OR REPLACE FUNCTION create_tenant_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenants (owner_id, name, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'agencyName', NEW.raw_user_meta_data->>'name', NEW.email),
    'agency'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_tenant_for_new_user();

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_tenant ON clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_tenant ON agent_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_tenant ON whatsapp_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant_date ON agent_metrics(tenant_id, date);
