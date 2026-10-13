CREATE OR REPLACE FUNCTION public.save_copilot_turn(
    p_conversation_id UUID,
    p_user_id UUID,
    p_user_message TEXT,
    p_assistant_message TEXT,
    p_citations JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_authenticated_user UUID := auth.uid();
    v_conversation_id UUID := p_conversation_id;
BEGIN
    IF v_authenticated_user IS NULL OR p_user_id IS DISTINCT FROM v_authenticated_user THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'authentication required';
    END IF;
    IF NULLIF(btrim(p_user_message), '') IS NULL
       OR NULLIF(btrim(p_assistant_message), '') IS NULL
       OR p_citations IS NULL
       OR jsonb_typeof(p_citations) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid conversation turn';
    END IF;
    IF jsonb_array_length(p_citations) > 50 THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid conversation turn';
    END IF;

    IF v_conversation_id IS NULL THEN
        INSERT INTO public.copilot_conversations (user_id, title)
        VALUES (v_authenticated_user, left(btrim(p_user_message), 120))
        RETURNING id INTO v_conversation_id;
    ELSE
        PERFORM 1
          FROM public.copilot_conversations
         WHERE id = v_conversation_id
           AND user_id = v_authenticated_user
         FOR UPDATE;
        IF NOT FOUND THEN
            RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'conversation not found';
        END IF;
        UPDATE public.copilot_conversations
           SET updated_at = now()
         WHERE id = v_conversation_id;
    END IF;

    INSERT INTO public.copilot_messages (conversation_id, role, content)
    VALUES (v_conversation_id, 'user', p_user_message);
    INSERT INTO public.copilot_messages (conversation_id, role, content, citations)
    VALUES (v_conversation_id, 'assistant', p_assistant_message, p_citations);

    RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_copilot_turn(UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_copilot_turn(UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
