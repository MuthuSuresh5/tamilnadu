# ⚡ QUICK FIX CHECKLIST

## 1️⃣ Get Cloudinary Credentials

```
🌐 Go to: https://cloudinary.com/users/register_free
📧 Sign up with email
✅ Verify email
🔑 Copy from Dashboard:
   - Cloud Name
   - API Key  
   - API Secret
```

## 2️⃣ Add to Vercel

```
🌐 Go to: https://vercel.com/dashboard
📂 Select: tamilnadu-ten (backend project)
⚙️ Click: Settings → Environment Variables
➕ Add:

   CLOUDINARY_CLOUD_NAME = dxxxxxxxx
   CLOUDINARY_API_KEY = 123456789012345
   CLOUDINARY_API_SECRET = AbCdEfGhIjKlMnOpQr
```

## 3️⃣ Redeploy

```
🚀 Deployments tab
⋮ Click 3 dots on latest
🔄 Redeploy
☐ Uncheck "Use existing cache"
✅ Confirm
```

## 4️⃣ Test

```
🌐 Open: https://tamilnadu-ten.vercel.app/api/health

✅ Should see: "cloudinary": true

📱 Then test photo upload in app
```

---

## ⚠️ COMMON ERRORS

| Error | Fix |
|-------|-----|
| cloudinary: false | Check env var names (CLOUDINARY_CLOUD_NAME) |
| Invalid Signature | Wrong API Secret or not redeployed |
| 500 Error | Check Vercel function logs |
| Still not working | Delete env vars and re-add them |

---

## 🆘 Emergency Support

**Can't upload photos at all?**

Temporary workaround - Update profile WITHOUT photo:
1. Change name/email/address
2. DON'T upload photo
3. Save
4. Should work!

Then fix Cloudinary setup later.

---

## ✅ Final Check

```bash
# In browser console:
fetch('https://tamilnadu-ten.vercel.app/api/health')
  .then(r => r.json())
  .then(d => console.log(d))

# Look for:
{
  "features": {
    "cloudinary": true,  ← MUST BE TRUE
    "database": true
  }
}
```

If cloudinary is TRUE → Photo uploads will work! ✨
If cloudinary is FALSE → Re-check env vars! 🔧
