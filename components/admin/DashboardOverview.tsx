
import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Settings, Save, Database, ToggleLeft, ToggleRight, Upload, Image as ImageIcon } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { RevenueAuditTable } from './RevenueAuditTable';

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
  const { products, orders, isDemoActive, toggleDemoData, revenueResetDate, resetRevenue, totalRevenue: serverTotalRevenue } = useShop();
  const lowStockProducts = products.filter(p => p.stock < 10);
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

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Settings & Demo Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Demo Data Control - Expanded to fill void if needed, or just kept side by side with something else? 
            Since we removed one card, maybe we don't need a grid here or we can just leave it as is 
            and it will take half width (which is fine) or we can make it full width. 
            The original was grid-cols-2. If I remove one, I have one child.
            I'll keep the grid for now, maybe in future something else goes there.
            Actually, if I remove the settings card, the Demo card will be alone.
        */}

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
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Net Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">IQD {serverTotalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
          <div className="flex justify-between items-end mt-2">
            <p className="text-xs text-gray-400">Excludes Shipping</p>
            <button
              onClick={() => {
                if (confirm('Reset revenue counter? This will set the current revenue to 0 and start tracking from now.')) {
                  resetRevenue();
                }
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
            >
              Reset Counter
            </button>
          </div>
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
        </div>
      </div>

      <RevenueAuditTable />
    </div>
  );
};