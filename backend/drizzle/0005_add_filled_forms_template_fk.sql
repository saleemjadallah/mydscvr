-- Ensure filled_forms table has a form_template_id column for schema parity
ALTER TABLE IF EXISTS "filled_forms"
ADD COLUMN IF NOT EXISTS "form_template_id" integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'filled_forms_form_template_id_form_templates_id_fk'
      AND table_name = 'filled_forms'
  ) THEN
    ALTER TABLE "filled_forms"
    ADD CONSTRAINT "filled_forms_form_template_id_form_templates_id_fk"
    FOREIGN KEY ("form_template_id") REFERENCES "form_templates"("id");
  END IF;
END $$;
