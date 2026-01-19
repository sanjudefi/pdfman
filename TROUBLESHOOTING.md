# Troubleshooting Guide

## Common Issues and Solutions

### 1. "PDF failed to update" or Upload Fails

**Most Common Causes:**

#### A. Database Tables Not Created
The Prisma schema needs to be deployed to your database.

**Solution:**
```bash
# Run this command to create the database tables
npx prisma db push
```

Or on Vercel, the tables should be created automatically during the first deployment. If not, you may need to manually run migrations.

#### B. Missing Environment Variables
Check that ALL required environment variables are set in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these exist:
   - `POSTGRES_URL`
   - `PRISMA_DATABASE_URL`
   - `ANTHROPIC_API_KEY`
   - `BLOB_READ_WRITE_TOKEN` (auto-added when Blob storage is enabled)

**To check if variables are set:**
- Look at your deployment logs
- Check Settings → Environment Variables in Vercel dashboard

#### C. Vercel Blob Storage Not Enabled
The app needs Vercel Blob storage to store PDFs.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Storage tab
2. Click "Create Database"
3. Select "Blob"
4. Click "Create"
5. Redeploy your application

### 2. Viewing Error Details

**Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Your Project
2. Click on the latest Deployment
3. Navigate to "Functions" tab
4. Click on the failing function (api/upload or api/apply)
5. Review the logs for detailed error messages

**Common Error Messages:**

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid prisma.pDFDocument.create()` | Tables don't exist | Run `npx prisma db push` |
| `BLOB_READ_WRITE_TOKEN is not defined` | Blob storage not configured | Enable Vercel Blob in dashboard |
| `ANTHROPIC_API_KEY is not defined` | Missing API key | Add to environment variables |
| `Failed to fetch` | API route error | Check function logs |

### 3. Testing the API Endpoints Directly

You can test if the backend is working by calling the API directly:

**Test Upload:**
```bash
curl -X POST https://your-app.vercel.app/api/upload \
  -F "file=@test.pdf"
```

**Test Apply (after uploading):**
```bash
curl -X POST https://your-app.vercel.app/api/apply \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "YOUR_DOCUMENT_ID",
    "currentVersion": 1,
    "message": "delete page 1"
  }'
```

### 4. Database Connection Issues

**Symptoms:**
- Errors mentioning Prisma
- Connection timeout errors
- "Table does not exist" errors

**Solution:**

1. **Verify database URL is correct:**
   ```bash
   # Test connection locally
   npx prisma db push
   ```

2. **Check Prisma Accelerate connection:**
   - Make sure `PRISMA_DATABASE_URL` uses the Accelerate connection string
   - Should start with `prisma+postgres://accelerate.prisma-data.net/...`

3. **Verify POSTGRES_URL format:**
   ```
   postgres://[username]:[password]@[host]:[port]/[database]?sslmode=require
   ```

### 5. Deployment Checklist

Before each deployment, ensure:

- [ ] All environment variables are set in Vercel
- [ ] Vercel Blob storage is enabled
- [ ] Database schema is deployed (`prisma db push`)
- [ ] Build completes successfully
- [ ] No TypeScript errors

### 6. Quick Debug Steps

1. **Check deployment logs:**
   - Look for build errors
   - Check for missing dependencies

2. **Test locally first:**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Verify environment variables:**
   ```bash
   # In Vercel dashboard
   Settings → Environment Variables → Check all 4 variables exist
   ```

4. **Enable detailed logging:**
   - Vercel automatically logs all console.error() calls
   - Check Functions tab in deployment details

### 7. Still Having Issues?

**Collect this information:**

1. **Error message from browser console** (F12 → Console tab)
2. **Error from Vercel function logs** (Dashboard → Deployment → Functions)
3. **Environment variables status** (are all 4 set?)
4. **Blob storage status** (is it enabled?)

**Then check:**
- Network tab in browser dev tools (F12 → Network)
- Look for failed API calls (red responses)
- Click on them to see the error details

## Quick Fixes

### Reset Everything

If nothing works, try this reset:

1. **Delete and recreate Blob storage:**
   - Vercel Dashboard → Storage → Delete Blob → Create new Blob

2. **Redeploy environment variables:**
   ```bash
   # In Vercel dashboard, re-add:
   - POSTGRES_URL
   - PRISMA_DATABASE_URL
   - ANTHROPIC_API_KEY
   ```

3. **Trigger new deployment:**
   - Push a small change to trigger rebuild
   - Or click "Redeploy" in Vercel dashboard

4. **Verify database tables:**
   ```bash
   npx prisma studio
   # Check if PDFDocument and PDFVersion tables exist
   ```

## Contact

If the issue persists:
1. Check Vercel deployment logs for the actual error
2. Look at browser console for client-side errors
3. Review function logs for server-side errors
