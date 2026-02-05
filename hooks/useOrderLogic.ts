import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Order, Product } from '../types';
import { supabase } from '../services/supabase';
import { sendOrderNotification, sendWhatsAppNotification, sendTwilioWhatsAppNotification } from '../services/emailService';

// Helper to map database lowercase columns to camelCase Order interface
const mapOrderFromDB = (data: any): Order => ({
    id: data.id,
    customerName: data.customerName || data.customername || 'Unknown',
    phone: data.phone || '',
    city: data.city || '',
    address: data.address || '',
    // Handle items if they come back as a JSON string or already an object
    items: (() => {
        if (typeof data.items === 'string') {
            try {
                return JSON.parse(data.items);
            } catch (e) {
                console.error(`Failed to parse items for order ${data.id}`, e);
                return [];
            }
        }
        return data.items || [];
    })(),
    totalAmount: Number(data.totalAmount || data.totalamount || 0),
    shippingFee: Number(data.shippingFee || data.shippingfee || 0),
    discountAmount: Number(data.discountAmount || data.discountamount || 0),
    discountCode: data.discountCode || data.discountcode || undefined,
    orderNumber: data.orderNumber || data.ordernumber || '',
    status: data.status || 'Processing',
    date: Number(data.date || Date.now()),
});

export const useOrderLogic = (
    isSupabaseConfigured: boolean,
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void,
    products: Product[],
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>,
    refreshProducts: (silent?: boolean) => Promise<void>
) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [isOrdersLoading, setIsOrdersLoading] = useState(false);
    const ORDERS_PER_PAGE = 10;

    const placeOrder = useCallback(async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
        const newOrder = {
            ...orderData,
            status: 'Processing' as const,
            date: Date.now(),
            customername: orderData.customerName,
            totalamount: orderData.totalAmount,
            shippingfee: orderData.shippingFee,
            discountamount: orderData.discountAmount,
            discountcode: orderData.discountCode,
            ordernumber: orderData.orderNumber
        };

        if (isSupabaseConfigured) {
            // Optimization: Sanitize items to remove large fields like description and extra images
            // We only need the snapshot of price, name, variant, and main image.
            const sanitizedItems = newOrder.items.map(item => {
                const { description, images, ...rest } = item;
                return rest;
            });

            const dbPayload = {
                ...newOrder,
                items: sanitizedItems
            };
            const { customerName, totalAmount, shippingFee, discountAmount, discountCode, orderNumber, ...cleanPayload } = dbPayload as any;

            const { error } = await supabase.from('orders').insert([cleanPayload]);
            if (error) throw error;

            const updatePromises = orderData.items.map(async (item) => {
                const product = products.find(p => p.id === item.id);
                if (product) {
                    let newStock = product.stock;
                    let variantsToUpdate = product.variants;

                    if (item.selectedVariant && variantsToUpdate) {
                        variantsToUpdate = variantsToUpdate.map(v => {
                            if (v.id === item.selectedVariant?.id) {
                                return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                            }
                            return v;
                        });
                        newStock = variantsToUpdate.reduce((sum, v) => sum + v.stock, 0);

                        return supabase.from('products').update({
                            stock: newStock,
                            variants: variantsToUpdate
                        }).eq('id', item.id);

                    } else {
                        newStock = Math.max(0, product.stock - item.quantity);
                        return supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                    }
                }
            });

            await Promise.all(updatePromises);

            // Optimistic Update: Add new order to state without re-fetching all orders
            const optimisticOrder: Order = {
                id: cleanPayload.id || Date.now().toString(), // Fallback ID if not returned
                customerName: newOrder.customername,
                phone: newOrder.phone,
                city: newOrder.city,
                address: newOrder.address,
                items: newOrder.items,
                totalAmount: newOrder.totalamount,
                shippingFee: newOrder.shippingfee,
                discountAmount: newOrder.discountamount,
                discountCode: newOrder.discountcode,
                status: newOrder.status,
                date: newOrder.date,
                orderNumber: newOrder.ordernumber
            };
            setOrders(prev => [optimisticOrder, ...prev]);

            // Send Notifications
            sendOrderNotification(optimisticOrder);
            sendWhatsAppNotification(optimisticOrder);
            sendTwilioWhatsAppNotification(optimisticOrder, 'admin');
            sendTwilioWhatsAppNotification(optimisticOrder, 'customer');

            // Facebook Pixel: Purchase
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                    value: newOrder.totalamount,
                    currency: 'IQD',
                    content_ids: newOrder.items.map((i: any) => i.id),
                    content_type: 'product',
                    num_items: newOrder.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
                    order_id: optimisticOrder.id
                });
            }

            // Optimistic Update: Update product stock in state without re-fetching all products
            setProducts(prev => prev.map(p => {
                const item = orderData.items.find(i => i.id === p.id);
                if (item) {
                    if (item.selectedVariant && p.variants) {
                        const updatedVariants = p.variants.map(v => {
                            if (v.id === item.selectedVariant?.id) return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                            return v;
                        });
                        return { ...p, variants: updatedVariants, stock: updatedVariants.reduce((a, b) => a + b.stock, 0) };
                    }
                    return { ...p, stock: Math.max(0, p.stock - item.quantity) };
                }
                return p;
            }));

        } else {
            const localOrder: Order = {
                id: Date.now().toString(),
                customerName: orderData.customerName,
                phone: orderData.phone,
                city: orderData.city,
                address: orderData.address,
                items: orderData.items,
                totalAmount: orderData.totalAmount,
                shippingFee: orderData.shippingFee,
                discountAmount: orderData.discountAmount,
                discountCode: orderData.discountCode,
                status: 'Processing',
                date: Date.now(),
                orderNumber: orderData.orderNumber
            };
            setOrders(prev => [localOrder, ...prev]);

            // Send Notifications
            sendOrderNotification(localOrder);
            sendWhatsAppNotification(localOrder);
            sendTwilioWhatsAppNotification(localOrder, 'admin');
            sendTwilioWhatsAppNotification(localOrder, 'customer');

            // Facebook Pixel: Purchase
            if (typeof window !== 'undefined' && (window as any).fbq) {
                (window as any).fbq('track', 'Purchase', {
                    value: localOrder.totalAmount,
                    currency: 'IQD',
                    content_ids: localOrder.items.map(i => i.id),
                    content_type: 'product',
                    num_items: localOrder.items.reduce((acc, item) => acc + item.quantity, 0),
                    order_id: localOrder.id
                });
            }

            setProducts(prev => prev.map(p => {
                const item = orderData.items.find(i => i.id === p.id);
                if (item) {
                    if (item.selectedVariant && p.variants) {
                        const updatedVariants = p.variants.map(v => {
                            if (v.id === item.selectedVariant?.id) return { ...v, stock: Math.max(0, v.stock - item.quantity) };
                            return v;
                        });
                        return { ...p, variants: updatedVariants, stock: updatedVariants.reduce((a, b) => a + b.stock, 0) };
                    }
                    return { ...p, stock: Math.max(0, p.stock - item.quantity) };
                }
                return p;
            }));
        }
    }, [isSupabaseConfigured, products, setProducts]);

    const updateOrderStatus = useCallback(async (id: string, status: Order['status']) => {
        const order = orders.find(o => o.id === id);
        if (!order) return;

        // Prevent redundant updates
        if (order.status === status) return;

        if (isSupabaseConfigured) {
            const { error } = await supabase.from('orders').update({ status }).eq('id', id);
            if (error) {
                console.error(error);
                addToast('Failed to update status', 'error');
                return;
            }

            // If cancelling, restore stock
            if (status === 'Cancelled' && order.status !== 'Cancelled') {
                const updatePromises = order.items.map(async (item) => {
                    const product = products.find(p => p.id === item.id);
                    if (product) {
                        let newStock = product.stock;
                        let variantsToUpdate = product.variants;

                        if (item.selectedVariant && variantsToUpdate) {
                            variantsToUpdate = variantsToUpdate.map(v => {
                                if (v.id === item.selectedVariant?.id) {
                                    return { ...v, stock: v.stock + item.quantity };
                                }
                                return v;
                            });
                            newStock = variantsToUpdate.reduce((sum, v) => sum + v.stock, 0);

                            await supabase.from('products').update({
                                stock: newStock,
                                variants: variantsToUpdate
                            }).eq('id', item.id);
                        } else {
                            newStock = product.stock + item.quantity;
                            await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                        }
                    }
                });
                await Promise.all(updatePromises);
                await refreshProducts(true);
                addToast('Order cancelled and stock restored', 'success');
            } else {
                addToast(`Order status updated to ${status}`, 'success');
            }

            // Optimistic update for order status
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));

        } else {
            // Local / Demo Mode Logic
            if (status === 'Cancelled' && order.status !== 'Cancelled') {
                setProducts(prev => prev.map(p => {
                    const item = order.items.find(i => i.id === p.id);
                    if (item) {
                        if (item.selectedVariant && p.variants) {
                            const updatedVariants = p.variants.map(v => {
                                if (v.id === item.selectedVariant?.id) return { ...v, stock: v.stock + item.quantity };
                                return v;
                            });
                            return { ...p, variants: updatedVariants, stock: updatedVariants.reduce((a, b) => a + b.stock, 0) };
                        }
                        return { ...p, stock: p.stock + item.quantity };
                    }
                    return p;
                }));
                addToast('Order cancelled and stock restored (Local)', 'success');
            } else {
                addToast(`Order status updated to ${status}`, 'success');
            }
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        }
    }, [isSupabaseConfigured, orders, products, refreshProducts, setProducts, addToast]);

    const fetchTotalRevenue = useCallback(async (resetDate: string | null) => {
        if (!isSupabaseConfigured) return;

        // 1. Fetch Product Costs first
        const { data: costsData } = await supabase
            .from('product_costs')
            .select('product_id, cost');

        const costMap: Record<string, number> = {};
        if (costsData) {
            costsData.forEach((item: any) => {
                costMap[item.product_id] = item.cost;
            });
        }

        // 2. Fetch Orders with Items
        let query = supabase
            .from('orders')
            .select('totalamount, shippingfee, date, status, items');

        // Filter out Cancelled
        query = query.neq('status', 'Cancelled');

        // Apply Reset Date Filter
        if (resetDate) {
            query = query.gt('date', new Date(resetDate).getTime());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching total revenue:', error);
            return;
        }

        if (data) {
            const total = data.reduce((sum, order: any) => {
                // Calculate Order Revenue (Total - Shipping)
                const shipping = order.shippingfee || 0;
                const orderTotal = order.totalamount || 0;
                const orderRevenue = Math.max(0, orderTotal - shipping);

                // Calculate Order Cost (Sum of items * cost)
                let orderCost = 0;
                let items = order.items;

                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                }

                if (Array.isArray(items)) {
                    items.forEach((item: any) => {
                        const unitCost = costMap[item.id] || 0;
                        orderCost += (unitCost * (item.quantity || 1));
                    });
                }

                const profit = orderRevenue - orderCost;
                return sum + profit;
            }, 0);
            setTotalRevenue(total);
        }
    }, [isSupabaseConfigured]);

    const refreshOrders = useCallback(async (pageNumber: number = 1, resetDate: string | null = null) => {
        if (!isSupabaseConfigured) return;

        console.log(`[useOrderLogic] refreshOrders called for page ${pageNumber}.`);
        setIsOrdersLoading(true);

        try {
            // Fetch total count first
            const countResult = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true }); // Head requests only the count, no data

            if (countResult.error) throw countResult.error;

            const total = countResult.count || 0;
            const computedTotalPages = Math.ceil(total / ORDERS_PER_PAGE);
            setTotalPages(computedTotalPages);
            setPage(pageNumber); // Update current page state

            // Determine range for Supabase
            const from = (pageNumber - 1) * ORDERS_PER_PAGE;
            const to = from + ORDERS_PER_PAGE - 1;

            const { data, error } = await supabase
                .from('orders')
                .select('id, customername, phone, city, address, totalamount, shippingfee, discountamount, discountcode, status, date, ordernumber, items')
                .order('date', { ascending: false })
                .range(from, to);

            if (error) {
                console.error('[useOrderLogic] Error fetching orders:', error);
                throw error;
            }

            if (data) {
                console.log(`[useOrderLogic] Successfully fetched ${data.length} orders for page ${pageNumber}.`);
                setOrders(data.map(mapOrderFromDB));
            }

            // Fetch total revenue alongside orders
            // We pass resetDate just in case, but usually it comes from context which isn't available here directly. 
            // Better to handle it via a separate effect or passed argument.
            await fetchTotalRevenue(resetDate);

        } catch (err) {
            console.error('Error refreshing orders:', err);
            // Optional: addToast
        } finally {
            setIsOrdersLoading(false);
        }
    }, [isSupabaseConfigured]);

    const bulkUpdateOrderStatus = useCallback(async (ids: string[], status: Order['status']) => {
        console.log('bulkUpdateOrderStatus (parallel) called', { ids, status });
        if (ids.length === 0) return;

        if (isSupabaseConfigured) {
            // Use Promise.all to update each order individually, as single updates are confirmed to work.
            // This avoids potential issues with .in() queries or RLS policies on batch updates.
            const updatePromises = ids.map(async (id) => {
                const { error } = await supabase.from('orders').update({ status }).eq('id', id);
                if (error) {
                    console.error(`Failed to update order ${id}`, error);
                    throw error; // Propagate error to catch block
                }

                // Handle stock restoration if cancelling
                if (status === 'Cancelled') {
                    const order = orders.find(o => o.id === id);
                    if (order && order.status !== 'Cancelled') {
                        const itemPromises = order.items.map(async (item) => {
                            const product = products.find(p => p.id === item.id);
                            if (product) {
                                let newStock = product.stock;
                                let variantsToUpdate = product.variants;

                                if (item.selectedVariant && variantsToUpdate) {
                                    variantsToUpdate = variantsToUpdate.map(v => {
                                        if (v.id === item.selectedVariant?.id) {
                                            return { ...v, stock: v.stock + item.quantity };
                                        }
                                        return v;
                                    });
                                    newStock = variantsToUpdate.reduce((sum, v) => sum + v.stock, 0);

                                    await supabase.from('products').update({
                                        stock: newStock,
                                        variants: variantsToUpdate
                                    }).eq('id', item.id);
                                } else {
                                    newStock = product.stock + item.quantity;
                                    await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
                                }
                            }
                        });
                        await Promise.all(itemPromises);
                    }
                }
            });

            try {
                await Promise.all(updatePromises);
                console.log('All parallel updates successful');

                if (status === 'Cancelled') await refreshProducts(true);

                setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o));
                addToast(`${ids.length} orders updated`, 'success');
                await refreshOrders();
            } catch (error) {
                console.error('One or more updates failed', error);
                addToast('Some updates failed. Check console.', 'error');
                await refreshOrders(); // Sync to see what actually happened
            }

        } else {
            // Local / Demo Mode Logic
            console.log('Updating Local State...');
            if (status === 'Cancelled') {
                const ordersToCancel = orders.filter(o => ids.includes(o.id) && o.status !== 'Cancelled');

                setProducts(prev => {
                    let newProducts = [...prev];
                    ordersToCancel.forEach(order => {
                        order.items.forEach(item => {
                            const pIndex = newProducts.findIndex(p => p.id === item.id);
                            if (pIndex !== -1) {
                                const p = { ...newProducts[pIndex] };
                                if (item.selectedVariant && p.variants) {
                                    const updatedVariants = p.variants.map(v => {
                                        if (v.id === item.selectedVariant?.id) return { ...v, stock: v.stock + item.quantity };
                                        return v;
                                    });
                                    p.variants = updatedVariants;
                                    p.stock = updatedVariants.reduce((a, b) => a + b.stock, 0);
                                } else {
                                    p.stock = p.stock + item.quantity;
                                }
                                newProducts[pIndex] = p;
                            }
                        });
                    });
                    return newProducts;
                });
            }
            setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, status } : o));
            addToast(`${ids.length} orders updated (Local)`, 'success');
        }
    }, [isSupabaseConfigured, orders, products, refreshProducts, setProducts, addToast, refreshOrders]);

    const searchOrdersByPhone = useCallback(async (phone: string): Promise<Order[]> => {
        if (!isSupabaseConfigured) return [];

        // Sanitize phone for search
        const cleanPhone = phone.replace(/\D/g, '');
        if (!cleanPhone) return [];

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .ilike('phone', `%${cleanPhone}%`)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error searching orders:', error);
            return [];
        }

        return data ? data.map(mapOrderFromDB) : [];
    }, [isSupabaseConfigured]);

    const exportOrders = useCallback(async (selectedIds: string[]) => {
        if (!isSupabaseConfigured || selectedIds.length === 0) return;

        try {
            // 1. Fetch Orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .in('id', selectedIds);

            if (ordersError) throw ordersError;

            // 2. Fetch Product Costs
            // We need costs for all products involved. Optimization: Fetch all costs or filter?
            // Fetching all for simplicity as product count is likely manageable, or we can fetch only needed.
            // Let's fetch all cost data to be safe and simple.
            const { data: costsData, error: costsError } = await supabase
                .from('product_costs')
                .select('product_id, cost');

            if (costsError) throw costsError;

            const costMap: Record<string, number> = {};
            if (costsData) {
                costsData.forEach((item: any) => {
                    costMap[item.product_id] = item.cost;
                });
            }

            // 3. Process Data for Export
            const exportRows: any[] = [];

            ordersData.forEach((orderRaw: any) => {
                const order = mapOrderFromDB(orderRaw);

                // If items is empty, we still want to export the order line? 
                // User asked for "device name, brand, total price, product costs". 
                // This implies item-level rows.
                if (order.items.length === 0) {
                    exportRows.push({
                        "Order Number": order.orderNumber,
                        "Date": new Date(order.date).toLocaleDateString(),
                        "Customer Name": order.customerName,
                        "Phone": order.phone,
                        "City": order.city,
                        "Address": order.address,
                        "Status": order.status,
                        "Total Amount": order.totalAmount,
                        "Shipping Fee": order.shippingFee,
                        "Item Name": "N/A",
                        "Device": "N/A",
                        "Brand": "N/A",
                        "Quantity": 0,
                        "Unit Cost": 0,
                        "Unit Price": 0,
                        "Item Total": 0
                    });
                } else {
                    order.items.forEach((item: any) => {
                        const unitCost = costMap[item.id] || 0;
                        const unitPrice = item.price || 0;
                        const qty = item.quantity || 1;

                        exportRows.push({
                            "Order Number": order.orderNumber,
                            "Date": new Date(order.date).toLocaleDateString(),
                            "Customer Name": order.customerName,
                            "Phone": order.phone,
                            "City": order.city,
                            "Address": order.address,
                            "Status": order.status,
                            "Total Amount": order.totalAmount,
                            "Shipping Fee": order.shippingFee,
                            "Item Name": item.name,
                            "Device": item.device || "N/A",
                            "Brand": item.brand || "N/A",
                            "Quantity": qty,
                            "Unit Cost": unitCost,
                            "Unit Price": unitPrice,
                            "Item Total": unitPrice * qty
                        });
                    });
                }
            });

            // 4. Generate Excel
            const worksheet = XLSX.utils.json_to_sheet(exportRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

            // Buffer
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

            saveAs(dataBlob, `orders_export_${new Date().toISOString().slice(0, 10)}.xlsx`);

            addToast(`Successfully exported ${selectedIds.length} orders`, 'success');

        } catch (error) {
            console.error("Export failed:", error);
            addToast("Failed to export orders", "error");
        }
    }, [isSupabaseConfigured, addToast]);


    return { orders, setOrders, placeOrder, updateOrderStatus, refreshOrders, bulkUpdateOrderStatus, searchOrdersByPhone, exportOrders, page, totalPages, totalRevenue, isOrdersLoading };
};
