
import React, { useState, useEffect } from 'react';
import { ENCODED_PIN } from '../constants';
import { DashboardOverview } from '../components/admin/DashboardOverview';
import { ProductManagement } from '../components/admin/ProductManagement';
import { BrandManagement } from '../components/admin/BrandManagement';
import { DeviceManagement } from '../components/admin/DeviceManagement';
import { CarouselManagement } from '../components/admin/CarouselManagement';
import { OrderManagement } from '../components/admin/OrderManagement';
import { DiscountManagement } from '../components/admin/DiscountManagement';
import { CollectionManagement } from '../components/admin/CollectionManagement';
import { ImageScanner } from '../components/admin/ImageScanner';
import { LowStockManagement } from '../components/admin/LowStockManagement';
import { SearchAnalysis } from '../components/admin/SearchAnalysis';
import { ReviewManagement } from '../components/admin/ReviewManagement';
import { SettingsManagement } from '../components/admin/SettingsManagement';
import { useShop } from '../context/ShopContext';
import { AlertTriangle, Database, Copy, Check, X, Lock, KeyRound, LogIn, LayoutDashboard, ShoppingBag, Package, Tags, Smartphone, Image as ImageIcon, Percent, Layers, Settings, Search, MessageSquare } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { useToast } from '../context/ToastContext';
import { supabase } from '../services/supabase';
import { Order } from '../types';

