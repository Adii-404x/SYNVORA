CREATE FUNCTION public.altrix_create_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.altrix_create_profile_for_auth_user()
    FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM pg_catalog.pg_trigger
         WHERE tgrelid = 'auth.users'::regclass
           AND tgname = 'altrix_profile_after_auth_user_insert'
           AND NOT tgisinternal
    ) THEN
        RAISE EXCEPTION 'Trigger altrix_profile_after_auth_user_insert already exists; inspect it before migration';
    END IF;
END;
$$;

CREATE TRIGGER altrix_profile_after_auth_user_insert
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.altrix_create_profile_for_auth_user();

INSERT INTO public.profiles (id)
SELECT users.id
  FROM auth.users AS users
  LEFT JOIN public.profiles AS profiles ON profiles.id = users.id
 WHERE profiles.id IS NULL
ON CONFLICT (id) DO NOTHING;
