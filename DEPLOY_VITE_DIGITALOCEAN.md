# How to Deploy Vite App to DigitalOcean

There are two main ways to deploy your Vite application to DigitalOcean. **Option 1 (App Platform)** is recommended as it is easier, automated, and designed for static sites.

## Option 1: DigitalOcean App Platform (Recommended)
This is the easiest method. DigitalOcean will build your site from GitHub and host it globally.

### Prerequisites
1. Push your latest code to GitHub.
2. Ensure you have your Supabase and Gemini API keys ready.

### Steps
1. **Log in** to your DigitalOcean Control Panel.
2. Click **Create** -> **Apps**.
3. **Choose Source**: Select **GitHub**.
4. **Select Repository**: Choose your `bas` repository.
5. **Source Directory**:
   - If your Vite app is in the root, leave it as `/`.
   - **Important**: You have two apps in your repo (`/` and `/next-app`).
   - To deploy the **Vite** app, ensure the Source Directory is `/`.
6. **Auto-Detect**: DigitalOcean should detect it as a **Static Site**.
   - If it detects it as a Web Service, change it to **Static Site** to save money (Static sites are often free or very cheap).
7. **Build Command**: `npm run build`
8. **Output Directory**: `dist`
9. **Environment Variables**:
   - Click "Edit" next to Environment Variables.
   - Add the following keys (copy values from your `.env` file):
     - `API_KEY`
     - `SUPABASE_URL`
     - `SUPABASE_KEY`
   - *Note: Your `vite.config.ts` is configured to read these specific keys, so you don't need to rename them to `VITE_`.*
10. **Review & Create**: Click **Create Resource**.

DigitalOcean will now clone your repo, run `npm install`, `npm run build`, and host the `dist` folder.

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
4. Restart Nginx:
   ```bash
   systemctl restart nginx
   ```

### 5. Environment Variables (Droplet)
Since the build happens **locally** in this method, the environment variables must be present on your **local machine** when you run `npm run build`. The `.env` file is used during the build process to bake the values into the JavaScript files. You do **not** set them on the Nginx server.

---

## Which one should I choose?
- **App Platform**: Best for "Set it and forget it". Auto-deploys when you push to GitHub. Handles HTTPS (SSL) automatically.
- **Droplet**: Cheaper if you are hosting many apps on one server. Requires manual updates and maintenance.
