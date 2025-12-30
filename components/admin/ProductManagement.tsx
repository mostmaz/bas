import React, { useState, useMemo, useRef } from 'react';
import { Plus, Pencil, Trash2, RefreshCw, Filter, Download, Upload, CheckSquare, Link as LinkIcon, Square, Layers, AlertTriangle } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { Button } from '../Button';
import { Product } from '../../types';
import { ProductFormModal } from './ProductFormModal';
import { CollectionFormModal } from './CollectionFormModal';
import * as XLSX from 'xlsx';
import { supabase } from '../../services/supabase';
import { generateProductTags } from '../../services/geminiService';

// Helper to upload image from URL directly to server
const uploadImageFromUrl = async (url: string): Promise<string> => {
  if (!url) return '';
  // If it's already a Supabase URL, return it (optional optimization)
  if (url.includes('supabase.co')) return url;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Status: ${response.status}`);

    const blob = await response.blob();
    const filename = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, blob, {
        contentType: blob.type || 'image/jpeg',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    return publicUrl;
  } catch (error) {
    console.warn(`[Bulk Upload] Failed to upload image from URL: ${url}. Keeping original URL.`, error);
    return url;
  }
};

export const ProductManagement: React.FC<{ filter?: 'low-stock'; initialTab?: 'all' | 'low-stock' }> = ({ filter, initialTab }) => {
  const { products, deleteProduct, addProduct, updateProduct, refreshProducts } = useShop();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBatchEditing, setIsBatchEditing] = useState(false);
  const [batchEdits, setBatchEdits] = useState<{ [id: string]: { name: string; price: number } }>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);

  // Filter State
  const [selectedDevice, setSelectedDevice] = useState<string>('All');

  // File Input Ref for Bulk Upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Extract Unique Devices for Filter
  const uniqueDevices = useMemo(() => {
    const devices = new Set(products.map(p => p.device).filter(Boolean));
    return ['All', ...Array.from(devices).sort()];
  }, [products]);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = products;

    // 1. Filter by Device
    if (selectedDevice !== 'All') {
      result = result.filter(p => p.device === selectedDevice);
    }

    // 2. Filter by "Low Stock" mode
    if (filter === 'low-stock' || initialTab === 'low-stock') {
      result = result.filter(p => p.stock <= 10);
    }

    // 3. Hide "Collection" items unless we are in a specific collection view (not handled here yet, but standard products tab shouldn't show them)
    // Assuming 'Collection' category is used for collections.
    // If filter is NOT low-stock (i.e. standard inventory), hide collections.
    // If filter IS low-stock, we might still want to hide them or show them if they track stock?
    // For now, let's hide Collections from the main list to avoid clutter.
    // Use a more robust check if possible, but category is good.
    result = result.filter(p => p.category !== 'Collection');

    return result;
  }, [products, selectedDevice, filter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDevice]);

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
        image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=75",
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

            // Image URL Conversion (Upload to Server)
            if (base.image) {
              base.image = await uploadImageFromUrl(String(base.image));
            }

            if (variants.length > 0) {
              await Promise.all(variants.map(async (v: any) => {
                if (v.image) {
                  v.image = await uploadImageFromUrl(String(v.image));
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
              image: base.image || 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=75',
              images: imageList.length > 0 ? imageList : ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=600&q=75'],
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

  const [isFixingImages, setIsFixingImages] = useState(false);
  const [isFixingTags, setIsFixingTags] = useState(false);
  const [fixProgress, setFixProgress] = useState({ current: 0, total: 0 });
  const [fixTagsProgress, setFixTagsProgress] = useState({ current: 0, total: 0 });

  const handleFixImages = async () => {
    if (!window.confirm("This will scan all products for base64 images and upload them to the server. This may take a while. Continue?")) return;

    setIsFixingImages(true);
    setFixProgress({ current: 0, total: products.length });
    let fixedCount = 0;

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        setFixProgress(prev => ({ ...prev, current: i + 1 }));

        let needsUpdate = false;
        let updatedProduct = { ...product };

        // Check main image
        if (product.image && product.image.startsWith('data:image')) {
          try {
            updatedProduct.image = await uploadImageFromUrl(product.image);
            needsUpdate = true;
          } catch (e) {
            console.error(`Failed to fix image for ${product.name}`, e);
          }
        }

        // Check gallery images
        if (product.images && product.images.length > 0) {
          const newImages = await Promise.all(product.images.map(async (img) => {
            if (img && img.startsWith('data:image')) {
              needsUpdate = true;
              return await uploadImageFromUrl(img);
            }
            return img;
          }));
          updatedProduct.images = newImages;
        }

        // Check variants
        if (product.variants && product.variants.length > 0) {
          const newVariants = await Promise.all(product.variants.map(async (v) => {
            if (v.image && v.image.startsWith('data:image')) {
              needsUpdate = true;
              const newUrl = await uploadImageFromUrl(v.image);
              return { ...v, image: newUrl };
            }
            return v;
          }));
          updatedProduct.variants = newVariants;
        }

        if (needsUpdate) {
          await updateProduct(updatedProduct);
          fixedCount++;
        }
      }

      alert(`Image fix complete! Fixed ${fixedCount} products.`);
      await refreshProducts();

    } catch (error) {
      console.error("Error fixing images:", error);
      alert("An error occurred while fixing images. Check console for details.");
    } finally {
      setIsFixingImages(false);
      setFixProgress({ current: 0, total: 0 });
    }
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
  };

  const handleBatchEditStart = () => {
    const initialEdits: { [id: string]: { name: string; price: number } } = {};
    filteredProducts.forEach(p => {
      if (selectedProducts.has(p.id)) {
        initialEdits[p.id] = { name: p.name, price: p.price };
      }
    });
    setBatchEdits(initialEdits);
    setIsBatchEditing(true);
  };

  const handleBatchEditSave = async () => {
    if (!window.confirm(`Save changes for ${Object.keys(batchEdits).length} products?`)) return;

    setIsSaving(true);
    try {
      const updates = Object.entries(batchEdits).map(async ([id, changes]) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        await updateProduct({
          ...product,
          name: changes.name,
          price: changes.price
        });
      });

      await Promise.all(updates);
      await refreshProducts();
      setIsBatchEditing(false);
      setBatchEdits({});
      setSelectedProducts(new Set());
      alert("Batch updates saved successfully!");
    } catch (error) {
      console.error("Batch update failed:", error);
      alert("Some updates failed. Check console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBatchInputChange = (id: string, field: 'name' | 'price', value: string | number) => {
    setBatchEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleSaveCollection = () => {
    if (selectedProducts.size < 2) {
      alert("Please select at least 2 products to create a collection.");
      return;
    }
    setIsCollectionModalOpen(true);
  };

  const handleCollectionSave = async (collectionData: any) => {
    setIsSaving(true);
    try {
      // Create the collection as a product
      await addProduct({
        ...collectionData,
        id: Date.now().toString(),
        rating: 5.0,
        category: 'Collection',
        // Store selected product IDs in description
        description: `${collectionData.description}\n\nContains products: ${Array.from(selectedProducts).join(', ')}`
      });

      setSelectedProducts(new Set());
      setIsCollectionModalOpen(false);
      await refreshProducts();
      alert("Collection created successfully!");
    } catch (error: any) {
      console.error("Failed to save collection:", error);
      alert(`Failed to save collection: ${error.message}`);
    } finally {
      setIsSaving(false);
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
            onClick={handleFixTags}
            disabled={isFixingTags}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-400 dark:hover:bg-purple-900/20"
            title="Generate Smart Tags for Search"
          >
            <RefreshCw className={`h-4 w-4 ${isFixingTags ? 'animate-spin' : ''}`} />
            Fix Tags
          </Button>

          <Button
            variant="outline"
            onClick={handleFixImages}
            disabled={isFixingImages}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20"
            title="Fix Base64 Images"
          >
            <RefreshCw className={`h-4 w-4 ${isFixingImages ? 'animate-spin' : ''}`} />
            Fix Images
          </Button>

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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-medium">{filteredProducts.length}</span> products
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div >

      {isFixingImages && (
        <div className="mb-6 bg-white dark:bg-slate-800 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-amber-700 dark:text-amber-400">Fixing Images...</span>
            <span className="text-gray-500 dark:text-gray-400">{Math.round((fixProgress.current / fixProgress.total) * 100)}% ({fixProgress.current}/{fixProgress.total})</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-slate-700 overflow-hidden">
            <div
              className="bg-amber-500 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(fixProgress.current / fixProgress.total) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Please do not close this page. We are converting base64 images to secure URLs.
          </p>
        </div>
      )}

      {
        selectedProducts.size > 0 && (
          <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-200 font-medium">
              <CheckSquare className="h-4 w-4" />
              {selectedProducts.size} Selected
            </div>
            <div className="flex items-center gap-2">
              {!isBatchEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleBatchEditStart}
                    className="bg-white dark:bg-slate-800 text-indigo-600 border border-indigo-200 hover:bg-indigo-50"
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Batch Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const ids = Array.from(selectedProducts).join(',');
                      const url = `${window.location.origin}/filtered-products?ids=${ids}`;
                      navigator.clipboard.writeText(url);
                      alert(`Page URL copied to clipboard!\n\n${url}`);
                    }}
                    className="bg-white dark:bg-slate-800"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" /> Generate Page
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveCollection}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Layers className="h-4 w-4 mr-2" /> Save as Collection
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsBatchEditing(false)}
                    className="bg-white dark:bg-slate-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleBatchEditSave}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      }

      < div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden" >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-400 font-medium border-b border-gray-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 w-10">
                  <button onClick={handleSelectAll} className="text-gray-400 hover:text-indigo-600">
                    {selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length ? (
                      <CheckSquare className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <Square className="h-5 w-5" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Specs</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-slate-400 italic">
                    No products found for the selected device.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product) => (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${selectedProducts.has(product.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => handleSelectProduct(product.id)} className="text-gray-400 hover:text-indigo-600">
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-md overflow-hidden border border-gray-200 dark:border-slate-600 shrink-0">
                        <img
                          src={product.image || '/placeholder.png'}
                          alt=""
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-1">
                        {isBatchEditing && batchEdits[product.id] ? (
                          <input
                            type="text"
                            value={batchEdits[product.id].name}
                            onChange={(e) => handleBatchInputChange(product.id, 'name', e.target.value)}
                            className="w-full border border-indigo-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        ) : (
                          <>
                            <span className="font-medium text-gray-900 dark:text-white block">{product.name}</span>
                            <span className="text-gray-500 dark:text-slate-400 text-xs">{product.category}</span>
                          </>
                        )}
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
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                      {isBatchEditing && batchEdits[product.id] ? (
                        <input
                          type="number"
                          value={batchEdits[product.id].price}
                          onChange={(e) => handleBatchInputChange(product.id, 'price', Number(e.target.value))}
                          className="w-24 border border-indigo-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      ) : (
                        `IQD ${product.price.toLocaleString()}`
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-slate-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show window of pages around current page
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 2 + i;
                    }
                    if (pageNum > totalPages) {
                      pageNum = totalPages - 4 + i;
                    }
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${currentPage === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div >

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={editingProduct}
        onSave={handleSaveProduct}
      />

      <CollectionFormModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        selectedCount={selectedProducts.size}
        onSave={handleCollectionSave}
      />
    </div >
  );
};
