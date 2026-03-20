# Deploying to Render via GitHub

## Prerequisites
- GitHub account with your code pushed ✅
- Render account (https://render.com) ✅

## Step-by-Step Deployment Instructions

### 1. **Code is Already Pushed to GitHub** ✅
Your repository is at: https://github.com/TirthAghara/Manas-Mantra

### 2. **Deploy Backend on Render**

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Click **Connect Repository** → Select `Manas-Mantra`
4. Fill in the following:

| Setting | Value |
|---------|-------|
| Name | `manas-mantra-backend` |
| Environment | `Node` |
| Build Command | `npm ci --prefix backend` |
| Start Command | `node backend/server.js` |
| Plan | Free or Paid |

5. Click **Create Web Service**
6. Wait for deployment to complete (5-10 minutes)
7. Copy the service URL (e.g., `https://manas-mantra-backend.onrender.com`)

### 3. **Deploy Frontend on Render**

1. Go back to dashboard
2. Click **New +** → **Static Site**
3. Click **Connect Repository** → Select `Manas-Mantra`
4. Fill in the following:

| Setting | Value |
|---------|-------|
| Name | `manas-mantra-frontend` |
| Build Command | `npm ci --prefix frontend && npm run build --prefix frontend` |
| Publish Directory | `frontend/dist` |
| Plan | Free |

5. Click **Create Static Site**
6. Wait for deployment (5-10 minutes)
7. Copy the site URL (e.g., `https://manas-mantra-frontend.onrender.com`)

### 4. **Configure Environment Variables**

**For Backend Service:**
1. Go to backend service → **Environment**
2. Add these variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
3. Click **Save**
4. Service will auto-redeploy

**For Frontend Service:**
1. Go to frontend service → **Environment**
2. Add this variable:
   - `REACT_APP_API_URL` = `https://manas-mantra-backend.onrender.com` (use your actual backend URL)
3. Click **Save**
4. Site will auto-rebuild

### 5. **Your App is Live!** 🎉

- **Frontend:** `https://manas-mantra-frontend.onrender.com`
- **Backend API:** `https://manas-mantra-backend.onrender.com`

## Auto-Deployment Setup

Every time you push code to GitHub, Render automatically redeploys. No manual steps needed!

```bash
git add .
git commit -m "Your changes"
git push origin main  # Render auto-deploys!
```

## Important Notes

### Environment Variables
- Free services spin down after 15 minutes of inactivity
- Always set `NODE_ENV=production` for backend
- Set correct `PORT=10000` for backend

### File Structure
```
Manas-Mantra/
├── backend/        → Node.js server
├── frontend/       → React app
├── package.json    → Root scripts
└── render.yaml     → (Optional) Multi-service config
```

### Build Times
- First build: 5-10 minutes
- Subsequent builds: 2-5 minutes
- Check logs in Render dashboard if stuck

## Troubleshooting

### "Exit status 127" Error
- Ensure all npm scripts are correct
- Check build command matches your package.json
- Verify Node.js version compatibility

### Build Fails
```
Check these files:
✓ package.json (root) - has correct scripts
✓ backend/package.json - has all dependencies
✓ frontend/package.json - has all dependencies
```

### App Won't Start
1. Check backend environment variables
2. Verify PORT is set to 10000
3. Look at logs in Render dashboard
4. Check if database.json is being created

### Frontend Can't Connect to Backend
1. Verify backend service is running
2. Check `REACT_APP_API_URL` is set correctly in frontend
3. Ensure CORS is enabled in backend (it should be by default)
4. Check backend logs for errors

### Free Tier Spins Down
- Upgrade to Paid plan to prevent spin-down
- Or use a health check to keep it awake

## Rolling Back

To revert to a previous deployment:
1. Go to your service on Render
2. Click **Deployments**
3. Find the deployment you want
4. Click **Redeploy**

## Manual Redeploy

To trigger a redeploy without pushing code:
1. Go to your service
2. Click **Manual Deploy**
3. Select the commit
4. Click **Deploy**

## Need Help?

- 📚 Render Docs: https://render.com/docs
- 🐛 Check deployment logs in Render dashboard
- 💬 Create an issue on GitHub
