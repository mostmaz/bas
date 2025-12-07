# BasCavarat - Digital Ocean Deployment Guide

## 🚀 Quick Deploy to Digital Ocean

### Prerequisites
- Digital Ocean account
- Docker installed locally (for testing)
- Your Supabase credentials

### Method 1: Digital Ocean App Platform (Recommended - Easiest)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Deploy on Digital Ocean**
   - Go to [Digital Ocean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Select "GitHub" and authorize
   - Choose your repository
   - Digital Ocean will auto-detect Next.js
   - Set environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
     ```
   - Click "Deploy"

**Cost:** $5-12/month (Basic plan)
**Performance:** Auto-scaling, CDN included

---

### Method 2: Digital Ocean Droplet with Docker (More Control)

1. **Create a Droplet**
   - Go to Digital Ocean Dashboard
   - Create Droplet (Ubuntu 22.04)
   - Size: Basic ($6/month minimum)
   - Add SSH key

2. **SSH into your Droplet**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

4. **Clone your repository**
   ```bash
   git clone YOUR_REPO_URL
   cd next-app
   ```

5. **Create .env file**
   ```bash
   nano .env.production
   ```
   Add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

6. **Build and run Docker container**
   ```bash
   docker build -t bascavarat .
   docker run -d -p 80:3000 --env-file .env.production --name bascavarat-app bascavarat
   ```

7. **Set up auto-restart**
   ```bash
   docker update --restart unless-stopped bascavarat-app
   ```

**Cost:** $6-12/month
**Performance:** Full control, requires manual scaling

---

### Method 3: Digital Ocean Container Registry + App Platform (Best Performance)

1. **Install doctl CLI**
   ```bash
   # Windows (PowerShell)
   choco install doctl
   
   # Or download from: https://github.com/digitalocean/doctl/releases
   ```

2. **Authenticate**
   ```bash
   doctl auth init
   ```

3. **Create Container Registry**
   ```bash
   doctl registry create bascavarat-registry
   doctl registry login
   ```

4. **Build and push image**
   ```bash
   docker build -t registry.digitalocean.com/bascavarat-registry/app:latest .
   docker push registry.digitalocean.com/bascavarat-registry/app:latest
   ```

5. **Deploy to App Platform**
   - Use the container image in App Platform
   - Set environment variables
   - Deploy

**Cost:** $12-20/month (includes registry)
**Performance:** Best - CDN, auto-scaling, zero-downtime deploys

---

## 🔧 Environment Variables

Required for all methods:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 Performance Optimizations Included

✅ **Image Optimization**
- WebP/AVIF formats
- Automatic resizing
- Lazy loading

✅ **Caching**
- Static assets: 1 year cache
- API responses: Client-side cache
- CDN caching (if using App Platform)

✅ **Bundle Optimization**
- Tree shaking
- Code splitting
- Minification
- Gzip compression

✅ **Security Headers**
- XSS protection
- Clickjacking prevention
- Content type sniffing prevention

---

## 🎯 Recommended Setup for Your Use Case

**For BasCavarat (E-commerce):**
- **Best Choice:** Digital Ocean App Platform (Method 1)
- **Why:** 
  - Automatic SSL
  - Global CDN
  - Auto-scaling
  - Zero-downtime deploys
  - Managed infrastructure

**Expected Performance:**
- First Load: 0.8-1.2s
- Subsequent Loads: 0.2-0.4s
- Lighthouse Score: 90-95

---

## 🚦 Testing Before Deploy

```bash
# Build production locally
npm run build

# Test production build
npm start

# Test Docker build
docker build -t bascavarat-test .
docker run -p 3000:3000 bascavarat-test
```

---

## 📝 Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify admin dashboard works
- [ ] Test product images load
- [ ] Check Supabase connection
- [ ] Test order placement
- [ ] Verify mobile responsiveness
- [ ] Check SSL certificate
- [ ] Set up custom domain (optional)

---

## 🆘 Troubleshooting

**Images not loading?**
- Check CORS settings in Supabase
- Verify image URLs in next.config.ts

**Supabase connection fails?**
- Verify environment variables
- Check Supabase project is active
- Confirm API keys are correct

**Slow performance?**
- Enable CDN in Digital Ocean
- Check database query performance
- Monitor with Digital Ocean metrics

---

## 💰 Cost Breakdown

| Method | Monthly Cost | Best For |
|--------|-------------|----------|
| App Platform | $5-12 | Most users (recommended) |
| Droplet + Docker | $6-12 | Advanced users |
| Container Registry | $12-20 | High traffic sites |

---

## 📞 Support

For deployment issues:
1. Check Digital Ocean docs: https://docs.digitalocean.com
2. Next.js deployment guide: https://nextjs.org/docs/deployment
3. Supabase connection guide: https://supabase.com/docs

---

**Ready to deploy? Start with Method 1 (App Platform) - it's the easiest and most reliable!**
