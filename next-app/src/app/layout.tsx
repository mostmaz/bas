import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { ToastProvider } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";

import { AiAssistant } from "@/components/AiAssistant";
import { FloatingNav } from "@/components/FloatingNav";

const cairo = Cairo({ subsets: ["latin", "arabic"] });

export const metadata: Metadata = {
  title: "BasCavarat | Premium Mobile Accessories",
  description: "Discover premium mobile accessories, cases, and gadgets at BasCavarat. Shop the latest trends with fast shipping and quality guarantee.",
  manifest: "/manifest.json",
  themeColor: "#9333EA",
  openGraph: {
    type: "website",
    url: "https://bascavarat.com/",
    title: "BasCavarat | Premium Mobile Accessories",
    description: "Discover premium mobile accessories, cases, and gadgets at BasCavarat.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "BasCavarat | Premium Mobile Accessories",
    description: "Discover premium mobile accessories, cases, and gadgets at BasCavarat.",
    images: ["/logo.png"],
  },
};

import { getCachedProducts, getCachedBrands, getCachedDevices, getCachedSlides } from "@/lib/server-data";

import { SplashScreen } from "@/components/SplashScreen";

import AppUrlListener from "@/components/AppUrlListener";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch data on the server with caching
  const [products, brands, devices, slides] = await Promise.all([
    getCachedProducts(),
    getCachedBrands(),
    getCachedDevices(),
    getCachedSlides()
  ]);

  const initialData = {
    products,
    brands,
    devices,
    slides
  };

  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
        <ToastProvider>
          <ShopProvider initialData={initialData}>
            <AppUrlListener />
            <SplashScreen />
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <CartDrawer />
              <main className="flex-grow">
                {children}
              </main>
              <AiAssistant />
              <FloatingNav />

            </div>
          </ShopProvider>
        </ToastProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registration successful with scope: ', registration.scope);
                    },
                    function(err) {
                      console.log('Service Worker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
