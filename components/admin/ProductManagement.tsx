


import React, { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Filter, Download, Upload } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import * as XLSX from 'xlsx';

// Helper to convert URL to Base64
const convertUrlToBase64 = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  
  try {
    const response = await fetch(url);
    // If CORS fails, fetch throws. If 404, response.ok is false.
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn(`[Bulk Upload] Failed to convert image to base64 (CORS/Network). Using original URL.`, error);
    return url;
  }
};

export const ProductManagement: React.FC = () => {
  const { products, deleteProduct, addProduct, updateProduct, refreshProducts } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter State
  const [selectedDevice, setSelectedDevice] = useState<string>('All');
  
  // File Input Ref for Bulk Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract Unique Devices for Filter
  const uniqueDevices = useMemo(() => {
    const devices = new Set(products.map(p => p.device).filter(Boolean));
    return ['All', ...Array.from(devices).sort()];
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    return products.filter(p => selectedDevice === 'All' || p.device === selectedDevice);
  }, [products, selectedDevice]);

  const handleAddClick = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshProducts();
    setIsRefreshing(false);
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        name: "Simple Product Example",
        sku: "PROD-001",
        price: 25000,
        salePrice: 20000,
        category: "Minimalist",
        device: "iPhone 15",
        brand: "CaseCraft",
        description: "Standard case without variants",
        stock: 50,
        image: "https://images.unsplash.com/photo-1603351154351-5cf233d327e4",
        variantColor: "",
        variantStock: "",
        variantSku: "",
        variantImage: ""
      },
      {
        name: "Grouped Product Example",
        sku: "PROD-002",
        price: 30000,
        category: "Artistic",
        device: "iPhone 14",
        brand: "UrbanArmor",
        description: "This product has 2 variants (Red and Blue) defined in 2 rows",
        image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f",
        variantColor: "Red",
        variantStock: 10,
        variantSku: "PROD-002-RED",
        variantImage: "https://example.com/red-image.jpg"
      },
      {
        name: "Grouped Product Example",
        sku: "", // Main SKU only needed on first row
        price: 30000,
        category: "Artistic",
        device: "iPhone 14",
        brand: "UrbanArmor",
        description: "", // Can be empty for subsequent variant rows
        image: "", // Can be empty if same as above
        variantColor: "Blue",
        variantStock: 5,
        variantSku: "PROD-002-BLUE",
        variantImage: "https://example.com/blue-image.jpg"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "BasCavarat_Bulk_Template.xlsx");
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Safety check for library loading
    if (!XLSX || !XLSX.read) {
        alert("Excel library not loaded properly. Please refresh the page.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("File could not be read");

        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (!jsonData || jsonData.length === 0) {
           alert("No data found in the file.");
           return;
        }

        // Helper to normalize keys to lowercase (handles "Price" vs "price")
        const normalizeRow = (row: any) => {
           const normalized: any = {};
           Object.keys(row).forEach(key => {
              normalized[key.toLowerCase().trim()] = row[key];
           });
           return normalized;
        };

        // Group rows by Product Name to handle variants
        const productsMap = new Map<string, { base: any, variants: any[] }>();

        for (const rawRow of jsonData as any[]) {
           const row = normalizeRow(rawRow);
           const name = row.name ? String(row.name).trim() : null;
           
           if (!name) continue; // Skip rows without name

           if (!productsMap.has(name)) {
              productsMap.set(name, { base: row, variants: [] });
           }
           
           const group = productsMap.get(name)!;

           // Check if this row defines a variant (normalized keys)
           if (row.variantcolor) {
              group.variants.push({
                 id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                 color: String(row.variantcolor),
                 stock: Number(row.variantstock) || 0,
                 sku: row.variantsku ? String(row.variantsku) : undefined,
                 image: row.variantimage || '' 
              });
           }
        }

        if (productsMap.size === 0) {
           alert("No valid products identified. Please ensure the Excel file has a 'name' column.");
           return;
        }

        if (!window.confirm(`Found ${productsMap.size} unique products from ${jsonData.length} rows. Proceed with upload?`)) {
           return;
        }
        
        setIsSaving(true);
        let successCount = 0;
        let failCount = 0;
        
        for (const { base, variants } of productsMap.values()) {
           try {
              // Basic Validation
              if (!base.name || !base.price) {
                  console.warn("Skipping invalid product (missing name or price):", base);
                  failCount++;
                  continue;
              }

              // Image URL Conversion
              if (base.image) {
                  base.image = await convertUrlToBase64(String(base.image));
              }

              if (variants.length > 0) {
                 await Promise.all(variants.map(async (v: any) => {
                     if (v.image) {
                         v.image = await convertUrlToBase64(String(v.image));
                     }
                 }));
              }
              
              // Calculate total stock
              let finalStock = Number(base.stock) || 0;
              if (variants.length > 0) {
                 finalStock = variants.reduce((sum: number, v: any) => sum + v.stock, 0);
              }

              // Consolidate images
              const imageList: string[] = base.image ? [base.image] : [];
              variants.forEach((v: any) => {
                 if (v.image && !imageList.includes(v.image)) {
                    imageList.push(v.image);
                 }
              });
              
              // Map legacy colors
              const colors = Array.from(new Set(variants.map((v: any) => v.color)));

              await addProduct({
                name: String(base.name),
                sku: base.sku ? String(base.sku) : undefined,
                price: Number(base.price),
                salePrice: base.saleprice ? Number(base.saleprice) : undefined,
                category: base.category || 'Mobile Case',
                device: base.device || 'Generic',
                brand: base.brand || 'Generic',
                description: base.description || '',
                image: base.image || 'https://images.unsplash.com/photo-1603351154351-5cf233d327e4',
                images: imageList.length > 0 ? imageList : ['https://images.unsplash.com/photo-1603351154351-5cf233d327e4'],
                stock: finalStock,
                colors: colors,
                variants: variants
              });
              successCount++;
           } catch (err) {
              console.error("Error adding product:", base.name, err);
              failCount++;
           }
        }
        
        alert(`Bulk upload completed!\nSuccessfully added: ${successCount}\nFailed: ${failCount}`);
        await refreshProducts();
        
      } catch (error: any) {
         console.error("Error processing file:", error);
         alert(`Failed to process file: ${error.message || "Unknown error"}`);
      } finally {
         setIsSaving(false);
         // Reset input so same file can be selected again
         if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
        alert("Failed to read file");
        setIsSaving(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'rating'>) => {
    setIsSaving(true);
    try {
      if (editingProduct) {
        await updateProduct({
          ...productData,
          id: editingProduct.id,
          rating: editingProduct.rating,
        });
      } else {
        await addProduct({
          ...productData,
          id: Date.now().toString(),
          rating: 5.0,
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save product:", error);
      
      let msg = "Unknown database error";
      try {
        if (typeof error === 'string') {
          msg = error;
        } else if (error instanceof Error) {
          msg = error.message;
        } else if (typeof error === 'object' && error !== null) {
          msg = error.message || error.error_description || error.details || error.hint || JSON.stringify(error);
        }
      } catch (e) {
        msg = "Error details could not be parsed";
      }

      const errorString = String(msg);
      const lowerMsg = errorString.toLowerCase();

      if (lowerMsg.includes("schema cache") || lowerMsg.includes("images") || lowerMsg.includes("column") || lowerMsg.includes("42703")) {
         alert("Database Schema Sync Issue detected.\n\nThe app tried to save the 'images' gallery, but the database doesn't recognize the column yet.\n\nFIX:\n1. Go to Supabase Dashboard > Settings > API.\n2. Click 'Reload' under Schema Cache.\n\n(We attempted to save the product without the gallery as a fallback - check the list!)");
      } else if (lowerMsg.includes("payload") || lowerMsg.includes("too large") || lowerMsg.includes("413")) {
         alert("Error: Image size is too large for the database. Please try fewer or smaller images.");
      } else {
         alert(`Failed to save product:\n${errorString}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const triggerFileUpload = () => {
     if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset to ensure change event fires even for same file
        fileInputRef.current.click();
     }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Product Inventory</h2>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Filter className="h-4 w-4" />
            </div>
            <select 
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none cursor-pointer"
            >
              {uniqueDevices.map(device => (
                <option key={device} value={device}>
                  {device === 'All' ? 'Filter by Device: All' : device}
                </option>
              ))}
            </select>
          </div>

          <Button 
            variant="outline" 
            onClick={handleDownloadTemplate} 
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border-green-200 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
            title="Download Excel Template"
          >
            <Download className="h-4 w-4" /> Template
          </Button>

          <div className="relative">
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleBulkUpload} 
               accept=".xlsx, .xls, .csv" 
               className="hidden" 
             />
             <Button 
               variant="outline" 
               onClick={triggerFileUpload} 
               className="flex items-center gap-2 bg-white dark:bg-slate-800 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
               title="Upload Excel/CSV"
               disabled={isSaving}
             >
               {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Bulk Add
             </Button>
          </div>

          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-white dark:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Specs</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400 italic">
                    No products found for the selected device.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img 
                        src={product.image} 
                        alt="" 
                        loading="lazy"
                        className="h-10 w-10 rounded-md object-cover border border-gray-200 dark:border-slate-600" 
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white block">{product.name}</span>
                        <span className="text-gray-500 dark:text-slate-400 text-xs">{product.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 dark:text-slate-400">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{product.device}</span>
                        <span className="text-gray-500 dark:text-slate-500">{product.brand}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">IQD {product.price.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 dark:hover:bg-slate-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
};