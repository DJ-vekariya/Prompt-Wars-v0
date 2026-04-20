
-- Secure ticket validation RPC (no auth needed, validates code exists)
CREATE OR REPLACE FUNCTION public.validate_ticket_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ticket record;
BEGIN
  SELECT id, code, is_used INTO _ticket
  FROM public.tickets
  WHERE code = upper(trim(_code));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid ticket code');
  END IF;
  
  IF _ticket.is_used THEN
    RETURN jsonb_build_object('valid', true, 'is_used', true);
  END IF;
  
  RETURN jsonb_build_object('valid', true, 'is_used', false);
END;
$$;

-- Secure ticket claim RPC (called after signup, marks ticket used)
CREATE OR REPLACE FUNCTION public.claim_ticket_code(_code text, _user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _ticket record;
BEGIN
  SELECT id, code, is_used INTO _ticket
  FROM public.tickets
  WHERE code = upper(trim(_code));
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid ticket code');
  END IF;
  
  IF _ticket.is_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket already used');
  END IF;
  
  UPDATE public.tickets SET is_used = true, used_by = _user_id WHERE id = _ticket.id;
  UPDATE public.profiles SET ticket_code = upper(trim(_code)) WHERE user_id = _user_id;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tickets_code ON public.tickets(code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status_zone ON public.incidents(status, zone_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dome_time ON public.sessions(dome_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_zones_type ON public.zones(type);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Allow anon to call validate_ticket_code (for login page before auth)
GRANT EXECUTE ON FUNCTION public.validate_ticket_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_ticket_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ticket_code(text, uuid) TO authenticated;
