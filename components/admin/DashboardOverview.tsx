
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Settings, Save, Database, ToggleLeft, ToggleRight, Upload, Image as ImageIcon, Search } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { supabase } from '../../services/supabase';

// Mock Data for Revenue (keep static for demo)
const REVENUE_DATA = [
  { name: 'Mon', revenue: 240000 },
  { name: 'Tue', revenue: 139000 },
  { name: 'Wed', revenue: 980000 },
  { name: 'Thu', revenue: 390000 },
  { name: 'Fri', revenue: 480000 },
  { name: 'Sat', revenue: 380000 },
  { name: 'Sun', revenue: 430000 },
];

const COLORS = ['#4f46e5', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export const DashboardOverview: React.FC = () => {
  const { products, orders, baseShippingFee, updateShippingFee, freeShippingThreshold, updateFreeShippingThreshold, isDemoActive, toggleDemoData, storeLogo, updateStoreLogo, notificationMessage, updateNotificationMessage } = useShop();
  const [tempShippingFee, setTempShippingFee] = useState(baseShippingFee.toString());
  const [tempThreshold, setTempThreshold] = useState(freeShippingThreshold.toString());
  const [tempNotificationMessage, setTempNotificationMessage] = useState(notificationMessage || '');
  const lowStockProducts = products.filter(p => p.stock < 10);
  const [topSearches, setTopSearches] = useState<any[]>([]);

  // Sync local state with context values when they change (e.g. after fetch)
  React.useEffect(() => {
    setTempShippingFee(baseShippingFee.toString());
    setTempThreshold(freeShippingThreshold.toString());
    setTempNotificationMessage(notificationMessage || '');
  }, [baseShippingFee, freeShippingThreshold, notificationMessage]);

  useEffect(() => {
    const fetchTopSearches = async () => {
      const { data } = await supabase
        .from('search_terms')
        .select('*')
        .order('count', { ascending: false })
        .limit(5);
      if (data) setTopSearches(data);
    };
    fetchTopSearches();
  }, []);

  // Dynamic Revenue Calculation (Excluding Cancelled)
  const totalRevenue = useMemo(() => {
    return orders
      .filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  const pendingOrdersCount = orders.filter(o => o.status === 'Processing').length;

  // Calculate Brand Distribution Dynamically
  const brandData = useMemo(() => {
    const distribution: Record<string, number> = {};
    products.forEach(p => {
      const brand = p.brand || 'Unknown';
      distribution[brand] = (distribution[brand] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 brands
  }, [products]);

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    const fee = parseInt(tempShippingFee);
    const threshold = parseInt(tempThreshold);

    if (!isNaN(fee) && fee >= 0) {
      updateShippingFee(fee);
    }
    if (!isNaN(threshold) && threshold >= 0) {
      updateFreeShippingThreshold(threshold);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create an image element to load the file
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        // Create canvas to resize
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 300; // Resize to max 300px for storage efficiency

        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL('image/webp', 0.8); // Use WebP for better compression
          updateStoreLogo(base64);
        }
      };

      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Settings & Demo Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-gray-500" /> Store Settings
          </h3>

          <div className="space-y-6">
            {/* Shipping Settings */}
            <form onSubmit={handleUpdateShipping} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Fee (IQD)</label>
                  <input
                    type="number"
                    value={tempShippingFee}
                    onChange={(e) => setTempShippingFee(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Free Shipping Over (IQD)</label>
                  <input
                    type="number"
                    value={tempThreshold}
                    onChange={(e) => setTempThreshold(e.target.value)}
                    className="w-full border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <Button type="submit" variant="secondary" className="w-full">
                <Save className="h-4 w-4 mr-2" /> Save Settings
              </Button>
            </form>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Store Icon / Logo</label>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600 shadow-sm shrink-0 bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
                  {storeLogo ? (
                    <img src={storeLogo} alt="Current Logo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <label className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 mr-2" /> Change Icon
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">This image will update the App Logo, Splash Screen, and Website Favicon.</p>
            </div>

            {/* Notification Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Notification Bar Message (RTL)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempNotificationMessage}
                  onChange={(e) => setTempNotificationMessage(e.target.value)}
                  placeholder="Enter notification text (e.g. Special Offer...)"
                  className="flex-1 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  dir="rtl"
                />
                <Button
                  onClick={() => updateNotificationMessage(tempNotificationMessage)}
                  variant="secondary"
                  className="shrink-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Data Control */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col justify-between">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white flex items-center">
            <Database className="h-5 w-5 mr-2 text-gray-500" /> Demo Population
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
            Instantly generate 30 demo products for every active brand. Useful for testing the UI.
          </p>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${isDemoActive ? 'text-green-600' : 'text-gray-500'}`}>
              Status: {isDemoActive ? 'Active (populated)' : 'Inactive'}
            </span>
            <button
              onClick={toggleDemoData}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${isDemoActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
                }`}
            >
              {isDemoActive ? (
                <>Turn Off <ToggleRight className="ml-2 h-5 w-5" /></>
              ) : (
                <>Turn On <ToggleLeft className="ml-2 h-5 w-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">IQD {totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" /> +12.5% vs last week
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Active Products</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            {lowStockProducts.length} items low on stock
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Pending Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingOrdersCount}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full text-purple-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Needs attention</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Revenue Trend (IQD)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af' }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  formatter={(value: number) => [`IQD ${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart & Low Stock */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Products by Brand</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={brandData}
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {brandData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center text-amber-600">
              <AlertTriangle className="h-5 w-5 mr-2" /> Low Stock Alert
            </h3>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700 dark:text-slate-300 truncate max-w-[150px]">{p.name}</span>
                    <span className="text-red-600 font-medium">{p.stock} left</span>
                  </div>
                ))}
                {lowStockProducts.length > 3 && (
                  <p className="text-xs text-center text-gray-500 dark:text-slate-500 mt-2">
                    + {lowStockProducts.length - 3} more items
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400">All inventory levels are healthy.</p>
            )}
          </div>

          {/* Search Analysis */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <Search className="h-5 w-5 mr-2 text-gray-500" /> Top Searches
            </h3>
            <div className="space-y-3">
              {topSearches.length > 0 ? (
                topSearches.map((term, idx) => (
                  <div key={term.id} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full text-xs font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 dark:text-slate-300">{term.term}</span>
                    </div>
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full text-xs font-medium">
                      {term.count}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-4">No search data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};