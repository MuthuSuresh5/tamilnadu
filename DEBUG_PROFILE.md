# Profile Update Debug Guide

## Quick Test Steps

### 1. Check Backend Health
```bash
curl https://tamilnadu-ten.vercel.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "features": {
    "cloudinary": false,  // or true if configured
    "database": true
  }
}
```

### 2. Test Profile Update WITHOUT Photo

**In Browser Console:**
```javascript
// Get your token
const token = localStorage.getItem('accessToken');

// Test update without photo
fetch('https://tamilnadu-ten.vercel.app/api/auth/profile', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test Name',
    email: 'test@example.com'
  })
})
.then(r => r.json())
.then(d => console.log('Success:', d))
.catch(e => console.error('Error:', e));
```

### 3. Check Vercel Logs

Go to: https://vercel.com/dashboard
- Select backend project
- Deployments → Latest
- View Function Logs
- Look for error messages

### 4. Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Invalid Signature" | Cloudinary not configured | Add Cloudinary credentials OR update without photo |
| "500 Internal Server Error" | Backend crash | Check Vercel logs |
| "Network error" | CORS issue | Check CLIENT_URL env var |
| "Unauthorized" | Token expired | Re-login |

### 5. Temporary Workaround

Update profile WITHOUT photo:
1. Go to Profile page
2. Change name/email/address
3. **Do NOT upload a photo**
4. Click Save
5. Should work!

### 6. Permanent Fix

**Setup Cloudinary:**
1. Sign up: https://cloudinary.com/users/register_free
2. Copy credentials from dashboard
3. Add to Vercel env vars:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Redeploy backend
5. Test photo upload

### 7. Verify Deploy

After deploying fixes:
```bash
# Check health
curl https://tamilnadu-ten.vercel.app/api/health

# Should show cloudinary: true if configured
```

---

## Still Getting "Server error"?

### Check These:

1. **MongoDB Connection**
   - Vercel logs show database errors?
   - MongoDB Atlas IP whitelist includes 0.0.0.0/0?

2. **Environment Variables**
   - All required vars set in Vercel?
   - No typos in env var names?
   - JWT_SECRET set?

3. **Code Deployment**
   - Latest code pushed to Git?
   - Vercel auto-deployed?
   - Clear Vercel cache and redeploy?

### Emergency Reset

If nothing works:
1. Vercel Dashboard → Settings → Clear Cache
2. Deployments → Redeploy (uncheck "Use existing cache")
3. Wait for deployment to complete
4. Test again

---

## Need More Help?

Share these from Vercel logs:
- Error message
- Stack trace
- Function name
- Timestamp

This will help identify the exact issue!
