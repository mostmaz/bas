"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
    const pathname = usePathname();

    const navItems = [
        { href: "/", icon: Home, label: "Home" },
        { href: "/wishlist", icon: Heart, label: "Wishlist" },
        { href: "/cart", icon: ShoppingCart, label: "Cart" },
        { href: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
            <nav className="bg-blue-600 text-white rounded-full shadow-lg px-6 py-4 flex justify-between items-center backdrop-blur-md bg-opacity-90">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center justify-center p-2 rounded-full transition-all duration-300",
                                isActive ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            {isActive && <span className="ml-2 text-sm font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
