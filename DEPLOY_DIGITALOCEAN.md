# Deploying BasCavarat to Digital Ocean

This guide outlines how to deploy the BasCavarat Next.js application to Digital Ocean.

## Option 1: Digital Ocean App Platform (Recommended)

The App Platform is the easiest way to deploy Next.js applications. It handles SSL, scaling, and build processes automatically.

### Prerequisites
1. A Digital Ocean account.
2. The project pushed to a GitHub repository.

### Steps
1. **Log in to Digital Ocean** and go to **Apps** -> **Create App**.
2. **Choose Source**: Select **GitHub** and authorize Digital Ocean to access your repository.
3. **Select Repository**: Choose the `bas` repository and the `main` branch.
4. **Source Directory**: 
   - Click "Edit" next to the source directory.
   - Select `/next-app` as the source directory (since the Next.js app is in a subdirectory).
   - Click **Save**.
5. **Resources**:
   - Digital Ocean might detect **two components**:
     1. **Node.js** (detected from the root folder).
     2. **Docker** (detected from the `/next-app` folder).
   - **Action**: 
     - Find the **Node.js** component in the list and click the **Trash/Delete icon** next to it.
     - Keep **ONLY** the **Docker** component.
   - **Configuration for Docker Component**:
     - Ensure "Source Directory" is `/next-app`.
     - Choose a plan (Basic is fine).

### Performance Tips for Digital Ocean
1. **Enable CDN**: In the App Platform settings, go to the **Settings** tab and enable **Content Delivery Network (CDN)**. This will cache your static assets (images, CSS, JS) globally, making the site much faster for users in different regions.
2. **Scale Up (If needed)**: If the site feels slow, you can upgrade the container size in the **Resources** tab. The "Basic" plan with 1GB RAM is a good starting point, but 2GB is better for production traffic.
3. **Database Region**: Ensure your Supabase database region is close to your Digital Ocean region (e.g., both in Frankfurt or London) to minimize latency.
4. **Image Compression**: I have implemented **automatic client-side image compression** in the Admin Dashboard. When you upload product images, they are now automatically compressed before being sent to Supabase. This saves bandwidth and makes images load faster for your customers.

6. **Environment Variables**:
   - Click **Edit** next to Environment Variables.
   - Add the following variables (copy them from your `.env.local` or Supabase dashboard):
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
7. **Build Command**:
   - Ensure the build command is `npm run build`.
8. **Start Command**:
   - Ensure the start command is `npm start`.
9. **Review and Create**:
   - Click **Next** and then **Create Resources**.

Digital Ocean will now build and deploy your application. You will get a live URL (e.g., `https://bas-cavarat-xyz.ondigitalocean.app`).

---

## Option 2: Deploying via Docker (Droplet)

If you prefer full control or want to use a VPS (Droplet).

### Prerequisites
1. A Digital Ocean Droplet (Ubuntu 22.04 recommended) with Docker installed.
2. SSH access to the Droplet.

### Steps

1. **SSH into your Droplet**:
   ```bash
   ssh root@your_droplet_ip
   ```

2. **Clone the Repository**:
   ```bash
   git clone https://github.com/mostmaz/bas.git
   cd bas/next-app
   ```

3. **Create Environment File**:
   Create a `.env.local` file with your production keys:
   ```bash
   nano .env.local
   ```
   Paste your variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. **Build the Docker Image**:
   ```bash
   docker build -t bascavarat .
   ```

5. **Run the Container**:
   ```bash
   docker run -d -p 3000:3000 --name bas-app --restart always bascavarat
   ```

6. **Setup Nginx & SSL (Optional but Recommended)**:
   - Install Nginx and Certbot.
   - Configure Nginx to proxy requests from port 80/443 to port 3000.

## Post-Deployment Checks

1. **Verify Supabase Connection**:
   - Open the live URL.
   - Check if products are loading.
   - If you see "Demo Mode", check your Environment Variables in Digital Ocean settings.

2. **Test Admin Access**:
   - Go to `/admin` (or search "admin" in the search bar).
   - Verify you can manage products.
