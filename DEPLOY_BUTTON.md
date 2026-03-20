# 🚀 Deploy to Render - One Click!

## Fastest Way to Deploy

Click the button below to deploy your Manas Mantra application to Render with a single click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/TirthAghara/Manas-Mantra&branch=main)

---

## What This Does

✅ **Automatically configures:**
- Backend Node.js service on `10000` port
- Frontend static site serving React build
- Environment variables
- Auto-deployment on every GitHub push
- CORS enabled for cross-origin requests

---

## After Clicking Deploy

1. **Sign in with GitHub** (if not already signed in to Render)
2. **Review the deployment plan** (should show backend + frontend)
3. **Click "Deploy"** and wait 5-10 minutes
4. **Get your live URLs:**
   - Backend: `https://your-backend-name.onrender.com`
   - Frontend: `https://your-frontend-name.onrender.com`

---

## Manual Deployment Alternative

If the button doesn't work, follow the detailed instructions in [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

---

## Important Configuration Notes

### Environment Variables
After deployment, add these to your backend service settings in Render dashboard:
- `NODE_ENV` = `production`
- `PORT` = `10000`

### Connect Frontend to Backend
In your Render frontend settings, add:
- `REACT_APP_API_URL` = `https://your-backend-service.onrender.com`

Then redeploy the frontend.

---

## Troubleshooting

**Build fails?**
- Check the build logs in Render dashboard
- Ensure Node.js and npm are compatible

**App won't start?**
- Verify PORT is set to 10000
- Check environment variables are correct

**Frontend can't connect to backend?**
- Make sure backend service is running
- Update REACT_APP_API_URL correctly
- Check CORS is enabled in backend

---

## Need Help?

📚 Full documentation: [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
🔗 Render Docs: https://render.com/docs
💬 GitHub Issues: Create an issue in this repository
