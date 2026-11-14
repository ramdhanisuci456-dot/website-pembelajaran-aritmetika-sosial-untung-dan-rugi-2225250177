ALTER TABLE public.students
ALTER COLUMN code DROP NOT NULL,
ALTER COLUMN name SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'students_name_valid'
          AND conrelid = 'public.students'::regclass
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_name_valid
        CHECK (char_length(btrim(name)) BETWEEN 1 AND 60);
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.register_student(p_name text)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
    INSERT INTO public.students(name)
    SELECT btrim(p_name)
    WHERE char_length(btrim(p_name)) BETWEEN 1 AND 60
    RETURNING id
$$;

REVOKE ALL ON FUNCTION public.register_student(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_student(text) TO anon, authenticated;
