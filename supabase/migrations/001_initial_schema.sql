-- ============================================================================
-- TSLA Red Note - Initial Database Schema
-- ============================================================================

-- ─── Profiles Table ──────────────────────────────────────────────────────────
-- Stores user profiles linked to WeChat OpenID

CREATE TABLE profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wechat_openid TEXT UNIQUE NOT NULL,
  nickname TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  subscription_status TEXT DEFAULT 'free'
    CHECK (subscription_status IN ('free', 'active', 'expired', 'cancelled')),
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by openid
CREATE INDEX idx_profiles_wechat_openid ON profiles (wechat_openid);

-- Index for subscription expiry checks
CREATE INDEX idx_profiles_subscription_expires ON profiles (subscription_expires_at)
  WHERE subscription_status = 'active';


-- ─── Orders Table ────────────────────────────────────────────────────────────
-- Stores payment orders for subscription purchases

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  wechat_openid TEXT NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('basic', 'pro')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'annual')),
  amount_cents INTEGER NOT NULL,
  wechat_prepay_id TEXT,
  out_trade_no TEXT UNIQUE,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ
);

-- Index for querying orders by user
CREATE INDEX idx_orders_wechat_openid ON orders (wechat_openid);

-- Index for querying orders by user_id
CREATE INDEX idx_orders_user_id ON orders (user_id);

-- Index for pending orders (used by payment verification)
CREATE INDEX idx_orders_status ON orders (status) WHERE status = 'pending';


-- ─── Row Level Security (RLS) ───────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Service role (used by Edge Functions) bypasses RLS by default.
-- The policies below apply to authenticated/anon Supabase clients only.

-- Profiles: Users can read their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid()::text = id::text);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Orders: Users can read their own orders
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Orders: No direct insert/update/delete from client
-- All order mutations go through Edge Functions using the service role key.


-- ─── Updated At Trigger ─────────────────────────────────────────────────────
-- Automatically update the updated_at column on profiles

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
