import React, { useState, useEffect } from 'react';
import { Search, Smartphone, AlertTriangle } from 'lucide-react';
import { supabase } from '../../services/supabase';

export const SearchAnalysis: React.FC = () => {
    const [topSearches, setTopSearches] = useState<any[]>([]);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [visitorDevices, setVisitorDevices] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch Top Searches
            const { data: searchData, error: searchErr } = await supabase
                .from('search_terms')
                .select('*')
                .order('count', { ascending: false })
                .limit(20); // Increased limit for dedicated page

            if (searchErr) {
                console.error('Error fetching search terms:', searchErr);
                setSearchError(searchErr.message);
            } else if (searchData) {
                setTopSearches(searchData);
            }

            // Fetch Visitor Devices
            const { data: deviceData } = await supabase
                .from('visitor_devices')
                .select('*')
                .order('visit_count', { ascending: false });

            if (deviceData) setVisitorDevices(deviceData);
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Search & Visitor Analysis</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Search Analysis */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Search className="h-5 w-5 mr-2 text-gray-500" /> Top Search Terms
                    </h3>
                    <div className="space-y-3">
                        {searchError ? (
                            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Error loading data</p>
                                    <p className="text-xs opacity-80">{searchError}</p>
                                    {searchError.includes('does not exist') && (
                                        <p className="text-xs mt-1 font-bold">Please run supabase/search_terms.sql</p>
                                    )}
                                </div>
                            </div>
                        ) : topSearches.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {topSearches.map((term, idx) => (
                                    <div key={term.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${idx < 3
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-gray-700 dark:text-slate-300 font-medium">{term.term}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-gray-400 dark:text-slate-500">
                                                {new Date(term.last_searched_at).toLocaleDateString()}
                                            </span>
                                            <span className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full text-xs font-bold">
                                                {term.count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No search data recorded yet.</p>
                        )}
                    </div>
                </div>

                {/* Visitor Devices */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-fit">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                        <Smartphone className="h-5 w-5 mr-2 text-gray-500" /> Visitor Devices
                    </h3>
                    <div className="space-y-3">
                        {visitorDevices.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {visitorDevices.map((device) => (
                                    <div key={device.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0 text-sm">
                                        <span className="text-gray-700 dark:text-slate-300 font-medium">{device.device_name}</span>
                                        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-xs font-bold">
                                            {device.visit_count} visits
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-slate-400 text-center py-8">No device data recorded yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
