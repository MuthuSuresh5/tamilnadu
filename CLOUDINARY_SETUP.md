# Cloudinary Setup Guide

## 🚨 Error: Invalid Signature

This error means Cloudinary credentials are not configured or are invalid.

---

## ✅ Solution: Get Cloudinary Credentials

### Step 1: Create Free Cloudinary Account

1. Go to: https://cloudinary.com/users/register_free
2. Sign up with email
3. Verify email

### Step 2: Get Your Credentials

After login, go to **Dashboard**. You'll see:

```
Cloud Name: dxxxxxx
API Key: 123456789012345
API Secret: AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Step 3: Update Vercel Environment Variables

**Backend Project** → Settings → Environment Variables:

```env
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=AbCdEfGhIjKlMnOpQrStUvWxYz
```

### Step 4: Redeploy

Go to **Deployments** → Latest → **Redeploy**

---

## 🎁 Cloudinary Free Tier

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ Unlimited transformations
- ✅ Image optimization
- ✅ Perfect for this project!

---

## 📝 Why Cloudinary?

1. **Vercel Serverless Issue**: Vercel has read-only filesystem
2. **File Uploads**: Can't store files locally on Vercel
3. **Solution**: Use Cloudinary for image storage
4. **Alternative**: AWS S3, but Cloudinary is easier

---

## 🔧 Temporary Workaround (Local Only)

If you want to test locally without Cloudinary:

1. Remove Cloudinary env vars (leave empty)
2. Files will save to `backend/uploads/` folder
3. **WARNING**: Won't work on Vercel!

---

## ✅ After Setup

Test by:
1. Login to your app
2. Go to Profile
3. Upload profile photo
4. Should work! ✨

---

## 🆘 Still Not Working?

Check Vercel logs:
1. Go to Vercel Dashboard
2. Deployments → Latest
3. View Function Logs
4. Look for Cloudinary errors

Or check:
- Are env vars saved correctly?
- Did you redeploy after adding env vars?
- Are credentials copied correctly (no extra spaces)?
