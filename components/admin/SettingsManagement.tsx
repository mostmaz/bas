import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Save, Bell, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const SettingsManagement: React.FC = () => {
    const { overlayConfig, updateOverlayConfig } = useShop();
    const { addToast } = useToast();

    const [enabled, setEnabled] = useState(false);
    const [text, setText] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (overlayConfig) {
            setEnabled(overlayConfig.enabled);
            setText(overlayConfig.text);
        }
    }, [overlayConfig]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await updateOverlayConfig({
                enabled,
                text,
                dismissible: true // Always dismissible for now
            });

            if (success) {
                addToast('Settings saved successfully', 'success');
            } else {
                addToast('Failed to save settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Error saving settings', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h2>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Home Page Overlay</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configure the popup notification shown to visitors</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Toggle Switch */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <label className="font-medium text-slate-900 dark:text-white block">Enable Overlay</label>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Show this notification to visitors on the home page</p>
                            </div>
                            <button
                                onClick={() => setEnabled(!enabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${enabled ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span
                                    className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        {/* Text Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Notification Content
                            </label>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                placeholder="Enter the message to display..."
                            />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                This text will be displayed in the center of the overlay.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
