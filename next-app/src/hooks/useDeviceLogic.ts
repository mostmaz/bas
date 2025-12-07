import { useState } from 'react';
import { Device } from '@/types';
import { DEVICES } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export const useDeviceLogic = (isSupabaseConfigured: boolean, addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, initialData?: Device[]) => {
    const [devices, setDevices] = useState<Device[]>(() => {
        if (initialData && initialData.length > 0) return initialData;
        return isSupabaseConfigured ? [] : DEVICES.filter(d => d !== 'All').map((d, i) => ({ id: i.toString(), name: d }));
    });

    const refreshDevices = async () => {
        if (isSupabaseConfigured) {
            try {
                const { data, error } = await supabase.from('devices').select('*');
                if (error) {
                    console.warn("Could not load devices from DB (table might be missing)", error);
                    return;
                }
                if (data) setDevices(data);
            } catch (error) {
                console.error("Error loading devices:", error);
            }
        }
    };

    const addDevice = async (name: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('devices').insert([{ name }]);
            if (error) {
                console.error("Failed to add device to DB:", error);
                const newDevice: Device = { id: Date.now().toString(), name };
                setDevices(prev => [...prev, newDevice]);
                addToast('Device added locally (DB table missing?)', 'warning');
            } else {
                await refreshDevices();
                addToast('Device added successfully', 'success');
            }
        } else {
            const newDevice: Device = { id: Date.now().toString(), name };
            setDevices(prev => [...prev, newDevice]);
            addToast('Device added locally', 'success');
        }
    };

    const deleteDevice = async (id: string) => {
        if (isSupabaseConfigured) {
            const { error } = await supabase.from('devices').delete().eq('id', id);
            if (error) {
                console.error("Failed to delete device from DB:", error);
                setDevices(prev => prev.filter(d => d.id !== id));
                addToast('Device deleted locally (DB error)', 'warning');
            } else {
                await refreshDevices();
                addToast('Device deleted', 'success');
            }
        } else {
            setDevices(prev => prev.filter(d => d.id !== id));
            addToast('Device deleted locally', 'success');
        }
    };

    return { devices, setDevices, refreshDevices, addDevice, deleteDevice };
};
