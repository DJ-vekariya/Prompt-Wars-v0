
-- Create tickets table for valid ticket codes
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Anyone can read tickets to validate codes
CREATE POLICY "Tickets are publicly readable" ON public.tickets
  FOR SELECT TO public USING (true);

-- Authenticated users can claim unused tickets
CREATE POLICY "Authenticated users can claim tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (used_by = auth.uid());

-- Seed sample ticket codes
INSERT INTO public.tickets (code) VALUES
  ('TKT-TEST-001'), ('TKT-TEST-002'), ('TKT-TEST-003'),
  ('TKT-TEST-004'), ('TKT-TEST-005'), ('TKT-TEST-006'),
  ('TKT-TEST-007'), ('TKT-TEST-008'), ('TKT-TEST-009'),
  ('TKT-TEST-010');
