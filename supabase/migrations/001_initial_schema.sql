-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  country TEXT,
  city TEXT,
  default_language TEXT DEFAULT 'zh',
  contact_email TEXT,
  whatsapp TEXT,
  wechat TEXT,
  service_countries TEXT[] DEFAULT '{}',
  service_levels TEXT[] DEFAULT '{}',
  subscription_plan TEXT DEFAULT 'free',
  ai_provider TEXT DEFAULT 'claude',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  name TEXT,
  role TEXT DEFAULT 'consultant',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leads (student inquiries)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  contact TEXT,
  source TEXT DEFAULT 'other',
  status TEXT DEFAULT 'new',
  priority TEXT DEFAULT 'medium',
  target_country TEXT[] DEFAULT '{}',
  target_level TEXT,
  target_major TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  intake_year INTEGER,
  last_followed_up_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Student profiles (detailed background)
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID UNIQUE NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  current_school TEXT,
  current_major TEXT,
  gpa DECIMAL(4,2),
  gpa_scale DECIMAL(3,1) DEFAULT 4.0,
  language_type TEXT,
  language_score DECIMAL(5,1),
  work_experience TEXT,
  research_experience TEXT,
  extracurriculars TEXT,
  target_preferences JSONB DEFAULT '{}',
  parent_concerns TEXT[] DEFAULT '{}',
  raw_input TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Study plans
CREATE TABLE study_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  version INTEGER DEFAULT 1,
  plan_type TEXT DEFAULT 'student',
  language TEXT DEFAULT 'zh',
  content_json JSONB NOT NULL DEFAULT '{}',
  risk_flags TEXT[] DEFAULT '{}',
  quality_score INTEGER,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- School recommendations (part of study plans)
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  country TEXT,
  program_name TEXT,
  tier TEXT,
  rationale TEXT,
  risks TEXT,
  fit_score INTEGER,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0
);

-- Materials checklist
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  material_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  due_date DATE,
  notes TEXT
);

-- Follow-up messages
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT,
  message_type TEXT,
  message_content TEXT,
  tone TEXT,
  language TEXT DEFAULT 'zh',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI usage records
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  tokens_used INTEGER,
  model TEXT,
  cost_estimate DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's org
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM user_profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Organizations: members can read their own org
CREATE POLICY "org_read" ON organizations FOR SELECT
  USING (id = get_my_org_id());

CREATE POLICY "org_update" ON organizations FOR UPDATE
  USING (id = get_my_org_id());

CREATE POLICY "org_insert" ON organizations FOR INSERT
  WITH CHECK (true);

-- User profiles
CREATE POLICY "profile_read_own_org" ON user_profiles FOR SELECT
  USING (organization_id = get_my_org_id() OR id = auth.uid());

CREATE POLICY "profile_insert_own" ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profile_update_own" ON user_profiles FOR UPDATE
  USING (id = auth.uid());

-- Leads
CREATE POLICY "leads_org_access" ON leads FOR ALL
  USING (organization_id = get_my_org_id());

-- Student profiles (via lead)
CREATE POLICY "student_profiles_org_access" ON student_profiles FOR ALL
  USING (
    lead_id IN (SELECT id FROM leads WHERE organization_id = get_my_org_id())
  );

-- Study plans
CREATE POLICY "study_plans_org_access" ON study_plans FOR ALL
  USING (
    lead_id IN (SELECT id FROM leads WHERE organization_id = get_my_org_id())
  );

-- Recommendations
CREATE POLICY "recommendations_org_access" ON recommendations FOR ALL
  USING (
    study_plan_id IN (
      SELECT sp.id FROM study_plans sp
      JOIN leads l ON sp.lead_id = l.id
      WHERE l.organization_id = get_my_org_id()
    )
  );

-- Materials
CREATE POLICY "materials_org_access" ON materials FOR ALL
  USING (
    lead_id IN (SELECT id FROM leads WHERE organization_id = get_my_org_id())
  );

-- Follow-ups
CREATE POLICY "follow_ups_org_access" ON follow_ups FOR ALL
  USING (
    lead_id IN (SELECT id FROM leads WHERE organization_id = get_my_org_id())
  );

-- Usage records
CREATE POLICY "usage_records_org_access" ON usage_records FOR ALL
  USING (organization_id = get_my_org_id());

-- =====================
-- Indexes
-- =====================
CREATE INDEX idx_leads_org ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_study_plans_lead ON study_plans(lead_id);
CREATE INDEX idx_materials_lead ON materials(lead_id);
CREATE INDEX idx_follow_ups_lead ON follow_ups(lead_id);
CREATE INDEX idx_usage_records_org ON usage_records(organization_id, created_at);
