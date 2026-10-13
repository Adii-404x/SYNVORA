DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM public.observations
         WHERE fact_id IS NOT NULL
         GROUP BY fact_id
        HAVING count(*) > 1
    ) OR EXISTS (
        SELECT 1
          FROM public.medications
         WHERE fact_id IS NOT NULL
         GROUP BY fact_id
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add candidate review uniqueness constraints: duplicate verified fact links require manual review';
    END IF;
END;
$$;

ALTER TABLE public.extracted_facts
    ADD COLUMN candidate_data JSONB,
    ADD COLUMN reviewed_by UUID REFERENCES auth.users(id),
    ADD COLUMN reviewed_at TIMESTAMPTZ,
    ADD COLUMN review_corrections JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD CONSTRAINT extracted_facts_candidate_data_object
        CHECK (candidate_data IS NULL OR jsonb_typeof(candidate_data) = 'object');

ALTER TABLE public.observations
    ALTER COLUMN code DROP NOT NULL,
    ADD COLUMN original_value TEXT;

CREATE UNIQUE INDEX observations_fact_id_unique
    ON public.observations (fact_id)
    WHERE fact_id IS NOT NULL;

CREATE UNIQUE INDEX medications_fact_id_unique
    ON public.medications (fact_id)
    WHERE fact_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.review_extracted_fact(
    p_fact_id UUID,
    p_decision TEXT,
    p_observation_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_fact public.extracted_facts%ROWTYPE;
    v_record_id UUID;
    v_observation_date DATE;
    v_medication_date DATE;
    v_original_value TEXT;
    v_numeric_value NUMERIC;
    v_review_corrections JSONB := '{}'::jsonb;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '42501', MESSAGE = 'authentication required';
    END IF;

    IF p_decision IS NULL OR p_decision NOT IN ('confirm', 'reject') THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'invalid review decision';
    END IF;

    SELECT ef.*
      INTO v_fact
      FROM public.extracted_facts AS ef
      JOIN public.health_documents AS hd
        ON hd.id = ef.document_id
       AND hd.user_id = v_user_id
     WHERE ef.id = p_fact_id
       AND ef.user_id = v_user_id
     FOR UPDATE OF ef;

    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'candidate not found';
    END IF;

    IF v_fact.verification_status = 'rejected' AND p_decision = 'reject' THEN
        RETURN jsonb_build_object(
            'factId', v_fact.id,
            'decision', 'reject',
            'factType', v_fact.fact_type,
            'recordId', NULL,
            'idempotent', TRUE
        );
    END IF;

    IF v_fact.verification_status = 'confirmed' AND p_decision = 'confirm' THEN
        IF v_fact.fact_type = 'observation' THEN
            SELECT o.id INTO v_record_id
              FROM public.observations AS o
             WHERE o.fact_id = v_fact.id
               AND o.user_id = v_user_id
               AND o.verified_by = v_user_id;
        ELSIF v_fact.fact_type = 'medication' THEN
            SELECT m.id INTO v_record_id
              FROM public.medications AS m
             WHERE m.fact_id = v_fact.id
               AND m.user_id = v_user_id
               AND m.verified_by = v_user_id;
        END IF;

        IF v_record_id IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'confirmed candidate has no verified record';
        END IF;

        RETURN jsonb_build_object(
            'factId', v_fact.id,
            'decision', 'confirm',
            'factType', v_fact.fact_type,
            'recordId', v_record_id,
            'idempotent', TRUE
        );
    END IF;

    IF v_fact.verification_status IS DISTINCT FROM 'pending' THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'invalid candidate state';
    END IF;

    IF p_observation_date IS NOT NULL AND v_fact.fact_type <> 'observation' THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'observation date correction is not applicable';
    END IF;

    IF p_decision = 'reject' THEN
        UPDATE public.extracted_facts
           SET verification_status = 'rejected',
               reviewed_by = v_user_id,
               reviewed_at = now()
         WHERE id = v_fact.id;

        RETURN jsonb_build_object(
            'factId', v_fact.id,
            'decision', 'reject',
            'factType', v_fact.fact_type,
            'recordId', NULL,
            'idempotent', FALSE
        );
    END IF;

    IF v_fact.candidate_data IS NULL
       OR jsonb_typeof(v_fact.candidate_data) <> 'object'
       OR NULLIF(btrim(v_fact.source_text), '') IS NULL
       OR v_fact.candidate_data->>'source_text' IS DISTINCT FROM v_fact.source_text THEN
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'candidate source evidence is incomplete';
    END IF;

    IF v_fact.fact_type = 'observation' THEN
        IF jsonb_typeof(v_fact.candidate_data->'test_name') IS DISTINCT FROM 'string'
           OR jsonb_typeof(v_fact.candidate_data->'value') IS DISTINCT FROM 'string'
           OR jsonb_typeof(v_fact.candidate_data->'source_text') IS DISTINCT FROM 'string'
           OR (jsonb_typeof(v_fact.candidate_data->'unit') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'unit') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'reference_range') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'reference_range') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'flag') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'flag') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'date') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'date') IS DISTINCT FROM 'null')
           OR NULLIF(btrim(v_fact.candidate_data->>'test_name'), '') IS NULL
           OR NULLIF(btrim(v_fact.candidate_data->>'value'), '') IS NULL
           OR v_fact.candidate_data->>'test_name' IS DISTINCT FROM v_fact.display_name
           OR v_fact.candidate_data->>'value' IS DISTINCT FROM v_fact.fact_value
           OR v_fact.candidate_data->>'unit' IS DISTINCT FROM v_fact.fact_unit
           OR v_fact.candidate_data->>'reference_range' IS DISTINCT FROM v_fact.reference_range THEN
            RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'observation candidate is incomplete';
        END IF;

        v_observation_date := p_observation_date;
        IF v_observation_date IS NULL
           AND v_fact.candidate_data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' THEN
            BEGIN
                v_observation_date := (v_fact.candidate_data->>'date')::date;
            EXCEPTION WHEN OTHERS THEN
                v_observation_date := NULL;
            END;
        END IF;

        IF v_observation_date IS NULL THEN
            RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'observation date requires reviewer correction';
        END IF;

        IF p_observation_date IS NOT NULL THEN
            v_review_corrections := jsonb_build_object('observationDate', p_observation_date);
        END IF;

        v_original_value := v_fact.candidate_data->>'value';
        IF btrim(v_original_value) ~ '^[+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)([eE][+-]?[0-9]+)?$' THEN
            BEGIN
                v_numeric_value := btrim(v_original_value)::numeric;
            EXCEPTION WHEN OTHERS THEN
                v_numeric_value := NULL;
            END;
        END IF;

        INSERT INTO public.observations (
            user_id, fact_id, observation_date, code, display_name, value,
            original_value, unit, interpretation, verified_by, verified_at
        ) VALUES (
            v_user_id, v_fact.id, v_observation_date, NULL,
            v_fact.candidate_data->>'test_name', v_numeric_value,
            v_original_value, v_fact.candidate_data->>'unit',
            v_fact.candidate_data->>'flag', v_user_id, now()
        )
        ON CONFLICT (fact_id) WHERE fact_id IS NOT NULL DO NOTHING
        RETURNING id INTO v_record_id;

    ELSIF v_fact.fact_type = 'medication' THEN
        IF jsonb_typeof(v_fact.candidate_data->'drug_name') IS DISTINCT FROM 'string'
           OR jsonb_typeof(v_fact.candidate_data->'source_text') IS DISTINCT FROM 'string'
           OR (jsonb_typeof(v_fact.candidate_data->'strength') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'strength') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'dosage_instructions') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'dosage_instructions') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'frequency') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'frequency') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'duration') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'duration') IS DISTINCT FROM 'null')
           OR (jsonb_typeof(v_fact.candidate_data->'date') IS DISTINCT FROM 'string'
               AND jsonb_typeof(v_fact.candidate_data->'date') IS DISTINCT FROM 'null')
           OR NULLIF(btrim(v_fact.candidate_data->>'drug_name'), '') IS NULL
           OR v_fact.candidate_data->>'drug_name' IS DISTINCT FROM v_fact.fact_value
           OR v_fact.candidate_data->>'drug_name' IS DISTINCT FROM v_fact.display_name
           OR v_fact.candidate_data->>'strength' IS DISTINCT FROM v_fact.fact_unit
           OR v_fact.candidate_data->>'dosage_instructions' IS DISTINCT FROM v_fact.reference_range THEN
            RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'medication candidate is incomplete';
        END IF;

        IF v_fact.candidate_data->>'date' ~ '^\d{4}-\d{2}-\d{2}$' THEN
            BEGIN
                v_medication_date := (v_fact.candidate_data->>'date')::date;
            EXCEPTION WHEN OTHERS THEN
                v_medication_date := NULL;
            END;
        END IF;

        INSERT INTO public.medications (
            user_id, fact_id, drug_name, dosage, frequency, start_date,
            status, verified_by, verified_at
        ) VALUES (
            v_user_id, v_fact.id, v_fact.candidate_data->>'drug_name',
            v_fact.candidate_data->>'dosage_instructions',
            v_fact.candidate_data->>'frequency', v_medication_date,
            NULL, v_user_id, now()
        )
        ON CONFLICT (fact_id) WHERE fact_id IS NOT NULL DO NOTHING
        RETURNING id INTO v_record_id;
    ELSE
        RAISE EXCEPTION USING ERRCODE = '22023', MESSAGE = 'unsupported candidate type';
    END IF;

    IF v_record_id IS NULL THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'verified record already exists';
    END IF;

    UPDATE public.extracted_facts
       SET verification_status = 'confirmed',
           reviewed_by = v_user_id,
           reviewed_at = now(),
           review_corrections = v_review_corrections
     WHERE id = v_fact.id
       AND verification_status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'candidate state changed during review';
    END IF;

    RETURN jsonb_build_object(
        'factId', v_fact.id,
        'decision', 'confirm',
        'factType', v_fact.fact_type,
        'recordId', v_record_id,
        'idempotent', FALSE
    );
END;
$$;

REVOKE ALL ON FUNCTION public.review_extracted_fact(UUID, TEXT, DATE) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_extracted_fact(UUID, TEXT, DATE) TO authenticated;
