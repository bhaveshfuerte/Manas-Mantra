# Deploying to Render via GitHub

## Prerequisites
- GitHub account with your code pushed
- Render account (https://render.com)

## Step-by-Step Deployment Instructions

### 1. **Push Code to GitHub**
Make sure your repository is up to date on GitHub:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. **Connect GitHub to Render**
1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Click **Connect Repository**
4. Select your GitHub repository (Manas-Mantra)
5. Click **Connect**

### 3. **Configure Backend Deployment**

**Service Details:**
- Name: `manas-mantra-backend`
- Runtime: Node
- Build Command: 
  ```
  npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
  ```
- Start Command: 
  ```
  npm start
  ```

**Environment:**
- Set `NODE_ENV` = `production`
- Set `PORT` = `10000`
- Add any other environment variables your app needs

**Plan:** Free or Paid (recommended)

Click **Create Web Service** and wait for deployment.

### 4. **Configure Frontend Deployment**

Once backend is running:

1. Click **New +** → **Static Site**
2. Connect the same GitHub repository
3. 
**Service Details:**
- Name: `manas-mantra-frontend`
- Build Command: 
  ```
  npm install --prefix frontend && npm run build --prefix frontend
  ```
- Publish Directory: `frontend/dist`

Click **Create Static Site** and wait for deployment.

### 5. **Connect Frontend to Backend**

After frontend is deployed, update your frontend API calls to use the backend URL:

In your frontend code (e.g., `src/api.js` or similar):
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-backend-service.onrender.com';
```

Then in Render frontend settings, add environment variable:
- `REACT_APP_API_URL` = `https://manas-mantra-backend.onrender.com`

### 6. **View Your Live Application**
- Backend: `https://manas-mantra-backend.onrender.com`
- Frontend: `https://manas-mantra-frontend.onrender.com`

## Important Notes

- **Free Tier Limitation:** Free services spin down after 15 minutes of inactivity
- **Builds:** First deployment may take 5-10 minutes
- **Logs:** Monitor deployment progress in Render dashboard
- **Auto-Deploy:** Every push to GitHub automatically triggers a new deployment

## Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Ensure `package.json` has correct build scripts
- Verify all dependencies are listed

### App Won't Start
- Check environment variables are set correctly
- Review start logs in Render dashboard
- Ensure PORT is set to `10000`

### Frontend Can't Connect to Backend
- Verify backend is running
- Update `REACT_APP_API_URL` in frontend
- Check CORS settings in backend

## Rolling Back

To revert to a previous deployment:
1. Go to Render Dashboard
2. Select your service
3. Click **Deployments**
4. Click the deployment you want to restore
5. Click **Redeploy**