export const AdminDashboard: React.FC = () => {
  const { supaConnectionError, isOnline, refreshOrders } = useShop();
  const { addToast } = useToast();
  const location = useLocation();

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showSql, setShowSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'low-stock' | 'brands' | 'devices' | 'carousel' | 'orders' | 'discounts' | 'collections' | 'maintenance' | 'search-analysis' | 'reviews' | 'settings'>('overview');
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      if (isAuthenticated && isOnline && !supaConnectionError) {
        try {
          // Check specifically for 'images', 'colors', 'variants', 'sku' which are critical for the new features
          // Using a raw query attempt to catch column missing errors explicitly
          // Note: ishidden must be lowercase to match Postgres column if created without quotes
          const { error: readError } = await supabase.from('products').select('images, colors, variants, sale_price, sku, ishidden, gift_product_id, bonus_message').limit(1);
          const { error: settingsError } = await supabase.from('store_settings').select('notification_message').limit(1);

          // Also check WRITE capability for new columns (to catch stale schema cache for updates)
          const { error: writeError } = await supabase.from('products').update({ gift_product_id: 'test' }).eq('id', '00000000-0000-0000-0000-000000000000');

          const error = readError || settingsError || (writeError && (writeError.code === '42703' || writeError.code === 'PGRST204') ? writeError : null);

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

            if (code === '42703' || code === 'PGRST204' || lowerMsg.includes('column') || lowerMsg.includes('does not exist') || lowerMsg.includes('schema cache')) {
              let missingItem = "Advanced Columns";
              if (lowerMsg.includes('colors')) missingItem = "'colors'";
              else if (lowerMsg.includes('images')) missingItem = "'images'";
              else if (lowerMsg.includes('variants')) missingItem = "'variants'";
              else if (lowerMsg.includes('sale_price')) missingItem = "'sale_price'";
              else if (lowerMsg.includes('sku')) missingItem = "'sku'";

              else if (lowerMsg.includes('ishidden')) missingItem = "'ishidden'";
              else if (lowerMsg.includes('gift_product_id')) missingItem = "'gift_product_id'";
              else if (lowerMsg.includes('bonus_message')) missingItem = "'bonus_message'";
              else if (lowerMsg.includes('notification_message')) missingItem = "'notification_message' (in store_settings)";

              const alertMsg = `CRITICAL: Database Schema Cache Stale. Please run the DB Setup script.`;
              setSchemaError(alertMsg);
              setShowSql(true);
              addToast(`Schema Error: ${missingItem} missing or cache stale`, 'error');
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

  // Fetch orders on login
  useEffect(() => {
    if (isAuthenticated && isOnline) {
      refreshOrders();
    }
  }, [isAuthenticated, isOnline, refreshOrders]);

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
    if (btoa(pin.trim()) === ENCODED_PIN) {
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
alter table products add column if not exists isHidden boolean default false;
alter table products add column if not exists gift_product_id text;
alter table products add column if not exists bonus_message text;
alter table products add column if not exists created_at timestamptz default now();

-- 2. Ensure Brands table has logo
alter table brands add column if not exists logo text;

-- 3. Ensure Store Settings has logo
alter table store_settings add column if not exists logo text;
alter table store_settings add column if not exists notification_message text;

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
  variants jsonb,
  isHidden boolean default false,
  gift_product_id text,
  bonus_message text
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
  image text,
  imagePosition text
);

-- 9. Add imagePosition to slides if missing
alter table slides add column if not exists imagePosition text;

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

-- 10. Enable RLS (Optional but recommended)
alter table products enable row level security;
create policy "Public Read" on products for select using (true);
create policy "Public Insert" on products for insert with check (true);
create policy "Public Update" on products for update using (true);
create policy "Public Delete" on products for delete using (true);
`;

  const copySql = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    addToast('SQL script copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-900 px-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">Admin Access</h2>
          <p className="text-center text-gray-500 dark:text-slate-400 mb-8">Enter security PIN to continue</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:text-white transition-all"
                placeholder="Enter Admin Password"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              className="w-full py-3 text-base font-semibold shadow-lg shadow-indigo-500/20"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Unlock Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <LayoutDashboard className="text-white h-5 w-5" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin</h1>
        </div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Settings className="h-6 w-6" />}
        </button>
      </div>

      {/* Desktop Toggle Button (Floating) */}
      <div className="hidden lg:block fixed top-6 left-6 z-[60]">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300 ${isSidebarOpen ? 'translate-x-56 opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}
          title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
        >
          <LayoutDashboard className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-slate-800 border-e border-gray-200 dark:border-slate-700 fixed inset-y-0 start-0 h-full z-50 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}`}>
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LayoutDashboard className="text-white h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Admin</h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-2">Main</div>
          <button
            onClick={() => { setActiveTab('overview'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => { setActiveTab('orders'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'orders'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <ShoppingBag className="h-5 w-5" />
            <span className="font-medium">Orders</span>
          </button>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">Catalog</div>
          <button
            onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'inventory'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Package className="h-5 w-5" />
            <span className="font-medium">Inventory</span>
          </button>

          <button
            onClick={() => { setActiveTab('low-stock'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'low-stock'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Low Stock</span>
          </button>

          <button
            onClick={() => { setActiveTab('brands'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'brands'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Tags className="h-5 w-5" />
            <span className="font-medium">Brands</span>
          </button>

          <button
            onClick={() => { setActiveTab('devices'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'devices'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Smartphone className="h-5 w-5" />
            <span className="font-medium">Devices</span>
          </button>

          <button
            onClick={() => { setActiveTab('collections'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'collections'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Layers className="h-5 w-5" />
            <span className="font-medium">Collections</span>
          </button>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">Marketing</div>
          <button
            onClick={() => { setActiveTab('carousel'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'carousel'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="font-medium">Carousel</span>
          </button>

          <button
            onClick={() => { setActiveTab('discounts'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'discounts'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Percent className="h-5 w-5" />
            <span className="font-medium">Discounts</span>
          </button>

          <button
            onClick={() => { setActiveTab('search-analysis'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'search-analysis'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Search className="h-5 w-5" />
            <span className="font-medium">Search Analysis</span>
          </button>

          <button
            onClick={() => { setActiveTab('reviews'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'reviews'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="font-medium">Reviews</span>
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Settings</span>
          </button>

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4 mt-6">System</div>
          <button
            onClick={() => { setActiveTab('maintenance'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'
              }`}
          >
            <Settings className="h-5 w-5" />
            <span className="font-medium">Maintenance</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogIn className="h-5 w-5 rotate-180" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${isSidebarOpen ? 'lg:ms-64' : ''} p-4 lg:p-8 overflow-y-auto h-screen pt-20 lg:pt-8 transition-all duration-300`}>
        {/* Schema Error Alert */}
        {schemaError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-s-4 border-red-500 p-4 rounded-e-xl shadow-sm animate-in slide-in-from-top-2">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ms-3 flex-1">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Database Schema Error</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{schemaError}</p>
                  <p className="mt-1 font-semibold">The application may not function correctly until this is fixed.</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      onClick={() => setShowSql(!showSql)}
                      className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/60 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex items-center gap-2"
                    >
                      <Database className="h-4 w-4" />
                      {showSql ? 'Hide SQL Script' : 'View Fix Script'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SQL Script Modal/Area */}
        {showSql && (
          <div className="mb-8 bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-mono text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-indigo-400" />
                Database Setup Script
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={copySql}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied!' : 'Copy SQL'}
                </button>
                <button
                  onClick={() => setShowSql(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                {SETUP_SQL}
              </pre>
            </div>
            <div className="bg-slate-800/50 px-4 py-2 text-[10px] text-slate-400 border-t border-slate-700">
              Instructions: Copy this SQL, go to Supabase Dashboard {'>'} SQL Editor {'>'} New Query {'>'} Paste & Run.
            </div>
          </div>
        )}

        {activeTab === 'overview' && <DashboardOverview />}
        {activeTab === 'inventory' && <ProductManagement />}
        {activeTab === 'low-stock' && <LowStockManagement />}
        {activeTab === 'brands' && <BrandManagement />}
        {activeTab === 'devices' && <DeviceManagement />}
        {activeTab === 'carousel' && <CarouselManagement />}
        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'discounts' && <DiscountManagement />}
        {activeTab === 'collections' && <CollectionManagement />}
        {activeTab === 'search-analysis' && <SearchAnalysis />}
        {activeTab === 'reviews' && <ReviewManagement />}
        {activeTab === 'settings' && <SettingsManagement />}
        {activeTab === 'maintenance' && (
          <div className="space-y-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                <Database className="h-5 w-5 me-2 text-gray-500" /> Database Maintenance
              </h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                If you are experiencing issues with missing columns or schema errors (e.g. notification bar not working), you can view and run the database setup script manually.
              </p>
              <button
                onClick={() => setShowSql(!showSql)}
                className="bg-indigo-5 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800"
              >
                {showSql ? 'Hide Setup Script' : 'View Database Setup Script'}
              </button>
            </div>
            <ImageScanner />
          </div>
        )}
      </main>
    </div>
  );
};
