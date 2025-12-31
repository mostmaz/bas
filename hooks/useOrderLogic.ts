import { useState } from 'react';
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
    items: typeof data.items === 'string' ? JSON.parse(data.items) : (data.items || []),
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

    const placeOrder = async (orderData: Omit<Order, 'id' | 'date' | 'status'>) => {
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
            const dbPayload = {
                ...newOrder,
                items: newOrder.items
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
    };

    const updateOrderStatus = async (id: string, status: Order['status']) => {
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
    };

    const refreshOrders = async () => {
        if (!isSupabaseConfigured) return;

        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching orders:', error);
            // addToast('Failed to fetch orders', 'error'); // Optional: might be too noisy on init
            return;
        }

        if (data) {
            setOrders(data.map(mapOrderFromDB));
        }
    };

    const bulkUpdateOrderStatus = async (ids: string[], status: Order['status']) => {
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
    };

    const searchOrdersByPhone = async (phone: string): Promise<Order[]> => {
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
    };

    return { orders, setOrders, placeOrder, updateOrderStatus, refreshOrders, bulkUpdateOrderStatus, searchOrdersByPhone };
};
