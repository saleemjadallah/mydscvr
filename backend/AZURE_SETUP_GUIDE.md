# Azure Document Intelligence Setup Guide

Complete step-by-step guide to set up Azure Document Intelligence for the AI Form Filler feature.

---

## Prerequisites

- Azure account (free tier available)
- Credit card for verification (free tier has generous limits)
- Access to Azure Portal: https://portal.azure.com

---

## Step 1: Create Azure Account (If Needed)

1. Go to https://azure.microsoft.com/free/
2. Click **Start free**
3. Sign in with Microsoft account or create new one
4. Complete verification (requires credit card, but won't charge for free tier)
5. You get:
   - **$200 USD credit** for 30 days
   - **12 months of free services**
   - **Always free services** (Document Intelligence included)

---

## Step 2: Access Azure Portal

1. Go to https://portal.azure.com
2. Sign in with your Azure account
3. You should see the Azure dashboard

---

## Step 3: Create Document Intelligence Resource

### 3.1 Navigate to Create Resource

1. On Azure Portal home, click **"+ Create a resource"** (top left)

   OR

2. Use the search bar at the top and type **"Document Intelligence"**

### 3.2 Select Document Intelligence

1. In the Marketplace, search for **"Azure AI Document Intelligence"** or **"Form Recognizer"** (old name)
2. Click on **Azure AI Document Intelligence**
3. Click **Create** button

### 3.3 Configure Basic Settings

You'll see a form with several tabs. Fill in **Basics** tab:

**Project Details:**
- **Subscription**: Select your Azure subscription (likely "Free Trial" or "Pay-As-You-Go")
- **Resource Group**:
  - Click **"Create new"**
  - Name it: `mydscvr-resources` or `form-filler-rg`
  - Click **OK**

**Instance Details:**
- **Region**: Choose closest to your users
  - For GCC market: **"UAE North"** or **"West Europe"**
  - For US: **"East US"** or **"West US 2"**
  - For global: **"East US"** (most services available)

- **Name**: Give it a unique name (lowercase, no spaces)
  - Example: `mydscvr-document-intelligence`
  - Example: `formfiller-doc-ai`
  - Must be globally unique across all Azure

- **Pricing Tier**: Select **Free F0**
  - ✅ **500 pages/month FREE**
  - ✅ Perfect for development and testing
  - ✅ 20 calls per minute
  - Can upgrade later to **S0 (Standard)** if needed

### 3.4 Review Network Settings (Optional)

1. Click **Next: Network >** tab
2. For development, keep default: **"All networks, including the internet"**
3. For production, can restrict to specific IPs later

### 3.5 Review Identity Settings (Optional)

1. Click **Next: Identity >** tab
2. Keep defaults (System assigned: Off)

### 3.6 Review Tags (Optional)

1. Click **Next: Tags >** tab
2. Optional: Add tags for organization
   - Key: `Environment`, Value: `Development`
   - Key: `Project`, Value: `MYDSCVR`

### 3.7 Review and Create

1. Click **Next: Review + create >**
2. Azure will validate your configuration
3. Review the summary:
   - Check pricing tier is **Free F0**
   - Verify region
   - Confirm name
4. Click **Create** button
5. Wait for deployment (usually 1-2 minutes)
6. When complete, click **"Go to resource"**

---

## Step 4: Get Your API Credentials

### 4.1 Find Keys and Endpoint

1. In your Document Intelligence resource, look at left sidebar
2. Under **"Resource Management"** section, click **"Keys and Endpoint"**

You'll see three important pieces of information:

### 4.2 Copy Endpoint URL

- **Endpoint**: Looks like `https://your-resource-name.cognitiveservices.azure.com/`
- Click the **Copy** icon next to it
- Save this for later

### 4.3 Copy API Key

You'll see two keys:
- **KEY 1**: Primary key
- **KEY 2**: Secondary key (backup)

**Copy KEY 1:**
- Click **Show Keys** if hidden
- Click the **Copy** icon next to KEY 1
- Save this for later

> **Important**: Keep these credentials secret! They provide full access to your Azure service.

---

## Step 5: Add Credentials to Your Backend

### 5.1 Open Your .env File

Navigate to your backend directory and open `.env` file:

```bash
cd /Users/saleemjadallah/Desktop/MyDscvr-Headshot/backend
```

### 5.2 Add Azure Credentials

Add these two lines to your `.env` file (replace with your actual values):

```env
# Azure Document Intelligence (for AI Form Filler)
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://your-resource-name.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=your_actual_key_from_azure_portal_here
```

**Example:**
```env
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://mydscvr-document-intelligence.cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 5.3 Save the File

Save your `.env` file. The backend will automatically use these credentials.

---

## Step 6: Verify Setup

### 6.1 Check Environment Variables

Create a quick test file to verify:

```bash
cd /Users/saleemjadallah/Desktop/MyDscvr-Headshot/backend
node -e "require('dotenv').config(); console.log('Endpoint:', process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT); console.log('Key exists:', !!process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY);"
```

You should see:
```
Endpoint: https://your-resource-name.cognitiveservices.azure.com/
Key exists: true
```

### 6.2 Test with Backend

Start your backend server:

```bash
npm run dev
```

The console should show:
```
[Document Router] Azure Document Intelligence is configured
```

If you see this, setup is successful! ✅

---

## Step 7: Monitor Usage (Free Tier Limits)

### 7.1 View Usage

1. In Azure Portal, go to your Document Intelligence resource
2. Left sidebar → **Monitoring** → **Metrics**
3. Select metric: **Total Calls**
4. View usage over time

### 7.2 Free Tier Limits

**Free F0 Tier:**
- ✅ **500 pages/month** for Custom/Layout model
- ✅ **500 pages/month** for Prebuilt models (ID, Invoice, etc.)
- ✅ **20 requests per minute** rate limit
- ✅ **No expiration** (free forever as long as within limits)

**What happens if you exceed?**
- Service returns 429 error (rate limit exceeded)
- Our system automatically falls back to Gemini Flash
- No charges to your credit card on Free tier

### 7.3 Estimated Usage for Form Filler

Based on your expected traffic:

**Development/Testing:**
- ~50-100 forms/month
- Well within free tier ✅

**Production (1,000 forms/month):**
- Need to upgrade to Standard S0
- Cost: ~$10/month (1,000 pages × $0.01/page)
- Still profitable with $13,600/month revenue

---

## Step 8: Upgrade to Standard (When Needed)

### 8.1 When to Upgrade

Upgrade to **Standard S0** when:
- Processing > 500 pages/month
- Need higher rate limits (15 requests/second)
- Ready for production at scale

### 8.2 How to Upgrade

1. Go to your Document Intelligence resource
2. Left sidebar → **Settings** → **Pricing tier**
3. Click **Change**
4. Select **Standard S0**
5. Click **Select**
6. Confirm the change

**Standard S0 Pricing:**
- $1.00 per 1,000 pages (first 1M pages)
- $0.50 per 1,000 pages (over 1M pages)
- No monthly minimum
- 15 requests per second

### 8.3 Cost Comparison

| Tier | Pages/Month | Cost/Month | Use Case |
|------|-------------|------------|----------|
| **Free F0** | 500 | $0 | Development, Testing |
| **Standard S0** | 1,000 | ~$1 | Small production |
| **Standard S0** | 10,000 | ~$10 | Medium production |
| **Standard S0** | 100,000 | ~$100 | Large production |

---

## Step 9: Alternative - Use Gemini Only (No Azure)

If you want to skip Azure entirely:

### 9.1 Simply Don't Set Azure Variables

In your `.env` file, **DON'T add** (or comment out):
```env
# AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=
# AZURE_DOCUMENT_INTELLIGENCE_KEY=
```

### 9.2 System Automatically Uses Gemini

The document router will detect Azure is not configured and automatically use Gemini Flash for all extractions.

**Gemini Flash Limits:**
- ✅ **7,500 requests/month FREE**
- ✅ Good accuracy (slightly lower than Azure)
- ✅ Better for handwritten/poor quality
- ✅ No setup required (you already have GEMINI_API_KEY)

**When to use Gemini-only:**
- Testing/development phase
- Low volume (<7,500 forms/month)
- Budget constraints
- Forms with lots of handwriting

---

## Step 10: Best Practices

### 10.1 Security

✅ **DO:**
- Keep API keys in `.env` file (never commit to Git)
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys periodically (every 90 days)

❌ **DON'T:**
- Hardcode keys in source code
- Share keys publicly
- Commit `.env` to version control
- Use same keys for dev/prod

### 10.2 Cost Optimization

1. **Use Free Tier for Development**
   - Perfect for testing and development
   - No charges until you upgrade

2. **Monitor Usage**
   - Set up Azure alerts for 80% quota usage
   - Track costs in Azure Cost Management

3. **Smart Fallback**
   - System automatically falls back to Gemini if Azure fails
   - Minimizes service disruption

4. **Cache Results**
   - For repeat forms, cache extraction results
   - Reduce API calls

### 10.3 Monitoring

1. **Set Up Alerts**
   - In Azure Portal → Your Resource → Alerts
   - Create alert for "Total Calls" > 400/month (80% of free tier)
   - Get email notification before hitting limit

2. **Track Performance**
   - Monitor extraction accuracy
   - Compare Azure vs Gemini performance
   - Track processing times

---

## Troubleshooting

### Issue: "Authentication failed"

**Cause:** Invalid key or endpoint

**Fix:**
1. Verify key is copied correctly (no extra spaces)
2. Check endpoint has `/` at the end
3. Verify resource is created and deployed
4. Try KEY 2 if KEY 1 doesn't work

### Issue: "Resource not found"

**Cause:** Endpoint URL incorrect

**Fix:**
1. Go to Azure Portal → Your Resource → Keys and Endpoint
2. Copy endpoint exactly as shown
3. Should end with `.cognitiveservices.azure.com/`

### Issue: "429 Rate limit exceeded"

**Cause:** Exceeded 20 requests/minute on Free tier

**Fix:**
1. Add rate limiting in your code
2. Upgrade to Standard S0 (15 req/sec)
3. System automatically falls back to Gemini

### Issue: "Quota exceeded"

**Cause:** Used all 500 free pages this month

**Fix:**
1. Wait for next month (quota resets)
2. Upgrade to Standard S0
3. System falls back to Gemini automatically

### Issue: "Service unavailable"

**Cause:** Azure region outage (rare)

**Fix:**
1. System automatically falls back to Gemini
2. Check Azure Status: https://status.azure.com
3. Wait for service restoration

---

## Quick Reference

### Your Credentials Format

```env
AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=https://[your-resource-name].cognitiveservices.azure.com/
AZURE_DOCUMENT_INTELLIGENCE_KEY=[32-character-alphanumeric-key]
```

### Azure Portal Quick Links

- **Portal Home**: https://portal.azure.com
- **Cost Management**: Portal → Cost Management + Billing
- **All Resources**: Portal → All Resources
- **Monitor Usage**: Your Resource → Monitoring → Metrics

### Support Resources

- **Azure Documentation**: https://learn.microsoft.com/azure/ai-services/document-intelligence/
- **Pricing Calculator**: https://azure.microsoft.com/pricing/calculator/
- **Support**: Portal → Help + Support
- **Status Page**: https://status.azure.com

---

## Summary Checklist

- [ ] Created Azure account
- [ ] Created Document Intelligence resource (Free F0)
- [ ] Copied endpoint URL
- [ ] Copied API key (KEY 1)
- [ ] Added credentials to `.env` file
- [ ] Verified setup with test command
- [ ] Started backend server successfully
- [ ] (Optional) Set up usage alerts
- [ ] Documented credentials securely

---

**Congratulations!** 🎉

Your Azure Document Intelligence is now set up and ready to power the AI Form Filler feature. The system will use Azure for high-quality PDFs and automatically fall back to Gemini for edge cases.

**Estimated Setup Time:** 10-15 minutes

**Cost for Development:** $0 (Free tier)

**Next Steps:**
1. Test with a sample PDF form
2. Monitor accuracy and performance
3. When ready for production, upgrade to Standard S0

---

*Last Updated: 2025-01-18*
*For: MYDSCVR AI Form Filler Feature*
