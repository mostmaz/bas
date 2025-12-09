'use client';

import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Package, TrendingUp, ShoppingCart, AlertTriangle, Settings, Save, Database, ToggleLeft, ToggleRight, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { Button } from '@/components/Button';

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
    const { products, orders, shippingFee, updateShippingFee, isDemoActive, toggleDemoData, storeLogo, updateStoreLogo, updateProduct } = useShop();
    const [tempShippingFee, setTempShippingFee] = useState(shippingFee.toString());
    const lowStockProducts = products.filter(p => p.stock < 10);

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
        if (!isNaN(fee) && fee >= 0) {
            updateShippingFee(fee);
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("File too large (max 5MB)");
            return;
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const { url } = await response.json();
            updateStoreLogo(url);
        } catch (error) {
            console.error("Logo upload failed:", error);
            alert("Failed to upload logo");
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
                        {/* Shipping Fee */}
                        <form onSubmit={handleUpdateShipping} className="flex items-end gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Shipping Fee (IQD)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={tempShippingFee}
                                        onChange={(e) => setTempShippingFee(e.target.value)}
                                        className="w-full border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 rounded-lg px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <Button type="submit" variant="secondary" className="mb-[1px]">
                                <Save className="h-4 w-4 mr-2" /> Save
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

            {/* Migration Tool - Temporary Fix for Speed */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-orange-200 dark:border-orange-900/50 mb-8">
                <h3 className="text-lg font-semibold mb-2 text-orange-700 dark:text-orange-400 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" /> Speed Optimizer (Migration Tool)
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
                    Your site is slow because some old products use "Base64" images (very large text files) instead of real image URLs.
                    Use this tool to identify and fix them.
                </p>

                <div className="flex flex-col gap-4">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <h4 className="font-medium text-orange-800 dark:text-orange-300 mb-2">
                            Found {products.filter(p => p.image?.startsWith('data:image')).length} slow products
                        </h4>
                        <p className="text-xs text-orange-700 dark:text-orange-400 mb-4">
                            These products are slowing down your site. Click below to automatically upload them to the server.
                        </p>

                        <div className="flex gap-3">
                            <Button
                                onClick={async () => {
                                    if (!confirm("This will upload all your existing images to the server to make them fast. This process may take a few minutes. Please do not close the tab.\n\nContinue?")) return;

                                    const slowProducts = products.filter(p =>
                                        p.image?.startsWith('data:image') ||
                                        p.variants?.some(v => v.image?.startsWith('data:image'))
                                    );

                                    let count = 0;
                                    const total = slowProducts.length;

                                    // Helper to convert base64 to File and upload
                                    const uploadBase64 = async (base64: string): Promise<string | null> => {
                                        try {
                                            const res = await fetch(base64);
                                            const blob = await res.blob();
                                            const file = new File([blob], "migrated-image.webp", { type: "image/webp" });

                                            const formData = new FormData();
                                            formData.append('file', file);

                                            const uploadRes = await fetch('/api/upload', {
                                                method: 'POST',
                                                body: formData
                                            });

                                            if (!uploadRes.ok) return null;
                                            const { url } = await uploadRes.json();
                                            return url;
                                        } catch (e) {
                                            console.error("Migration upload failed", e);
                                            return null;
                                        }
                                    };

                                    for (const p of slowProducts) {
                                        // Update UI (simple alert for now, ideally a progress bar)
                                        console.log(`Migrating ${count + 1}/${total}: ${p.name}`);

                                        let newMainImage = p.image;
                                        // Migrate Main Image
                                        if (p.image?.startsWith('data:image')) {
                                            const url = await uploadBase64(p.image);
                                            if (url) newMainImage = url;
                                        }

                                        // Migrate Variants
                                        const newVariants = [];
                                        if (p.variants) {
                                            for (const v of p.variants) {
                                                let newVarImage = v.image;
                                                if (v.image?.startsWith('data:image')) {
                                                    const url = await uploadBase64(v.image);
                                                    if (url) newVarImage = url;
                                                }
                                                newVariants.push({ ...v, image: newVarImage });
                                            }
                                        }

                                        // Update Product
                                        await updateProduct({
                                            ...p,
                                            image: newMainImage,
                                            images: [newMainImage, ...(p.images?.slice(1) || [])],
                                            variants: newVariants
                                        });
                                        count++;
                                    }

                                    // Force clear cache
                                    localStorage.removeItem('products_cache');

                                    alert(`Successfully migrated ${count} products! Your images are now hosted and fast.`);
                                    window.location.reload();
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" /> Fix All (Auto-Upload)
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </div>
            </div>
        </div >
    );
};
