# ⚡ **Quick Deployment - Get Live in 15 Minutes!**

## 🚀 **Fastest Way to Go Live**

### **Step 1: Run Deployment Script**
```bash
./deploy.sh
```

### **Step 2: Push to GitHub**
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### **Step 3: Deploy to Render.com**
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `baseball-schedule-manager`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:prod`
   - **Plan**: `Free`
6. Click "Create Web Service"

### **Step 4: Set Environment Variables**
In Render dashboard → Environment tab:
```
NODE_ENV=production
PORT=10000
```

### **Step 5: Wait & Test**
- Wait 5-10 minutes for deployment
- Test your live site at: `https://your-app-name.onrender.com`

---

## 🎯 **What You Get**

✅ **Live Website**: `https://your-app-name.onrender.com`  
✅ **Free Hosting**: $0/month to start  
✅ **SSL Certificate**: Automatic HTTPS  
✅ **24/7 Uptime**: Always available  
✅ **Auto-Deploy**: Updates from GitHub  

---

## 🌐 **Custom Domain (Optional)**

Want `yoursite.com` instead of the subdomain?

1. **Buy domain** ($12/year from GoDaddy/Namecheap)
2. **In Render**: Settings → Custom Domains → Add `yoursite.com`
3. **Update DNS**: Add CNAME record pointing to `your-app-name.onrender.com`
4. **Wait 24-48 hours** for DNS propagation

---

## 💰 **Cost Breakdown**

### **Free Setup**
- Hosting: $0/month
- Domain: $0 (subdomain)
- SSL: $0
- **Total: $0/month**

### **Professional Setup**
- Hosting: $7/month
- Custom Domain: $12/year ($1/month)
- **Total: $8/month**

---

## 🆘 **Need Help?**

- **Deployment Guide**: See `DEPLOYMENT-GUIDE.md`
- **Render Support**: [docs.render.com](https://docs.render.com)
- **Common Issues**: Check troubleshooting section in main guide

---

## 🎉 **You're Ready!**

Your Baseball/Softball Schedule Manager will be live and accessible to anyone, anywhere in the world!

**Start with the free tier** - you can always upgrade later! 🚀
