import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Ensures all required tables exist in the database
 * This is a failsafe that runs on every startup
 */
export async function ensureTables() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('[DB] DATABASE_URL is not set - cannot ensure tables');
    return;
  }

  console.log('[DB] Ensuring all tables exist...');

  const sql = postgres(connectionString);

  const ensureColumns = async (
    table: string,
    columns: { name: string; ddl: string; backfill?: string }[]
  ) => {
    const columnResults = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
    `;
    const existing = (columnResults as unknown as { column_name: string }[]).map((c) => c.column_name);

    for (const col of columns) {
      if (!existing.includes(col.name)) {
        await sql.unsafe(col.ddl);
        console.log(`[DB] ✓ Added ${col.name} to ${table}`);
        if (col.backfill) {
          await sql.unsafe(col.backfill);
          console.log(`[DB] ✓ Backfilled ${col.name} on ${table}`);
        }
      }
    }
  };

  try {
    // Read and execute the migration SQL
    const migrationPath = join(__dirname, '..', '..', 'drizzle', '0002_create_all_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    // Execute the entire migration
    await sql.unsafe(migrationSQL);

    console.log('[DB] All tables verified/created successfully');

    // Apply free user flag migration
    const freeUserMigrationPath = join(__dirname, '..', '..', 'drizzle', '0003_add_free_user_flag.sql');
    const freeUserMigrationSQL = readFileSync(freeUserMigrationPath, 'utf-8');
    await sql.unsafe(freeUserMigrationSQL);

    console.log('[DB] Free user privileges updated');

    // Apply chat sessions migration (creates visa_packages + chat_sessions if missing)
    const chatSessionsMigrationPath = join(__dirname, '..', '..', 'drizzle', '0004_create_chat_sessions.sql');
    const chatSessionsMigrationSQL = readFileSync(chatSessionsMigrationPath, 'utf-8');
    await sql.unsafe(chatSessionsMigrationSQL);

    console.log('[DB] Chat sessions tables verified/created');

    // Verify critical columns exist
    const result = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('uploads_used', 'batches_created')
    `;

    if (result.length === 2) {
      console.log('[DB] ✓ Critical columns verified: uploads_used, batches_created');
    } else {
      console.log('[DB] ⚠ Some critical columns may be missing');
    }

    // Add onboarding columns if they don't exist
    console.log('[DB] Checking for onboarding columns...');

    const onboardingColumnsExist = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('onboarding_completed', 'travel_profile')
    `;

    if (onboardingColumnsExist.length < 2) {
      console.log('[DB] Adding onboarding columns...');

      // Add onboarding_completed if missing
      const hasOnboardingCompleted = onboardingColumnsExist.some(
        (col) => (col as { column_name: string }).column_name === 'onboarding_completed'
      );
      if (!hasOnboardingCompleted) {
        await sql`ALTER TABLE users ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 0`;
        console.log('[DB] ✓ Added onboarding_completed column');
      }

      // Add travel_profile if missing
      const hasTravelProfile = onboardingColumnsExist.some(
        (col) => (col as { column_name: string }).column_name === 'travel_profile'
      );
      if (!hasTravelProfile) {
        await sql`ALTER TABLE users ADD COLUMN travel_profile JSONB`;
        console.log('[DB] ✓ Added travel_profile column');
      }
    } else {
      console.log('[DB] ✓ Onboarding columns already exist');
    }

    // Create visa_packages table if it doesn't exist (needed for chat_sessions FK)
    console.log('[DB] Checking for visa_packages table...');

    const visaPackagesExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'visa_packages'
      )
    `;

    if (!visaPackagesExists[0]?.exists) {
      console.log('[DB] Creating visa_packages table...');
      await sql`
        CREATE TABLE IF NOT EXISTS visa_packages (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          destination_country TEXT NOT NULL,
          visa_type TEXT NOT NULL,
          current_stage TEXT NOT NULL DEFAULT 'planning',
          documents JSONB,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      await sql`CREATE INDEX IF NOT EXISTS idx_visa_packages_user_id ON visa_packages(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_visa_packages_stage ON visa_packages(current_stage);`;

      console.log('[DB] ✓ Created visa_packages table');
    } else {
      console.log('[DB] ✓ visa_packages table already exists');
    }

    // Create chat_sessions table if it doesn't exist
    console.log('[DB] Checking for chat_sessions table...');

    const chatSessionsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'chat_sessions'
      )
    `;

    if (!chatSessionsExists[0]?.exists) {
      console.log('[DB] Creating chat_sessions table...');
      await sql`
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          package_id INTEGER REFERENCES visa_packages(id),
          visa_context JSONB,
          messages JSONB NOT NULL DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Create indexes for faster lookups
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_chat_sessions_package_id ON chat_sessions(package_id);`;

      console.log('[DB] ✓ Created chat_sessions table');
    } else {
      console.log('[DB] ✓ chat_sessions table already exists');
    }

    // Create form filler tables
    console.log('[DB] Checking for form filler tables...');

    // Check if user_profiles exists
    const userProfilesExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_profiles'
      )
    `;

    if (!userProfilesExists[0]?.exists) {
      console.log('[DB] Creating form filler tables...');

      // Create user_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS user_profiles (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          first_name TEXT NOT NULL,
          middle_name TEXT,
          last_name TEXT NOT NULL,
          maiden_name TEXT,
          date_of_birth DATE NOT NULL,
          place_of_birth TEXT NOT NULL,
          gender TEXT NOT NULL,
          marital_status TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          alternative_phone TEXT,
          current_address JSONB NOT NULL,
          previous_addresses JSONB,
          nationality TEXT NOT NULL,
          dual_nationality TEXT,
          country_of_birth TEXT NOT NULL,
          emergency_contact JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create passport_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS passport_profiles (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          profile_id VARCHAR REFERENCES user_profiles(id),
          passport_number TEXT NOT NULL,
          passport_type TEXT NOT NULL,
          issuing_country TEXT NOT NULL,
          issuing_authority TEXT,
          issue_date DATE NOT NULL,
          expiry_date DATE NOT NULL,
          place_of_issue TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create employment_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS employment_profiles (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          profile_id VARCHAR REFERENCES user_profiles(id),
          is_current BOOLEAN DEFAULT false NOT NULL,
          employer_name TEXT NOT NULL,
          job_title TEXT NOT NULL,
          department TEXT,
          start_date DATE NOT NULL,
          end_date DATE,
          employer_address JSONB NOT NULL,
          employer_phone TEXT,
          employer_email TEXT,
          employer_website TEXT,
          employment_type TEXT,
          monthly_salary TEXT,
          currency TEXT,
          responsibilities TEXT,
          supervisor_name TEXT,
          supervisor_title TEXT,
          supervisor_phone TEXT,
          supervisor_email TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create education_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS education_profiles (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          profile_id VARCHAR REFERENCES user_profiles(id),
          institution_name TEXT NOT NULL,
          degree_level TEXT NOT NULL,
          field_of_study TEXT NOT NULL,
          start_date DATE NOT NULL,
          graduation_date DATE,
          is_current BOOLEAN DEFAULT false NOT NULL,
          institution_address JSONB NOT NULL,
          gpa TEXT,
          honors TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create family_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS family_profiles (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          primary_profile_id VARCHAR REFERENCES user_profiles(id),
          relationship TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          date_of_birth DATE NOT NULL,
          nationality TEXT NOT NULL,
          occupation TEXT,
          current_address JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create travel_history table
      await sql`
        CREATE TABLE IF NOT EXISTS travel_history (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          profile_id VARCHAR REFERENCES user_profiles(id),
          country TEXT NOT NULL,
          purpose TEXT NOT NULL,
          entry_date DATE NOT NULL,
          exit_date DATE,
          visa_type TEXT,
          duration_days INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create form_templates table
      await sql`
        CREATE TABLE IF NOT EXISTS form_templates (
          id VARCHAR PRIMARY KEY,
          country TEXT NOT NULL,
          visa_type TEXT NOT NULL,
          form_name TEXT NOT NULL,
          form_version TEXT,
          official_url TEXT NOT NULL,
          field_mappings JSONB NOT NULL,
          validation_rules JSONB,
          instructions TEXT,
          is_active BOOLEAN DEFAULT true NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create filled_forms table
      await sql`
        CREATE TABLE IF NOT EXISTS filled_forms (
          id VARCHAR PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          profile_id VARCHAR REFERENCES user_profiles(id),
          template_id VARCHAR REFERENCES form_templates(id),
          filled_data JSONB NOT NULL,
          pdf_url TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          submitted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          country VARCHAR,
          visa_type VARCHAR,
          form_name VARCHAR,
          total_fields INTEGER,
          filled_fields INTEGER,
          valid_fields INTEGER,
          completion_percentage INTEGER,
          form_template_id VARCHAR,
          original_pdf_url TEXT,
          filled_pdf_url TEXT,
          output_url TEXT,
          validation_errors JSON,
          field_results JSON,
          overall_confidence INTEGER,
          completed_at TIMESTAMP WITH TIME ZONE,
          application_number TEXT
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS form_draft_versions (
          id VARCHAR PRIMARY KEY,
          form_id VARCHAR NOT NULL REFERENCES filled_forms(id) ON DELETE CASCADE,
          snapshot_id TEXT NOT NULL,
          filled_data JSONB NOT NULL,
          completion_percentage INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        )
      `;

      // Create indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_passport_profiles_user_id ON passport_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_employment_profiles_user_id ON employment_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_education_profiles_user_id ON education_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_family_profiles_user_id ON family_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_travel_history_user_id ON travel_history(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_filled_forms_user_id ON filled_forms(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_form_draft_versions_form ON form_draft_versions(form_id);`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_form_draft_versions_snapshot ON form_draft_versions(snapshot_id);`;

      console.log('[DB] ✓ Created form filler tables');
    } else {
      console.log('[DB] ✓ Form filler tables already exist');
    }

    // Ensure passport_profiles has newer columns from schema
    const passportColumns = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'passport_profiles'
    `;
    const passportColumnNames = (passportColumns as unknown as { column_name: string }[]).map((c) => c.column_name);
    if (!passportColumnNames.includes('previous_passports')) {
      await sql`ALTER TABLE passport_profiles ADD COLUMN previous_passports JSONB`;
      console.log('[DB] ✓ Added previous_passports to passport_profiles');
    }
    if (!passportColumnNames.includes('has_biometric')) {
      await sql`ALTER TABLE passport_profiles ADD COLUMN has_biometric BOOLEAN DEFAULT false`;
      console.log('[DB] ✓ Added has_biometric to passport_profiles');
    }
    if (!passportColumnNames.includes('biometric_number')) {
      await sql`ALTER TABLE passport_profiles ADD COLUMN biometric_number TEXT`;
      console.log('[DB] ✓ Added biometric_number to passport_profiles');
    }

    // Ensure user_profiles newer columns exist
    await ensureColumns('user_profiles', [
      { name: 'alternative_phone', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS alternative_phone TEXT' },
      { name: 'current_address', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS current_address JSONB' },
      { name: 'previous_addresses', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS previous_addresses JSONB' },
      { name: 'dual_nationality', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS dual_nationality TEXT' },
      { name: 'country_of_birth', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS country_of_birth TEXT' },
      { name: 'emergency_contact', ddl: 'ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB' },
    ]);

    // Ensure employment_profiles newer columns used by profile manager exist
    await ensureColumns('employment_profiles', [
      { name: 'employer_phone', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS employer_phone TEXT' },
      { name: 'employer_email', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS employer_email TEXT' },
      { name: 'employer_website', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS employer_website TEXT' },
      { name: 'employment_type', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS employment_type TEXT' },
      { name: 'monthly_salary', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS monthly_salary TEXT' },
      { name: 'currency', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS currency TEXT' },
      { name: 'responsibilities', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS responsibilities TEXT' },
      { name: 'supervisor_name', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS supervisor_name TEXT' },
      { name: 'supervisor_title', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS supervisor_title TEXT' },
      { name: 'supervisor_phone', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS supervisor_phone TEXT' },
      { name: 'supervisor_email', ddl: 'ALTER TABLE employment_profiles ADD COLUMN IF NOT EXISTS supervisor_email TEXT' },
    ]);

    // Ensure education_profiles columns match drizzle schema
    await ensureColumns('education_profiles', [
      {
        name: 'degree',
        ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS degree TEXT',
        backfill: 'UPDATE education_profiles SET degree = degree_level WHERE degree IS NULL AND degree_level IS NOT NULL',
      },
      { name: 'end_date', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS end_date DATE' },
      { name: 'institution_website', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS institution_website TEXT' },
      { name: 'student_id', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS student_id TEXT' },
      { name: 'grade_system', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS grade_system TEXT' },
      { name: 'major_subjects', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS major_subjects JSONB' },
      { name: 'achievements', ddl: 'ALTER TABLE education_profiles ADD COLUMN IF NOT EXISTS achievements TEXT' },
    ]);

    // Ensure family_profiles columns exist
    await ensureColumns('family_profiles', [
      {
        name: 'primary_profile_id',
        ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS primary_profile_id VARCHAR REFERENCES user_profiles(id)',
        backfill: 'UPDATE family_profiles SET primary_profile_id = profile_id WHERE primary_profile_id IS NULL AND profile_id IS NOT NULL',
      },
      { name: 'middle_name', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS middle_name TEXT' },
      { name: 'place_of_birth', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS place_of_birth TEXT' },
      { name: 'gender', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS gender TEXT' },
      { name: 'passport_number', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS passport_number TEXT' },
      { name: 'passport_expiry', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS passport_expiry DATE' },
      { name: 'passport_issuing_country', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS passport_issuing_country TEXT' },
      { name: 'email', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS email TEXT' },
      { name: 'phone', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS phone TEXT' },
      { name: 'employer', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS employer TEXT' },
      { name: 'is_minor', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false' },
      { name: 'school_name', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS school_name TEXT' },
      { name: 'grade', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS grade TEXT' },
      { name: 'has_separate_address', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS has_separate_address BOOLEAN DEFAULT false' },
      { name: 'address', ddl: 'ALTER TABLE family_profiles ADD COLUMN IF NOT EXISTS address JSONB' },
    ]);

    // Ensure form_templates columns exist (used by autofill)
    await ensureColumns('form_templates', [
      { name: 'form_version', ddl: 'ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS form_version TEXT' },
      { name: 'is_active', ddl: 'ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL', backfill: 'UPDATE form_templates SET is_active = true WHERE is_active IS NULL' },
      { name: 'validation_rules', ddl: 'ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS validation_rules JSONB' },
    ]);

    // Ensure travel_history columns exist
    await ensureColumns('travel_history', [
      { name: 'visa_type', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS visa_type TEXT' },
      { name: 'visa_number', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS visa_number TEXT' },
      { name: 'visa_issued_date', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS visa_issued_date DATE' },
      { name: 'visa_issued_by', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS visa_issued_by TEXT' },
      { name: 'accommodation', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS accommodation TEXT' },
      { name: 'sponsor_name', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS sponsor_name TEXT' },
      { name: 'entry_port', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS entry_port TEXT' },
      { name: 'exit_port', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS exit_port TEXT' },
      { name: 'had_issues', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS had_issues BOOLEAN DEFAULT false' },
      { name: 'issue_description', ddl: 'ALTER TABLE travel_history ADD COLUMN IF NOT EXISTS issue_description TEXT' },
    ]);

    // Ensure indexes on form_draft_versions even if table already existed
    await sql`CREATE INDEX IF NOT EXISTS idx_form_draft_versions_form ON form_draft_versions(form_id);`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_form_draft_versions_snapshot ON form_draft_versions(snapshot_id);`;

  } catch (error) {
    console.error('[DB] Error ensuring tables:', error);
    // Don't throw - let the app continue and fail naturally if tables are missing
  } finally {
    await sql.end();
  }
}
