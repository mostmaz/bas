'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

const AppUrlListener = () => {
    const router = useRouter();

    useEffect(() => {
        App.addListener('backButton', (data) => {
            // Check if we can go back in history
            // Note: window.history.length > 1 is a simple check, but data.canGoBack is from Capacitor
            // However, data.canGoBack is often false for the first page loaded in WebView

            // Better logic:
            if (window.location.pathname !== '/') {
                router.back();
            } else {
                App.exitApp();
            }
        });
    }, [router]);

    return null;
};

export default AppUrlListener;
