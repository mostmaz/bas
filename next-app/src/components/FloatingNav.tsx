'use client';

import React, { useState, useEffect } from 'react';
import { Home, ShoppingBag, Heart, Search, User } from 'lucide-react';
import { useShop } from '@/context/ShopContext';
import { useRouter, usePathname } from 'next/navigation';

export const FloatingNav: React.FC = () => {
    const { cart, toggleCart } = useShop();
    const router = useRouter();
    const pathname = usePathname();
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Don't show on admin pages
    if (pathname.startsWith('/admin')) return null;

    const navItems = [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Search', action: () => document.getElementById('search-input')?.focus() },
        { icon: ShoppingBag, label: 'Cart', action: toggleCart, badge: totalItems },
        { icon: Heart, label: 'Wishlist', path: '/wishlist' },
        { icon: User, label: 'Profile', path: '/profile' }, // Placeholder for profile
    ];

    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-full shadow-2xl shadow-purple-500/20 px-6 py-3 flex items-center gap-8">
                {navItems.map((item, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            if (item.path) router.push(item.path);
                            if (item.action) item.action();
                        }}
                        className={`relative p-2 rounded-xl transition-all duration-200 group ${pathname === item.path ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'}`}
                    >
                        <item.icon className={`h-6 w-6 ${pathname === item.path ? 'fill-current' : ''}`} />
                        {item.badge ? (
                            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                {item.badge}
                            </span>
                        ) : null}
                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-lg pointer-events-none">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};
