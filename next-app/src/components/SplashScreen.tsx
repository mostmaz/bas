'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/context/ShopContext';

export const SplashScreen = () => {
    const [isVisible, setIsVisible] = useState(true);
    const { storeLogo } = useShop();

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-opacity duration-500">
            <div className="relative animate-in fade-in zoom-in duration-700">
                <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-500 p-1 shadow-2xl shadow-purple-500/30">
                    <div className="h-full w-full rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        <img
                            src={storeLogo || "/logo.png"}
                            alt="BasCavarat"
                            className="h-24 w-24 object-cover"
                        />
                    </div>
                </div>
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-max">
                    <div className="flex space-x-2">
                        <div className="h-2 w-2 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};
