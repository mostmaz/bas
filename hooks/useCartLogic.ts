import { useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, DiscountCode } from '../types';

export const useCartLogic = (addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, products: Product[], availableDiscounts: DiscountCode[] = []) => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load cart", e);
            return [];
        }
    });
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);

    // Persist cart
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, variant?: ProductVariant) => {
        setCart(prev => {
            let newCart = [...prev];

            // 1. Add Main Product
            const compositeId = (variant && variant.id) ? `${product.id}-${variant.id}` : product.id;
            const existingIndex = newCart.findIndex(item => {
                const itemCompositeId = (item.selectedVariant && item.selectedVariant.id) ? `${item.id}-${item.selectedVariant.id}` : item.id;
                return itemCompositeId === compositeId;
            });

            if (existingIndex >= 0) {
                newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
            } else {
                const displayImage = (variant && variant.image) ? variant.image : product.image;
                // Optimization: Sanitize product to remove large fields like description and extra images
                // This prevents localStorage bloat and improves JSON.parse performance
                const { description, images, ...productData } = product;

                newCart.push({
                    ...productData,
                    images: [], // Satisfy type requirement but keep payload small
                    image: displayImage,
                    quantity: 1,
                    selectedVariant: variant
                });
            }

            // 2. Add Gift Product
            if (product.giftProductId) {
                const giftProduct = products.find(p => p.id === product.giftProductId);
                if (giftProduct) {
                    // Check if gift is already in cart as a gift
                    const existingGiftIndex = newCart.findIndex(item => item.id === giftProduct.id && item.isGift);
                    if (existingGiftIndex === -1) {
                        newCart.push({
                            ...giftProduct,
                            quantity: 1,
                            isGift: true,
                            price: 0,
                            salePrice: 0
                        });
                    }
                }
            }

            return newCart;
        });

        setIsCartOpen(true);
        addToast(`${product.name} ${variant ? `(${variant.color})` : ''} added to cart`, 'success');

        if (product.giftProductId) {
            const giftProduct = products.find(p => p.id === product.giftProductId);
            if (giftProduct) {
                addToast(`Free gift added: ${giftProduct.name}`, 'success');
            }
        }

        // Facebook Pixel: AddToCart
        import('../utils/pixel').then(({ event }) => {
            event('AddToCart', {
                content_name: product.name,
                content_ids: [product.id],
                content_type: 'product',
                value: product.salePrice || product.price,
                currency: 'IQD'
            });
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const updateCartQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const clearCart = () => {
        setCart([]);
        setAppliedDiscount(null);
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    // Calculations
    const totalAmount = cart.reduce((sum, item) => {
        if (item.isGift) return sum;
        const price = item.salePrice || item.price;
        return sum + (price * item.quantity);
    }, 0);

    // Helper to calculate discount amount for a specific discount code
    const calculateDiscountValue = (discount: DiscountCode, currentCart: CartItem[], currentTotal: number) => {
        let eligibleAmount = 0;

        eligibleAmount = currentCart.reduce((sum, item) => {
            // 1. Check Target Products
            if (discount.targetProductIds && discount.targetProductIds.length > 0) {
                if (!discount.targetProductIds.includes(item.id)) return sum;
            }

            // 2. Check Sale Exclusion
            const isOnSale = (item.salePrice !== undefined && item.salePrice < item.price);
            if (discount.excludeSaleItems && isOnSale) return sum;

            const price = item.salePrice || item.price;
            return sum + (price * item.quantity);
        }, 0);

        let savings = 0;
        if (discount.type === 'percentage') {
            savings = eligibleAmount * (discount.value / 100);
        } else {
            savings = discount.value;
        }

        return Math.min(savings, currentTotal);
    };

    const calculateBestDiscount = (currentCart: CartItem[], currentTotal: number, discounts: DiscountCode[]): DiscountCode | null => {
        const automaticDiscounts = discounts.filter(d => d.isActive && d.isAutomatic);
        let bestDiscount: DiscountCode | null = null;
        let maxSavings = 0;

        for (const discount of automaticDiscounts) {
            // Check conditions
            if (discount.minOrderAmount && currentTotal < discount.minOrderAmount) continue;

            const totalQuantity = currentCart.reduce((sum, item) => sum + item.quantity, 0);
            if (discount.minQuantity && totalQuantity < discount.minQuantity) continue;

            if (discount.targetProductIds && discount.targetProductIds.length > 0) {
                const hasTargetProduct = currentCart.some(item => discount.targetProductIds!.includes(item.id));
                if (!hasTargetProduct) continue;
            }

            const savings = calculateDiscountValue(discount, currentCart, currentTotal);

            if (savings > maxSavings) {
                maxSavings = savings;
                bestDiscount = discount;
            }
        }

        return bestDiscount;
    };

    // Validate discount on total change or cart change, and check for automatic discounts
    useEffect(() => {
        // 1. If a manual discount is applied, validate it
        if (appliedDiscount && !appliedDiscount.isAutomatic) {
            let isValid = true;
            let reason = '';

            // Check Min Order Amount
            if (appliedDiscount.minOrderAmount && totalAmount < appliedDiscount.minOrderAmount) {
                isValid = false;
                reason = `Minimum spend of ${appliedDiscount.minOrderAmount} not met`;
            }

            // Check Min Quantity
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (isValid && appliedDiscount.minQuantity && totalQuantity < appliedDiscount.minQuantity) {
                isValid = false;
                reason = `Minimum quantity of ${appliedDiscount.minQuantity} items not met`;
            }

            // Check Target Products (if they were removed)
            if (isValid && appliedDiscount.targetProductIds && appliedDiscount.targetProductIds.length > 0) {
                const hasTargetProduct = cart.some(item => appliedDiscount.targetProductIds!.includes(item.id));
                if (!hasTargetProduct) {
                    isValid = false;
                    reason = 'Required products for this discount are no longer in cart';
                }
            }

            if (!isValid) {
                setAppliedDiscount(null);
                addToast(`Discount removed: ${reason}`, 'warning');
            }
        } else {
            // 2. If no manual discount (or current is automatic), try to find the best automatic discount
            const bestDiscount = calculateBestDiscount(cart, totalAmount, availableDiscounts);

            if (bestDiscount) {
                // If we found a best discount, and it's different from current, apply it
                if (!appliedDiscount || appliedDiscount.id !== bestDiscount.id) {
                    setAppliedDiscount(bestDiscount);
                    // Only toast if it's a new application to avoid spam
                    if (!appliedDiscount || appliedDiscount.id !== bestDiscount.id) {
                        // Optional: Toast
                    }
                }
            } else {
                // If no automatic discount applies, and we had an automatic one, remove it
                if (appliedDiscount && appliedDiscount.isAutomatic) {
                    setAppliedDiscount(null);
                }
            }
        }
    }, [totalAmount, cart, appliedDiscount, addToast, availableDiscounts]);

    // Calculate final discount amount for render
    let discountAmount = 0;
    if (appliedDiscount) {
        discountAmount = calculateDiscountValue(appliedDiscount, cart, totalAmount);
    }

    const finalTotal = Math.max(0, totalAmount - discountAmount);

    const applyDiscount = (code: string, discounts: DiscountCode[]) => {
        const discount = discounts.find(d => d.code === code && d.isActive);
        if (discount) {
            if (discount.minOrderAmount && totalAmount < discount.minOrderAmount) {
                addToast(`Minimum order amount of ${discount.minOrderAmount} not met`, 'error');
                return;
            }

            // Check Min Quantity
            const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
            if (discount.minQuantity && totalQuantity < discount.minQuantity) {
                addToast(`Minimum quantity of ${discount.minQuantity} items not met`, 'error');
                return;
            }

            // Check Target Products
            if (discount.targetProductIds && discount.targetProductIds.length > 0) {
                const hasTargetProduct = cart.some(item => discount.targetProductIds!.includes(item.id));
                if (!hasTargetProduct) {
                    addToast('This discount applies to specific products only', 'error');
                    return;
                }
            }
            setAppliedDiscount(discount);
            addToast('Discount applied', 'success');
        } else {
            addToast('Invalid or inactive discount code', 'error');
        }
    };

    const removeDiscount = () => {
        setAppliedDiscount(null);
        addToast('Discount removed', 'info');
    };

    return {
        cart, isCartOpen, appliedDiscount,
        addToCart, removeFromCart, updateCartQuantity, clearCart, toggleCart,
        applyDiscount, removeDiscount,
        totalAmount, discountAmount, finalTotal
    };
};
