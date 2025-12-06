
import React, { useState, useEffect } from 'react';
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { ProductManagement } from '../components/admin/ProductManagement';
import { BrandManagement } from '../components/admin/BrandManagement';
import { DeviceManagement } from '../components/admin/DeviceManagement';
import { CarouselManagement } from '../components/admin/CarouselManagement';
import { OrderManagement } from '../components/admin/OrderManagement';
import { DiscountManagement } from '../components/admin/DiscountManagement';
import { useShop } from '../context/ShopContext';
import { AlertTriangle, Database, Copy, Check, X, Lock, KeyRound, LogIn } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Order } from '../types';

export const AdminDashboard: React.FC = () => {
  const { supaConnectionError, isOnline } = useShop();
  const { addToast } = useToast();
  const location = useLocation();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');

  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'orders' | 'brands' | 'devices' | 'carousel' | 'discounts'>('overview');
  const [copied, setCopied] = useState(false);
  const [showSql, setShowSql] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Handle direct navigation to specific tabs
  useEffect(() => {
    if (location.state && (location.state as any).defaultTab) {
      const tab = (location.state as any).defaultTab;
      if (['overview', 'inventory', 'brands', 'devices', 'carousel', 'orders', 'discounts'].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [location]);

  // Automated Schema Health Check
  useEffect(() => {
    const checkHealth = async () => {
      if (isAuthenticated && isOnline && !supaConnectionError) {
        try {
          // Check specifically for 'images', 'colors', 'variants', 'sku' which are critical for the new features
          // Using a raw query attempt to catch column missing errors explicitly
          const { error } = await supabase.from('products').select('images, colors, variants, sale_price, sku').limit(1);

          if (error) {
            console.error("Schema check failed:", error);

            // Robust error message extraction
            let msg = "Unknown error";
            if (typeof error === 'string') msg = error;
            else if (typeof error === 'object' && error !== null) {
              // Try to find a readable message property
              msg = (error as any).message || (error as any).details || (error as any).hint || JSON.stringify(error);
            }

            const lowerMsg = String(msg).toLowerCase();
            const code = (error as any)?.code;

            if (code === '42703' || lowerMsg.includes('column') || lowerMsg.includes('does not exist')) {
              let missingItem = "Advanced Columns";
              if (lowerMsg.includes('colors')) missingItem = "'colors'";
              else if (lowerMsg.includes('images')) missingItem = "'images'";
              else if (lowerMsg.includes('variants')) missingItem = "'variants'";
              else if (lowerMsg.includes('sale_price')) missingItem = "'sale_price'";
              else if (lowerMsg.includes('sku')) missingItem = "'sku'";

              const alertMsg = `CRITICAL: Database missing ${missingItem}. Please run the DB Setup script.`;
              setSchemaError(alertMsg);
              setShowSql(true);
              addToast(`Schema Error: ${missingItem} missing`, 'error');
            } else {
              console.warn("Non-critical schema warning:", msg);
            }
          } else {
            setSchemaError(null);
          }
        } catch (e) {
          console.error("Health check exception:", e);
        }
      }
    };
    checkHealth();
  }, [isAuthenticated, isOnline, supaConnectionError, addToast]);

  // Order Notification System
  useEffect(() => {
    if (!isAuthenticated || !isOnline) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new as Order;
          addToast(`New Order #${newOrder.orderNumber || newOrder.id.slice(0, 8)} received!`, 'success');

          // System notification
          if (Notification.permission === 'granted') {
            try {
              new Notification('New Order Received', {
                body: `Order #${newOrder.orderNumber || newOrder.id.slice(0, 8)} - ${newOrder.customerName}`,
                icon: '/logo.png',
                tag: 'new-order'
              });
            } catch (e) {
              console.error("Notification failed", e);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isOnline, addToast]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') { // Hardcoded for demo purposes
      setIsAuthenticated(true);
      addToast('Access Granted', 'success');
    } else {
      addToast('Invalid PIN', 'error');
      setPin('');
    }
  };

  const SETUP_SQL = `
-- Run this in the Supabase SQL Editor to fix "Column not found" errors

-- 1. Add missing columns to Products table (Advanced Features)
alter table products add column if not exists images text[];
alter table products add column if not exists colors text[];
alter table products add column if not exists variants jsonb;
alter table products add column if not exists sale_price numeric;
alter table products add column if not exists sku text;
alter table products add column if not exists created_at timestamptz default now();

-- 2. Ensure Brands table has logo
alter table brands add column if not exists logo text;

-- 3. Ensure Store Settings has logo
alter table store_settings add column if not exists logo text;

-- 4. Ensure Orders table has new columns (Fix for Order failed error)
alter table orders add column if not exists discountamount numeric;
alter table orders add column if not exists discountcode text;
alter table orders add column if not exists ordernumber text;

-- 5. Create tables if they don't exist (Safety)
create table if not exists products (
  id text primary key default gen_random_uuid()::text,
  created_at timestamptz default now(),
  name text,
  sku text,
  price numeric,
  sale_price numeric,
  description text,
  category text,
  device text,
  brand text,
  image text,
  images text[],
  rating numeric,
  stock numeric,
  colors text[],
  variants jsonb
);

create table if not exists brands (
  id bigint generated by default as identity primary key,
  name text unique,
  logo text
);

create table if not exists devices (
  id bigint generated by default as identity primary key,
  name text unique
);

create table if not exists slides (
  id text primary key default gen_random_uuid()::text,
  title text,
  subtitle text,
  description text,
  color text,
  image text
);

create table if not exists orders (
  id text primary key default gen_random_uuid()::text,
  customername text,
  phone text,
  city text,
  address text,
  items jsonb,
  totalamount numeric,
  shippingfee numeric,
  discountamount numeric,
  discountcode text,
  status text,
  date numeric,
  ordernumber text
);

create table if not exists store_settings (
  id bigint generated by default as identity primary key,
  shipping_fee numeric,
  logo text
);

create table if not exists discounts (
  id bigint generated by default as identity primary key,
  code text unique,
  type text, -- 'percentage' or 'fixed'
  value numeric,
  minOrderAmount numeric,
  isActive boolean default true
);

-- Insert Default Discount Codes
insert into discounts (code, type, value, minOrderAmount, isActive)
values 
  ('WELCOME10', 'percentage', 10, 0, true),
  ('SAVE5000', 'fixed', 5000, 40000, true),
  ('SUMMER25', 'percentage', 25, 100000, true)
on conflict (code) do nothing;

-- 6. Enable RLS and Policies (Fix Permission Denied)
alter table products enable row level security;
create policy "Public read products" on products for select using (true);
create policy "Anon insert products" on products for insert with check (true);
create policy "Anon update products" on products for update using (true);
create policy "Anon delete products" on products for delete using (true);

alter table brands enable row level security;
create policy "Public access brands" on brands for all using (true);
create policy "Anon modification brands" on brands for all using (true);

alter table devices enable row level security;
create policy "Public access devices" on devices for all using (true);
create policy "Anon modification devices" on devices for all using (true);

alter table slides enable row level security;
create policy "Public access slides" on slides for all using (true);
create policy "Anon modification slides" on slides for all using (true);

alter table orders enable row level security;
create policy "Public access orders" on orders for all using (true);
create policy "Anon modification orders" on orders for all using (true);

alter table store_settings enable row level security;
create policy "Public access settings" on store_settings for all using (true);
create policy "Anon modification settings" on store_settings for all using (true);

alter table discounts enable row level security;
create policy "Public access discounts" on discounts for all using (true);
create policy "Anon modification discounts" on discounts for all using (true);
`;

  const copySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('SQL Copied to clipboard', 'info');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-sm w-full border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4 text-indigo-600 dark:text-indigo-400">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Access</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Enter security PIN to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="Enter 4-digit PIN (1234)"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full py-3 text-base" disabled={pin.length < 4}>
              <LogIn className="h-5 w-5 mr-2" /> Unlock Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 p-4 sm:p-8 transition-colors">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <p className="text-gray-500 dark:text-slate-400">Overview of your store performance and inventory.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowSql(!showSql)}
              className={`bg-white dark:bg-slate-800 ${schemaError ? 'border-red-500 text-red-600' : ''}`}
            >
              <Database className="h-4 w-4 mr-2" />
              {showSql ? 'Hide DB Setup' : schemaError ? 'Fix Schema' : 'DB Setup'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAuthenticated(false)}
              className="bg-white dark:bg-slate-800 border-red-200 text-red-600 hover:bg-red-50"
            >
              <Lock className="h-4 w-4 mr-2" /> Lock
            </Button>
          </div>
        </div>

        {/* Database Setup Alert */}
        {(showSql || supaConnectionError || schemaError) && (
          <div className={`mb-8 border rounded-xl p-6 animate-in fade-in slide-in-from-top-4 relative ${schemaError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
            }`}>
            <button
              onClick={() => setShowSql(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full hidden sm:block ${schemaError ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                }`}>
                {schemaError ? <AlertTriangle className="h-6 w-6" /> : <Database className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${schemaError ? 'text-red-800 dark:text-red-200' : 'text-blue-800 dark:text-blue-200'
                  }`}>
                  {schemaError ? 'Action Required: Fix Database Schema' : 'Database Setup & SQL'}
                </h3>
                <div className={`mt-1 mb-4 text-sm space-y-2 ${schemaError ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'
                  }`}>
                  <p>
                    {supaConnectionError ? (
                      <span>Error detected: <strong>{supaConnectionError}</strong></span>
                    ) : schemaError ? (
                      <span><strong>{schemaError}</strong> The app cannot find the 'variants', 'sale_price', 'sku' or 'colors' column.</span>
                    ) : (
                      <span>Use this script to create tables or fix "Permission denied" errors (RLS policies).</span>
                    )}
                  </p>
                  <p className="font-medium bg-white/50 dark:bg-black/20 p-3 rounded border border-current opacity-90">
                    <strong>HOW TO FIX:</strong><br />
                    1. Copy the SQL below.<br />
                    2. Run it in Supabase <strong>SQL Editor</strong>.<br />
                    3. <strong>IMPORTANT:</strong> Go to <strong>Project Settings {'>'} API</strong> and click <strong>Reload</strong> under 'Schema Cache'.
                  </p>
                </div>

                <div className="relative group">
                  <pre className="bg-gray-900 text-gray-300 p-4 rounded-lg text-xs overflow-x-auto font-mono border border-gray-700 max-h-64 custom-scrollbar">
                    {SETUP_SQL}
                  </pre>
                  <button
                    onClick={copySQL}
                    className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-md backdrop-blur-sm transition-colors flex items-center gap-2 text-xs font-bold shadow-sm border border-white/10"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy SQL'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm mb-8 w-fit border border-gray-200 dark:border-slate-700">
          {(['overview', 'inventory', 'brands', 'devices', 'carousel', 'orders', 'discounts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'inventory' && <ProductManagement />}
        {activeTab === 'brands' && <BrandManagement />}
        {activeTab === 'devices' && <DeviceManagement />}
        {activeTab === 'carousel' && <CarouselManagement />}
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'discounts' && <DiscountManagement />}
      </div>
    </div>
  );
};