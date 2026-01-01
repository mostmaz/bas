export const FB_PIXEL_ID = '1395851638618938';

export const pageview = () => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'PageView');
    } else {
        console.warn('Facebook Pixel not initialized during PageView');
    }
};

export const event = (name: string, options = {}) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
        console.log(`Firing Pixel Event: ${name}`, options);
        (window as any).fbq('track', name, options);
    } else {
        console.warn(`Failed to fire Pixel Event: ${name} - fbq not found`);
        // Try to check if it's just not loaded yet
        if (typeof window !== 'undefined') {
            const scriptTags = document.getElementsByTagName('script');
            let found = false;
            for (let i = 0; i < scriptTags.length; i++) {
                if (scriptTags[i].src && scriptTags[i].src.includes('fbevents.js')) {
                    found = true;
                    break;
                }
            }
            console.log('Facebook Pixel Script Tag Found:', found);
            console.log('Window keys:', Object.keys(window).filter(k => k.includes('fb')));
        }
    }
};
