# Deployment Guide

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with GitHub
   - Click "Import Project"
   - Select your repository

3. **Configure Project**:
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `prisma generate && next build` (from vercel.json)
   - Output Directory: `.next` (default)

4. **Add Environment Variables**:

   Click "Environment Variables" and add:

   ```
   POSTGRES_URL=your_postgres_connection_url

   PRISMA_DATABASE_URL=your_prisma_accelerate_url

   ANTHROPIC_API_KEY=your_claude_api_key
   ```

   **Note**: Use the actual values from your .env file (already configured locally).

5. **Enable Vercel Blob Storage**:
   - After deployment, go to your project dashboard
   - Navigate to **Storage** tab
   - Click **Create Database**
   - Select **Blob**
   - Click **Create**
   - Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add POSTGRES_URL
   vercel env add PRISMA_DATABASE_URL
   vercel env add ANTHROPIC_API_KEY
   ```

5. **Enable Blob Storage**:
   - Go to Vercel dashboard → Your project → Storage → Create Blob store

6. **Redeploy with environment variables**:
   ```bash
   vercel --prod
   ```

## Post-Deployment Setup

### 1. Initialize Database

The database schema is already defined in `prisma/schema.prisma`. Prisma Accelerate will handle the connection pooling automatically.

### 2. Test the Application

1. Visit your deployed URL
2. Upload a sample PDF
3. Try an editing command: "Replace 'test' with 'demo'"
4. Verify the PDF updates in real-time

### 3. Monitor Logs

View real-time logs:
```bash
vercel logs
```

Or in the Vercel dashboard: Project → Deployments → [Latest] → Function Logs

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `POSTGRES_URL` | PostgreSQL database connection string | ✅ Yes |
| `PRISMA_DATABASE_URL` | Prisma Accelerate connection string | ✅ Yes |
| `ANTHROPIC_API_KEY` | Claude API key for AI editing | ✅ Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token | ✅ Yes (auto-added) |

## Vercel Configuration

The `vercel.json` file configures:

- **Python Runtime**: For the PDF editing service (`api/pdf-edit.py`)
- **Max Duration**: 60s for Python functions (PDF processing can be intensive)
- **Build Command**: Runs Prisma generation before Next.js build

```json
{
  "functions": {
    "api/pdf-edit.py": {
      "runtime": "python3.9",
      "maxDuration": 60
    }
  },
  "buildCommand": "prisma generate && next build"
}
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with Prisma errors

**Solution**:
```bash
# Locally test the build
npm run build

# If successful, try deploying again
vercel --prod
```

### Python Function Timeout

**Issue**: Large PDFs timeout after 60 seconds

**Solutions**:
- Optimize PDF processing (reduce page count before editing)
- Consider upgrading Vercel plan for longer timeouts
- Split large operations into multiple smaller edits

### Blob Storage Not Working

**Issue**: Upload fails with blob storage errors

**Solutions**:
1. Verify Blob store is created in Vercel dashboard
2. Check `BLOB_READ_WRITE_TOKEN` exists in environment variables
3. Redeploy after adding the token

### Claude API Rate Limits

**Issue**: Too many requests to Claude API

**Solutions**:
- Check your API quota at console.anthropic.com
- Implement rate limiting on the client side
- Consider upgrading your Claude API plan

## Cost Estimation

### Vercel (Hobby Plan - Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ Serverless Functions: 100 hours/month
- ⚠️ May need Pro plan for higher usage

### Vercel Blob Storage
- Free tier: 500MB storage, 1GB bandwidth
- Paid: $0.15/GB storage, $0.30/GB bandwidth

### Prisma Accelerate
- Free tier available
- Check pricing at prisma.io/pricing

### Anthropic Claude API
- Pay-per-token usage
- Check current pricing at anthropic.com/pricing
- Estimated: ~$0.01-0.05 per edit (depends on PDF size)

## Production Checklist

- [ ] Environment variables configured
- [ ] Vercel Blob storage enabled
- [ ] Database schema pushed
- [ ] Test PDF upload
- [ ] Test editing commands
- [ ] Monitor function logs
- [ ] Set up error tracking (optional: Sentry)
- [ ] Configure custom domain (optional)
- [ ] Enable Web Analytics (optional)

## Support

For issues:
1. Check Vercel function logs
2. Review error messages in browser console
3. Test API endpoints individually
4. Verify environment variables are set correctly

## Scaling Considerations

When your app grows:

1. **Database**: Migrate to dedicated PostgreSQL (e.g., Vercel Postgres, Supabase)
2. **Storage**: Consider AWS S3 or Cloudflare R2 for larger volumes
3. **PDF Processing**: Move to dedicated service (e.g., AWS Lambda, Fly.io)
4. **Caching**: Add Redis for frequently accessed PDFs
5. **CDN**: Use Vercel Edge Network for global distribution
