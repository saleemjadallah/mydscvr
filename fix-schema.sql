-- Schema Fix SQL - Run this to align production database with code
-- This renames columns that have been changed in the schema

-- 1. Check current schema first
\echo 'Checking employment_profiles table...'
\d employment_profiles

-- 2. Rename columns if they exist with old names
-- Safe approach: Check if old column exists before renaming

DO $$
BEGIN
    -- Fix employment_profiles: company_name -> employer_name
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employment_profiles'
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE employment_profiles RENAME COLUMN company_name TO employer_name;
        RAISE NOTICE 'Renamed employment_profiles.company_name to employer_name';
    ELSE
        RAISE NOTICE 'employment_profiles.employer_name already exists, skipping';
    END IF;

    -- Fix employment_profiles: company_address -> employer_address (if needed)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'employment_profiles'
        AND column_name = 'company_address'
    ) THEN
        ALTER TABLE employment_profiles RENAME COLUMN company_address TO employer_address;
        RAISE NOTICE 'Renamed employment_profiles.company_address to employer_address';
    ELSE
        RAISE NOTICE 'employment_profiles.employer_address already exists or company_address never existed, skipping';
    END IF;

    -- Add any other column renames here as needed

END $$;

-- 3. Verify the changes
\echo 'Verifying employment_profiles table after changes...'
\d employment_profiles

\echo 'Schema fixes completed!'
