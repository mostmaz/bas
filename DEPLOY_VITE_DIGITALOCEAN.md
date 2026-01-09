# How to Deploy Vite App to DigitalOcean

There are two main ways to deploy your Vite application to DigitalOcean. **Option 1 (App Platform)** is recommended as it is easier, automated, and designed for static sites.

## Option 1: DigitalOcean App Platform (Docker)
We have switched to using a **Dockerfile** to allow for custom Nginx caching rules.

### Steps
1. **Log in** to your DigitalOcean Control Panel.
2. **Create App**: Select GitHub -> `bas` repo.
3. **Auto-Detect**: It should now detect a **Dockerfile**.
4. **Resources**: Select **Web Service** (Basic or Pro).
   - *Note: This is slightly more expensive than a Static Site ($5/mo vs Free/Cheap), but required for custom caching.*
5. **Environment Variables**:
   - Add your `SUPABASE_URL` and `SUPABASE_KEY` here. They will be injected during the build.
6. **Deploy**.

> [!NOTE]
> **Caching Fixed**: We are now using a custom `nginx.conf` inside the container which sets `Cache-Control: public, max-age=31536000` for all static assets. This will solve the PageSpeed Insights warning.

---

## Option 2: DigitalOcean Droplet (VPS) with Nginx
Use this if you already have a server or want full control.

### 1. Build Locally
Run this on your machine:
```bash
npm run build
```
This creates a `dist` folder in your project root.

### 2. Set up the Droplet
1. Create a Droplet (Ubuntu 22.04 or 24.04).
2. SSH into your droplet: `ssh root@your_droplet_ip`
3. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```

### 3. Upload Your Code
From your **local machine**, upload the `dist` folder to the server using `scp` (replace with your actual IP):
```bash
scp -r dist/* root@your_droplet_ip:/var/www/html/
```

### 4. Configure Nginx for SPA (Single Page App)
Since Vite is an SPA, you need to redirect all 404s to `index.html` so routing works.

1. Edit the default config:
   ```bash
   nano /etc/nginx/sites-available/default
   ```
2. Replace the `location /` block with this:
   ```nginx
   server {
       listen 80 default_server;
       listen [::]:80 default_server;

       root /var/www/html;
       index index.html;

       server_name _;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
3. Save and exit (Ctrl+O, Enter, Ctrl+X).
   ```
3. Save and exit (Ctrl+O, Enter, Ctrl+X).
4. Restart Nginx:
   ```bash
   systemctl restart nginx
   ```

### 5. Enable Caching (Nginx)
To fix the "Serve static assets with an efficient cache policy" warning, add this block inside your `server` block (before `location /`):

```nginx
    # Cache static assets (images, css, js) for 1 year
    location ~* \.(?:jpg|jpeg|gif|png|ico|cur|gz|svg|svgz|mp4|ogg|ogv|webm|htc|css|js)$ {
        expires 1y;
        access_log off;
        add_header Cache-Control "public";
    }
```

### 6. Environment Variables (Droplet)
Since the build happens **locally** in this method, the environment variables must be present on your **local machine** when you run `npm run build`. The `.env` file is used during the build process to bake the values into the JavaScript files. You do **not** set them on the Nginx server.

---

## Which one should I choose?
- **App Platform**: Best for "Set it and forget it". Auto-deploys when you push to GitHub. Handles HTTPS (SSL) automatically.
- **Droplet**: Cheaper if you are hosting many apps on one server. Requires manual updates and maintenance.
