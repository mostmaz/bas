import React, { useState, useEffect } from 'react';
import { useShop } from '../../context/ShopContext';
import { Save, Bell, Loader2, Upload, Image as ImageIcon, Settings, DollarSign, MessageSquare } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { Button } from '../Button';

export const SettingsManagement: React.FC = () => {
    const {
        overlayConfig, updateOverlayConfig,
        baseShippingFee, updateShippingFee,
        freeShippingThreshold, updateFreeShippingThreshold,
        storeLogo, updateStoreLogo,
        notificationMessage, updateNotificationMessage
    } = useShop();
    const { addToast } = useToast();

    // Overlay State
    const [overlayEnabled, setOverlayEnabled] = useState(false);
    const [overlayText, setOverlayText] = useState('');
    const [isOverlaySaving, setIsOverlaySaving] = useState(false);

    // General Settings State
    const [tempShippingFee, setTempShippingFee] = useState(baseShippingFee.toString());
    const [tempThreshold, setTempThreshold] = useState(freeShippingThreshold.toString());
    const [tempNotificationMessage, setTempNotificationMessage] = useState(notificationMessage || '');
    const [isGeneralSaving, setIsGeneralSaving] = useState(false);

    useEffect(() => {
        if (overlayConfig) {
            setOverlayEnabled(overlayConfig.enabled);
            setOverlayText(overlayConfig.text);
        }
    }, [overlayConfig]);

    // Sync local state with context values when they change
    useEffect(() => {
        setTempShippingFee(baseShippingFee.toString());
        setTempThreshold(freeShippingThreshold.toString());
        setTempNotificationMessage(notificationMessage || '');
    }, [baseShippingFee, freeShippingThreshold, notificationMessage]);

    const handleSaveOverlay = async () => {
        setIsOverlaySaving(true);
        try {
            const success = await updateOverlayConfig({
                enabled: overlayEnabled,
                text: overlayText,
                dismissible: true // Always dismissible for now
            });

            if (success) {
                addToast('Overlay settings saved', 'success');
            } else {
                addToast('Failed to save overlay settings', 'error');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            addToast('Error saving settings', 'error');
        } finally {
            setIsOverlaySaving(false);
        }
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGeneralSaving(true);
        try {
            const fee = parseInt(tempShippingFee);
            const threshold = parseInt(tempThreshold);

            if (!isNaN(fee) && fee >= 0) {
                await updateShippingFee(fee);
            }
            if (!isNaN(threshold) && threshold >= 0) {
                await updateFreeShippingThreshold(threshold);
            }

            await updateNotificationMessage(tempNotificationMessage);

            addToast('General settings saved', 'success');
        } catch (error) {
            console.error('Error saving general settings:', error);
            addToast('Error saving settings', 'error');
        } finally {
            setIsGeneralSaving(false);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };

            img.onload = () => {
                // Create canvas to resize
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxDim = 300; // Resize to max 300px

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDim) {
                        height *= maxDim / width;
                        width = maxDim;
                    }
                } else {
                    if (height > maxDim) {
                        width *= maxDim / height;
                        height = maxDim;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64 = canvas.toDataURL('image/webp', 0.8);
                    updateStoreLogo(base64);
                }
            };

            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Site Settings</h2>
            </div>

            {/* General Store Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">General Store Settings</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Manage basic store configuration</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveGeneral} className="space-y-6">
                        {/* Shipping */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-slate-400" /> Shipping Fee (IQD)
                                </label>
                                <input
                                    type="number"
                                    value={tempShippingFee}
                                    onChange={(e) => setTempShippingFee(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-slate-400" /> Free Shipping Threshold (IQD)
                                </label>
                                <input
                                    type="number"
                                    value={tempThreshold}
                                    onChange={(e) => setTempThreshold(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Notification Bar */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400" /> Notification Bar Message (RTL)
                            </label>
                            <input
                                type="text"
                                value={tempNotificationMessage}
                                onChange={(e) => setTempNotificationMessage(e.target.value)}
                                placeholder="Enter notification text (e.g. Special Offer...)"
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none text-right"
                                dir="rtl"
                            />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                This message appears at the very top of the home page. Leave empty to hide.
                                <br />
                                <strong>Tip:</strong> Separate multiple messages with <code>|</code> to rotate them automatically.
                            </p>
                        </div>

                        {/* Store Parameters Separator */}
                        <div className="border-t border-slate-100 dark:border-slate-700/50 my-4"></div>

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Store Icon / Logo</label>
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-600 shadow-sm shrink-0 bg-slate-50 dark:bg-slate-900 flex items-center justify-center group relative">
                                    {storeLogo ? (
                                        <img src={storeLogo} alt="Current Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="h-8 w-8 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <label className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm">
                                        <Upload className="h-4 w-4 mr-2" />
                                        Change Icon
                                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                    <p className="text-xs text-slate-500 mt-2">Updates App Logo, Splash Screen, and Favicon.</p>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-2">
                            <button
                                type="submit"
                                disabled={isGeneralSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                            >
                                {isGeneralSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save General Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Home Page Overlay Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Home Page Overlay Popup</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Configure the modal popup shown to visitors</p>
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
                                onClick={() => setOverlayEnabled(!overlayEnabled)}
                                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${overlayEnabled ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span
                                    className={`${overlayEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-5 w-5 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        {/* Text Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Overlay Content
                            </label>
                            <textarea
                                value={overlayText}
                                onChange={(e) => setOverlayText(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                                placeholder="Enter the message to display..."
                            />
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                This text will be displayed in the center of the popup overlay.
                            </p>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end pt-4">
                            <button
                                onClick={handleSaveOverlay}
                                disabled={isOverlaySaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
                            >
                                {isOverlaySaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Overlay Settings
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
