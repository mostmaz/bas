import React from 'react';
import { HomeClient } from '@/components/HomeClient';
import { getCachedProducts, getCachedBrands, getCachedOrders } from '@/lib/server-data';

// Enable Static Generation with Revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // Parallel data fetching for optimal performance
  const [products, brands, orders] = await Promise.all([
    getCachedProducts(),
    getCachedBrands(),
    getCachedOrders()
  ]);

  return (
    <HomeClient
      initialProducts={products}
      initialBrands={brands}
      initialOrders={orders as any}
    />
  );
}
