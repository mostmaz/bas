import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FB_PIXEL_ID } from '../utils/pixel';

const FacebookPixel = () => {
    const location = useLocation();

    useEffect(() => {
        // Initialize Facebook Pixel
        if (typeof window !== 'undefined') {
            if (!(window as any).fbq) {
                (function (f: any, b, e, v, n?: any, t?: any, s?: any) {
                    if (f.fbq) return;
                    n = f.fbq = function () {
                        n.callMethod
                            ? n.callMethod.apply(n, arguments)
                            : n.queue.push(arguments);
                    };
                    if (!f._fbq) f._fbq = n;
                    n.push = n;
                    n.loaded = !0;
                    n.version = '2.0';
                    n.queue = [];
                    t = b.createElement(e);
                    t.async = !0;
                    t.src = v;
                    s = b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t, s);
                })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

                (window as any).fbq('init', FB_PIXEL_ID);
            }

            // Track PageView on route change
            (window as any).fbq('track', 'PageView');
        }
    }, [location]);

    return null;
};

export default FacebookPixel;
