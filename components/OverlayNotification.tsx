import React, { useState, useEffect } from 'react';
import { X, Smartphone } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { supabase } from '../services/supabase';

export const OverlayNotification: React.FC = () => {
    const { overlayConfig } = useShop();
    const [isVisible, setIsVisible] = useState(false);
    const [deviceName, setDeviceName] = useState('');

    useEffect(() => {
        if (overlayConfig.enabled) {
            const dismissed = sessionStorage.getItem('overlay_dismissed');
            if (!dismissed) {
                const timer = setTimeout(() => setIsVisible(true), 1000);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false);
        }
    }, [overlayConfig.enabled]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (overlayConfig.dismissible) {
            sessionStorage.setItem('overlay_dismissed', 'true');
        }
        // Reset state after animation
        setTimeout(() => {
            setDeviceName('');
        }, 300);
    };

    const handleConfirm = async () => {
        if (!deviceName.trim()) {
            return;
        }

        // Save to database
        try {
            await supabase.from('overlay_submissions').insert([
                { device_name: deviceName.trim() }
            ]);
        } catch (error) {
            console.error('Error saving submission:', error);
        }

        handleDismiss();
    };

    if (!isVisible || !overlayConfig.enabled) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Close Button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">✨</span>
                    </div>

                    <div className="prose dark:prose-invert max-w-none mb-6">
                        <p className="text-lg font-medium text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                            {overlayConfig.text}
                        </p>
                    </div>

                    {/* Input Field */}
                    <div className="mb-6 relative text-right" dir="rtl">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            اسم الجهاز
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Smartphone className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={deviceName}
                                onChange={(e) => setDeviceName(e.target.value)}
                                placeholder="أدخل اسم جهازك..."
                                className="block w-full pr-10 pl-3 py-3 border border-gray-300 dark:border-slate-600 rounded-xl leading-5 bg-white dark:bg-slate-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:text-white transition-all"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!deviceName.trim()}
                        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/30"
                    >
                        تمام
                    </button>
                </div>

                {/* Decorative Gradient */}
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
            </div>
        </div>
    );
};
