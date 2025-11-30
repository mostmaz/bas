
import React, { useState } from 'react';
import { Trash2, Wand2, Loader2, Upload, Plus, RefreshCw } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { generateBrandLogo } from '../../services/geminiService';

export const BrandManagement: React.FC = () => {
  const { brands, addBrand, deleteBrand, refreshBrands } = useShop();
  const [newBrandName, setNewBrandName] = useState('');
  const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleGenerateLogo = async () => {
    if (!newBrandName.trim()) {
      alert("Please enter a brand name first.");
      return;
    }
    setIsGenerating(true);
    try {
      const logoUrl = await generateBrandLogo(newBrandName);
      setGeneratedLogo(logoUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to generate logo. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getErrorMessage = (error: any): string => {
    if (!error) return "Unknown error";
    if (typeof error === 'string') return error;
    return error.message || error.error_description || JSON.stringify(error);
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    setIsSubmitting(true);
    try {
      // Pass the generated logo if available, otherwise undefined
      await addBrand(newBrandName.trim(), generatedLogo || undefined);
      setNewBrandName('');
      setGeneratedLogo(null);
    } catch (error: any) {
      console.error("Error adding brand:", error);
      const msg = getErrorMessage(error);
      
      if (msg.includes('logo') && (msg.includes('does not exist') || msg.includes('PGRST204') || msg.includes('schema cache'))) {
         alert("Database Error: The 'logo' column is missing. Please go to the Dashboard Overview, run the SQL script again, and restart Supabase schema cache if possible.");
      } else {
         alert(`Failed to add brand: ${msg}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this brand?')) {
      setDeletingId(id);
      try {
        await deleteBrand(id);
      } catch (error: any) {
        console.error("Error deleting brand:", error);
        alert(`Failed to delete brand: ${getErrorMessage(error)}`);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshBrands();
    setIsRefreshing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Brand Management</h2>
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
        {/* Add Brand Card */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-fit">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Add New Brand</h3>
          <form onSubmit={handleAddBrand} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Brand Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TechNova"
                  className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Brand Logo</label>
              <div className="flex items-center gap-4">
                 <div className="h-24 w-24 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 flex items-center justify-center relative group shrink-0">
                    {generatedLogo ? (
                      <img src={generatedLogo} alt="Logo Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">No logo</span>
                    )}
                    {isGenerating && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                 </div>
                 
                 <div className="flex flex-col gap-2 w-full">
                   <Button 
                     type="button" 
                     onClick={handleGenerateLogo}
                     disabled={isGenerating || !newBrandName.trim() || isSubmitting}
                     className="text-xs w-full sm:w-auto"
                     variant="secondary"
                   >
                     <Wand2 className="h-3 w-3 mr-2" />
                     {isGenerating ? 'Creating...' : 'Generate with AI'}
                   </Button>
                   
                   <label className={`inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <Upload className="h-3 w-3 mr-2" /> Upload Image
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        disabled={isSubmitting}
                      />
                   </label>
                 </div>
              </div>
              {generatedLogo && !isGenerating && (
                <p className="text-xs text-green-600 mt-2">Logo ready to save.</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={!newBrandName.trim() || isSubmitting} 
              className="w-full"
              isLoading={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Brand
            </Button>
          </form>
        </div>

        {/* Brand List */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col h-[500px]">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 shrink-0 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-slate-300">Active Brands ({brands.length})</h3>
            <span className="text-xs text-gray-400">ID normalized</span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-slate-700 overflow-y-auto custom-scrollbar flex-1">
            {brands.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-slate-400 text-sm p-6">
                <p>No brands added yet.</p>
              </div>
            ) : (
              brands.map((brand) => (
                <div key={brand.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                      {brand.logo ? (
                        <img 
                          src={brand.logo} 
                          alt={brand.name} 
                          loading="lazy"
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <span className="text-lg font-bold text-violet-600 dark:text-violet-400">{brand.name.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-white font-medium">{brand.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">{brand.id}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteBrand(brand.id)}
                    disabled={deletingId === brand.id}
                    className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete Brand"
                  >
                    {deletingId === brand.id ? (
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
