-- =============================================
-- JOSTAVAN AI - SUPABASE DATABASE SCHEMA
-- Agentic Developer Platform
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- Stores developer account information
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for fast lookups
CREATE INDEX idx_users_email ON users(email);

-- =============================================
-- DEVELOPER_KEYS TABLE
-- Stores hashed API keys for authentication
-- Keys are stored as bcrypt hashes, never plaintext
-- =============================================
CREATE TABLE developer_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(32) NOT NULL, -- First 20 chars for display (sk-jostavan-xxxx)
  key_hash VARCHAR(255) NOT NULL,  -- bcrypt hash of full key
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_developer_keys_user_id ON developer_keys(user_id);
CREATE INDEX idx_developer_keys_key_hash ON developer_keys(key_hash);
CREATE INDEX idx_developer_keys_status ON developer_keys(status);

-- =============================================
-- USAGE_RECORDS TABLE
-- Tracks API usage for billing and analytics
-- =============================================
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_id UUID NOT NULL REFERENCES developer_keys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  model VARCHAR(100) NOT NULL,
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER GENERATED ALWAYS AS (tokens_input + tokens_output) STORED,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  latency_ms INTEGER,
  status_code INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_usage_records_key_id ON usage_records(key_id);
CREATE INDEX idx_usage_records_user_id ON usage_records(user_id);
CREATE INDEX idx_usage_records_created_at ON usage_records(created_at);
CREATE INDEX idx_usage_records_model ON usage_records(model);

-- =============================================
-- CHAT_SESSIONS TABLE
-- Stores VibeCoder chat sessions
-- =============================================
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) DEFAULT 'New Chat',
  model VARCHAR(50) DEFAULT 'balanced',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at);

-- =============================================
-- CHAT_MESSAGES TABLE
-- Stores individual messages in chat sessions
-- =============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent VARCHAR(50), -- 'architect', 'engineer', 'qa', 'orchestrator'
  model VARCHAR(100),
  tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

-- =============================================
-- GENERATED_FILES TABLE
-- Stores code files generated in chat sessions
-- =============================================
CREATE TABLE generated_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  path VARCHAR(500) NOT NULL,
  content TEXT,
  language VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'complete', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_generated_files_session_id ON generated_files(session_id);

-- =============================================
-- DAILY_USAGE_STATS VIEW
-- Aggregated daily usage for dashboard charts
-- =============================================
CREATE VIEW daily_usage_stats AS
SELECT 
  user_id,
  DATE(created_at) as date,
  COUNT(*) as requests,
  SUM(tokens_total) as tokens,
  SUM(cost_usd) as cost
FROM usage_records
GROUP BY user_id, DATE(created_at)
ORDER BY date DESC;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures users can only access their own data
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_files ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- API Keys policies
CREATE POLICY "Users can view own keys" ON developer_keys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own keys" ON developer_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keys" ON developer_keys
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own keys" ON developer_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Usage records policies
CREATE POLICY "Users can view own usage" ON usage_records
  FOR SELECT USING (auth.uid() = user_id);

-- Chat sessions policies
CREATE POLICY "Users can manage own sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Chat messages policies (through session ownership)
CREATE POLICY "Users can manage own messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Generated files policies (through session ownership)
CREATE POLICY "Users can manage own files" ON generated_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = generated_files.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to update usage count on API key
CREATE OR REPLACE FUNCTION increment_key_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE developer_keys
  SET usage_count = usage_count + 1,
      last_used_at = NOW()
  WHERE id = NEW.key_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment usage count
CREATE TRIGGER on_usage_record_insert
  AFTER INSERT ON usage_records
  FOR EACH ROW
  EXECUTE FUNCTION increment_key_usage();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_generated_files_updated_at
  BEFORE UPDATE ON generated_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- =============================================
-- SAMPLE DATA (for development)
-- =============================================

-- Insert sample user
INSERT INTO users (id, email, name, avatar_url) VALUES
  ('00000000-0000-0000-0000-000000000001', 'developer@example.com', 'Alex Chen', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face');

-- Insert sample API keys (passwords are hashed, these are just examples)
INSERT INTO developer_keys (user_id, name, key_prefix, key_hash, status, usage_count) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Production Key', 'sk-jostavan-prod-', '$2b$12$examplehash1', 'active', 1247),
  ('00000000-0000-0000-0000-000000000001', 'Development Key', 'sk-jostavan-dev-', '$2b$12$examplehash2', 'active', 456);
