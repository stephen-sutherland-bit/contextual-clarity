-- Add INSERT policy for teachings table (admin functionality)
CREATE POLICY "Allow teaching inserts"
ON public.teachings
FOR INSERT
WITH CHECK (true);

-- Also add UPDATE policy for editing teachings
CREATE POLICY "Allow teaching updates"
ON public.teachings
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Add DELETE policy for removing teachings
CREATE POLICY "Allow teaching deletes"
ON public.teachings
FOR DELETE
USING (true);