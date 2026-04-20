-- Bootstrap organizer RPC: promote caller to admin role
CREATE OR REPLACE FUNCTION public.bootstrap_organizer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile_role text;
  _admin_count int;
BEGIN
  IF _uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Already an admin? Idempotent success.
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role = 'admin') THEN
    RETURN jsonb_build_object('success', true, 'already', true);
  END IF;

  SELECT role INTO _profile_role FROM public.profiles WHERE user_id = _uid;
  SELECT COUNT(*) INTO _admin_count FROM public.user_roles WHERE role = 'admin';

  -- Allow if profile says organizer, OR if no admin exists yet (bootstrap)
  IF _profile_role = 'organizer' OR _admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_uid, 'admin')
    ON CONFLICT DO NOTHING;
    RETURN jsonb_build_object('success', true);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Not eligible for organizer role');
END;
$$;

-- Update handle_new_user to honor the role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee')
  );
  RETURN NEW;
END;
$$;