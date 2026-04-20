
-- 1. Fix claim_ticket_code: derive user from auth.uid() instead of trusting parameter
CREATE OR REPLACE FUNCTION public.claim_ticket_code(_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ticket record;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, code, is_used INTO _ticket
  FROM public.tickets
  WHERE code = upper(trim(_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket not found');
  END IF;

  IF _ticket.is_used THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ticket already used');
  END IF;

  UPDATE public.tickets
  SET is_used = true, used_by = _uid
  WHERE id = _ticket.id;

  UPDATE public.profiles
  SET ticket_code = upper(trim(_code))
  WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Drop the old 2-arg version if it exists
DROP FUNCTION IF EXISTS public.claim_ticket_code(text, uuid);

-- 2. Restrict tickets SELECT policy — users can only see their own ticket
DROP POLICY IF EXISTS "Authenticated users can read tickets" ON public.tickets;

CREATE POLICY "Users can read own ticket"
  ON public.tickets FOR SELECT TO authenticated
  USING (used_by = auth.uid());

CREATE POLICY "Admins can read all tickets"
  ON public.tickets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Prevent role escalation on profiles UPDATE
-- Replace the existing policy with one that blocks role changes
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
  );
