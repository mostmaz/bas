import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const OverlayNotification: React.FC = () => {
    const { overlayConfig } = useShop();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show if enabled and not previously dismissed (if using session storage logic, but for now just show if enabled)
        // We can add session storage logic if "dismissible" means "dismiss for this session"
        if (overlayConfig.enabled) {
            const dismissed = sessionStorage.getItem('overlay_dismissed');
            if (!dismissed) {
                // Small delay for better UX
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

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-lg font-medium text-slate-900 dark:text-white whitespace-pre-wrap leading-relaxed">
                            {overlayConfig.text}
                        </p>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="mt-8 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/30"
                    >
                        Got it
                    </button>
                </div>

                {/* Decorative Gradient */}
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
            </div>
        </div>
    );
};
