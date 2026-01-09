
import { useEffect } from 'react';
import { supabase } from '../services/supabase';

export const useVisitorTracking = () => {
    useEffect(() => {
        const trackVisit = async () => {
            // Check if already tracked in this session
            if (sessionStorage.getItem('device_tracked')) return;

            const userAgent = navigator.userAgent;
            let deviceName = 'Other';

            if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
            else if (/iPad/i.test(userAgent)) deviceName = 'iPad';
            else if (/Android/i.test(userAgent)) deviceName = 'Android';
            else if (/Windows/i.test(userAgent)) deviceName = 'Windows';
            else if (/Mac/i.test(userAgent)) deviceName = 'Mac';
            else if (/Linux/i.test(userAgent)) deviceName = 'Linux';

            try {
                // Check if device exists
                const { data: existing } = await supabase
                    .from('visitor_devices')
                    .select('id, visit_count')
                    .eq('device_name', deviceName)
                    .single();

                if (existing) {
                    await supabase
                        .from('visitor_devices')
                        .update({
                            visit_count: existing.visit_count + 1,
                            last_visit: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('visitor_devices')
                        .insert([{ device_name: deviceName, visit_count: 1 }]);
                }

                // Mark as tracked for this session
                sessionStorage.setItem('device_tracked', 'true');
            } catch (error) {
                console.error('Error tracking device:', error);
            }
        };

        trackVisit();
    }, []);
};
