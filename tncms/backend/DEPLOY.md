# Vercel Deployment Instructions

## Clear Cache & Redeploy

If you're seeing duplicate variable errors or stale code:

1. **Go to Vercel Dashboard**
2. **Select your backend project** (tamilnadu)
3. **Settings** → **General** → **Clear Cache**
4. **Deployments** → **Redeploy** (use the three dots menu on latest deployment)
5. Check "Use existing Build Cache" is **UNCHECKED**

## Environment Variables (Required)

Set these in Vercel Dashboard → Settings → Environment Variables:

```
MONGO_URI=mongodb+srv://muthusuresh:passwordsuresh@cluster0.lcixobg.mongodb.net/tncms?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=tncms_jwt_super_secret_2024
JWT_REFRESH_SECRET=tncms_refresh_super_secret_2024
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
CLIENT_URL=https://tn-complaint.vercel.app
NODE_ENV=production
```

## MongoDB Atlas IP Whitelist

Go to MongoDB Atlas → Network Access → Add IP Address:
- Add `0.0.0.0/0` (Allow from anywhere)

## Test Endpoints

- Health: https://tamilnadu-ten.vercel.app/api/health
- Root: https://tamilnadu-ten.vercel.app/
