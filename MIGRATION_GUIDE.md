# BasCavarat Next.js Migration Guide

We have successfully migrated the application to **Next.js** to improve performance, SEO, and mobile experience.

## Key Improvements
1.  **Image Optimization**: All images are now automatically resized and compressed using `next/image`.
2.  **SEO**: Server-side rendering ensures Google can see your products.
3.  **PWA**: The app is installable on mobile devices with a proper manifest and service worker.
4.  **Performance**: Faster initial load times.

## How to Run the New App

The new application is located in the `next-app` directory.

### Development
To start the development server:

```bash
cd next-app
npm run dev
```

The app will be available at `http://localhost:3000`.

### Production Build
To build for production:

```bash
cd next-app
npm run build
npm start
```

## Directory Structure
-   `src/app`: Main application pages (Home, Product Details).
-   `src/components`: Reusable UI components.
-   `src/lib`: Utility functions and constants.
-   `public`: Static assets (images, manifest, service worker).
