# Deployment Fixes - November 2025

## Issues Identified and Fixed

### 1. Canvas/libuuid Runtime Library Error ✅ FIXED

**Problem:**
```
Error: libuuid.so.1: cannot open shared object file: No such file or directory
```

**Root Cause:**
- Canvas package requires native libraries (libuuid, cairo, pango, etc.)
- These were installed at build time via `nixPkgs` but not available at runtime
- Canvas has no prebuilt binaries for Node.js 22 (Railway's default)

**Solution Applied:**
- Changed from `nixPkgs` to `nixLibs` for native dependencies (adds to LD_LIBRARY_PATH at runtime)
- Downgraded from Node.js 18 to Node.js 20 (canvas compatibility)
- Added `engines` field to backend/package.json to enforce Node.js 20
- Removed db:push from start command (see below)

**Files Changed:**
- `nixpacks.toml` - Updated to use nixLibs and Node 20
- `backend/package.json` - Added engines field

---

### 2. Schema Mismatch Issues ⚠️ REQUIRES MANUAL ACTION

**Problem:**
```
Is employer_name column in employment_profiles table created or renamed from another column?
❯ + employer_name                   create column
  ~ company_name › employer_name    rename column
```

**Root Cause:**
- Database schema is out of sync with code
- Production database has old column names that don't match current schema files
- Running `db:push` during startup blocks deployment with interactive prompts

**Impact:**
- Multiple tables likely have similar mismatches
- App fails to start because db:push waits for user input

**Solution Required - Choose ONE of these approaches:**

#### Option A: Rename Columns (Preserves Data) - RECOMMENDED
If the old database data should be kept:

1. **Connect to Railway database:**
   ```bash
   # Get DATABASE_URL from Railway dashboard
   psql $DATABASE_URL
   ```

2. **Manually rename columns:**
   ```sql
   -- Check current columns first
   \d employment_profiles

   -- Rename if company_name exists
   ALTER TABLE employment_profiles
   RENAME COLUMN company_name TO employer_name;

   -- Repeat for any other mismatched columns
   ```

3. **Verify schema alignment:**
   ```bash
   npm run db:push
   # Should show "No schema changes detected"
   ```

#### Option B: Fresh Schema Push (Data Loss) - USE WITH CAUTION
If you can afford to lose existing data:

1. **In Railway dashboard, add temporary env var:**
   ```
   DRIZZLE_FORCE_PUSH=true
   ```

2. **Temporarily modify nixpacks.toml start command:**
   ```toml
   cmd = "cd backend && npm run db:push -- --force && npm start"
   ```

3. **Deploy once, then remove the env var and revert start command**

#### Option C: Generate and Apply Migrations (Production Best Practice)
For proper production deployments:

1. **Generate migration files locally:**
   ```bash
   cd backend
   npm run db:generate
   # This creates migration SQL files in drizzle/ folder
   ```

2. **Review the generated SQL:**
   ```bash
   cat drizzle/0001_*.sql
   ```

3. **Apply manually or create Railway migration job:**
   ```bash
   # Option 1: Apply locally to production DB
   psql $DATABASE_URL < drizzle/0001_*.sql

   # Option 2: Use drizzle migrate script
   npm run db:migrate
   ```

4. **Commit migration files:**
   ```bash
   git add drizzle/
   git commit -m "Add database migration for schema updates"
   ```

---

### 3. Deployment Strategy Issues ✅ FIXED

**Problem:**
- `npm run db:push` in start command is interactive (blocks deployment)
- Database changes during app startup cause crashes
- No proper migration strategy

**Solution Applied:**
- Removed `db:push` from nixpacks.toml start command
- Start command now only runs `npm start`
- Schema changes must be handled separately (see Option C above)

---

## Files Changed Summary

### `nixpacks.toml`
```toml
[phases.setup]
# Use Node.js 20 for canvas compatibility
nixPkgs = ["nodejs-20_x", "python3"]

# Native dependencies - added to LD_LIBRARY_PATH at runtime
nixLibs = [
  "pkg-config",
  "cairo",
  "pango",
  "libpng",
  "libjpeg",
  "giflib",
  "librsvg",
  "libuuid",
  "pixman"
]

[phases.start]
# Removed db:push - run migrations separately
cmd = "cd backend && npm start"
```

### `backend/package.json`
```json
{
  "engines": {
    "node": "20.x",
    "npm": ">=10.0.0"
  }
}
```

---

## Deployment Checklist

Before deploying:

- [ ] **Fix schema mismatches** (choose Option A, B, or C above)
- [ ] **Commit and push the nixpacks.toml changes**
- [ ] **Commit and push the package.json changes**
- [ ] **Set up Railway environment variables** (if using Option B)
- [ ] **Test deployment** on Railway
- [ ] **Monitor logs** for any canvas/libuuid errors
- [ ] **Verify app starts successfully** without db:push blocking

---

## Testing the Fixes

### 1. Test Canvas Dependency Resolution
After deployment, check logs for:
```
✅ No "libuuid.so.1" errors
✅ Canvas loads successfully
✅ PDF/document processing works
```

### 2. Test Database Connection
```
✅ App connects to database
✅ No schema mismatch errors
✅ Queries execute successfully
```

### 3. Test Full Application
```
✅ API endpoints respond
✅ Authentication works
✅ File uploads process
✅ Background jobs run
```

---

## Additional Recommendations

### 1. Set Up Separate Migration Job
For production, consider creating a separate Railway service for migrations:

```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run db:migrate"
restartPolicyType = "never"
```

### 2. Enable Database Backups
Before running migrations, enable automatic backups in Railway dashboard.

### 3. Monitor Canvas Memory Usage
Canvas can be memory-intensive. Monitor Railway metrics and upgrade plan if needed.

### 4. Consider Nixpacks Deprecation
Railway is moving to Railpack. Consider migrating for new features and better support.

---

## Rollback Plan

If deployment fails:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Restore database from backup** (if migrations were applied)

3. **Check Railway logs** for specific error messages

4. **Contact Railway support** if infrastructure issues persist

---

## Next Steps

1. ✅ Review this document
2. ⚠️ Choose and execute a schema fix option (A, B, or C)
3. ✅ Deploy the changes
4. ✅ Monitor deployment logs
5. ✅ Test application functionality
6. ✅ Document any additional issues

---

## Support Resources

- [Nixpacks Documentation](https://nixpacks.com/docs)
- [Railway Nixpacks Reference](https://docs.railway.com/reference/nixpacks)
- [Drizzle Kit Push Command](https://orm.drizzle.team/kit-docs/commands#drizzle-kit-push)
- [Canvas Package Issues](https://github.com/Automattic/node-canvas/issues)
