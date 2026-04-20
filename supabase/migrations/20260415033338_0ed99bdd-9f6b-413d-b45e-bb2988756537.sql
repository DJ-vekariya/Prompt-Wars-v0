
-- Fix tickets update policy to be more restrictive
DROP POLICY "Authenticated users can claim tickets" ON public.tickets;
CREATE POLICY "Authenticated users can claim unused tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (is_used = false AND used_by IS NULL)
  WITH CHECK (used_by = auth.uid() AND is_used = true);

-- Fix incidents insert policy
DROP POLICY "Authenticated users can create incidents" ON public.incidents;
CREATE POLICY "Authenticated users can create incidents" ON public.incidents
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
