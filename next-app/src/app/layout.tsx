import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ShopProvider } from "@/context/ShopContext";
import { ToastProvider } from "@/context/ToastContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { AiAssistant } from "@/components/AiAssistant";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BasCavarat - Premium Phone Cases",
  description: "Shop the best phone cases in Iraq. Premium quality, fast delivery.",
};

import { getCachedProducts, getCachedBrands, getCachedDevices, getCachedSlides } from "@/lib/server-data";

import { SplashScreen } from "@/components/SplashScreen";

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
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300`}>
        <ToastProvider>
          <ShopProvider initialData={initialData}>
            <SplashScreen />
            <div className="min-h-screen flex flex-col pb-20 md:pb-0">
              <Navbar />
              <CartDrawer />
              <main className="flex-grow">
                {children}
              </main>
              <AiAssistant />
              <div className="md:hidden">
                <Footer />
              </div>
            </div>
          </ShopProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
