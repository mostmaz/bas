import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { OverlayConfig } from '../types';

export const useSettingsLogic = () => {
    const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
        enabled: false,
        text: '',
        dismissible: true
    });
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);

    const fetchSettings = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings')
                .select('*')
                .eq('key', 'home_overlay')
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                return;
            }

            if (data) {
                setOverlayConfig(data.value);
            }
        } catch (err) {
            console.error('Unexpected error fetching settings:', err);
        } finally {
            setIsLoadingSettings(false);
        }
    }, []);

    const updateOverlayConfig = async (newConfig: OverlayConfig) => {
        try {
            const { error } = await supabase
                .from('site_settings')
                .upsert({
                    key: 'home_overlay',
                    value: newConfig,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            setOverlayConfig(newConfig);
            return true;
        } catch (err) {
            console.error('Error updating settings:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        overlayConfig,
        updateOverlayConfig,
        isLoadingSettings,
        refreshSettings: fetchSettings
    };
};
