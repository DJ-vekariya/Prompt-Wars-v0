-- Promote a user to organizer (admin role) by email. Admin-only.
CREATE OR REPLACE FUNCTION public.promote_user_to_organizer(_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid := auth.uid();
  _target uuid;
BEGIN
  IF _caller IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.has_role(_caller, 'admin'::app_role) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only organizers can promote users');
  END IF;

  SELECT id INTO _target FROM auth.users WHERE lower(email) = lower(trim(_email));
  IF _target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No user found with that email');
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target, 'admin'::app_role)
  ON CONFLICT DO NOTHING;

  UPDATE public.profiles SET role = 'organizer' WHERE user_id = _target;

  RETURN jsonb_build_object('success', true, 'user_id', _target);
END;
$$;

-- List current organizers (admin role) with email + display name. Admin-only.
CREATE OR REPLACE FUNCTION public.list_organizers()
RETURNS TABLE (user_id uuid, email text, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT ur.user_id, u.email::text, p.display_name
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.user_id = ur.user_id
  WHERE ur.role = 'admin'::app_role
  ORDER BY u.email;
END;
$$;