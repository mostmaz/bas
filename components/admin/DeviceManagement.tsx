import React, { useState } from 'react';
import { Trash2, Loader2, Plus, RefreshCw, Smartphone } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';

export const DeviceManagement: React.FC = () => {
    const { devices, addDevice, deleteDevice, refreshDevices } = useShop();
    const [newDeviceName, setNewDeviceName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeviceName.trim()) return;

        setIsSubmitting(true);
        try {
            await addDevice(newDeviceName.trim());
            setNewDeviceName('');
        } catch (error) {
            console.error("Error adding device:", error);
            alert("Failed to add device.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDevice = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this device?')) {
            setDeletingId(id);
            try {
                await deleteDevice(id);
            } catch (error) {
                console.error("Error deleting device:", error);
                alert("Failed to delete device.");
            } finally {
                setDeletingId(null);
            }
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshDevices();
        setIsRefreshing(false);
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Device Management</h2>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh List
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Device Card */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Device</h3>
                    <form onSubmit={handleAddDevice} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Device Name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="e.g. iPhone 16 Pro"
                                    className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newDeviceName}
                                    onChange={(e) => setNewDeviceName(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={!newDeviceName.trim() || isSubmitting}
                            className="w-full"
                            isLoading={isSubmitting}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Device
                        </Button>
                    </form>
                </div>

                {/* Device List */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 shrink-0 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700 dark:text-slate-300">Active Devices ({devices.length})</h3>
                        <span className="text-xs text-gray-400">ID normalized</span>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-slate-700 overflow-y-auto custom-scrollbar flex-1">
                        {devices.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 text-sm p-6">
                                <p>No devices added yet.</p>
                            </div>
                        ) : (
                            devices.map((device) => (
                                <div key={device.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                            <Smartphone className="h-5 w-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-gray-900 dark:text-white font-medium">{device.name}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{device.id}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteDevice(device.id)}
                                        disabled={deletingId === device.id}
                                        className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                        title="Delete Device"
                                    >
                                        {deletingId === device.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
