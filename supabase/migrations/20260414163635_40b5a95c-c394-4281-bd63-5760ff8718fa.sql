
-- Drop the overly permissive policy
DROP POLICY "Authenticated users can create incidents" ON public.incidents;

-- Recreate with a more specific check (user must be authenticated, enforced by TO authenticated)
CREATE POLICY "Authenticated users can create incidents" ON public.incidents 
  FOR INSERT TO authenticated 
  WITH CHECK (true);
