import { useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, DiscountCode } from '@/types';

export const useCartLogic = (addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void) => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);

    const addToCart = (product: Product, variant?: ProductVariant) => {
        setCart(prev => {
            const compositeId = (variant && variant.id) ? `${product.id}-${variant.id}` : product.id;
            const existing = prev.find(item => {
                const itemCompositeId = (item.selectedVariant && item.selectedVariant.id) ? `${item.id}-${item.selectedVariant.id}` : item.id;
                return itemCompositeId === compositeId;
            });

            if (existing) {
                return prev.map(item => {
                    const itemCompositeId = (item.selectedVariant && item.selectedVariant.id) ? `${item.id}-${item.selectedVariant.id}` : item.id;
                    return itemCompositeId === compositeId ? { ...item, quantity: item.quantity + 1 } : item;
                });
            }

            const displayImage = (variant && variant.image) ? variant.image : product.image;
            return [...prev, {
                ...product,
                image: displayImage,
                quantity: 1,
                selectedVariant: variant
            }];
        });
        setIsCartOpen(true);
        addToast(`${product.name} ${variant ? `(${variant.color})` : ''} added to cart`, 'success');
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
        const price = item.salePrice || item.price;
        return sum + (price * item.quantity);
    }, 0);

    let discountAmount = 0;
    if (appliedDiscount) {
        if (appliedDiscount.type === 'percentage') {
            discountAmount = totalAmount * (appliedDiscount.value / 100);
        } else {
            discountAmount = appliedDiscount.value;
        }
        if (discountAmount > totalAmount) discountAmount = totalAmount;
    }

    const finalTotal = Math.max(0, totalAmount - discountAmount);

    // Validate discount on total change
    useEffect(() => {
        if (appliedDiscount && appliedDiscount.minOrderAmount && totalAmount < appliedDiscount.minOrderAmount) {
            setAppliedDiscount(null);
            addToast('Discount removed: Minimum spend not met', 'warning');
        }
    }, [totalAmount, appliedDiscount, addToast]);

    const applyDiscount = (code: string, discounts: DiscountCode[], cart: CartItem[], userOrderCount: number = 0) => {
        const discount = discounts.find(d => d.code === code && d.isActive);

        if (!discount) {
            addToast('Invalid or inactive discount code', 'error');
            return;
        }

        // Check expiry date
        if (discount.expiryDate) {
            const expiryDate = new Date(discount.expiryDate);
            if (new Date() > expiryDate) {
                addToast('This discount code has expired', 'error');
                return;
            }
        }

        // Check usage limit
        if (discount.usageLimit && discount.usedCount && discount.usedCount >= discount.usageLimit) {
            addToast('This discount code has reached its usage limit', 'error');
            return;
        }

        // Check first-time user restriction
        if (discount.firstTimeOnly && userOrderCount > 0) {
            addToast('This discount is only for first-time customers', 'error');
            return;
        }

        // Check minimum order amount
        if (discount.minOrderAmount && totalAmount < discount.minOrderAmount) {
            addToast(`Minimum order amount of IQD ${discount.minOrderAmount.toLocaleString()} not met`, 'error');
            return;
        }

        // Check applicable products
        if (discount.applicableProducts && discount.applicableProducts.length > 0) {
            const hasApplicableProduct = cart.some(item =>
                discount.applicableProducts?.includes(item.id)
            );
            if (!hasApplicableProduct) {
                addToast('This discount does not apply to items in your cart', 'error');
                return;
            }
        }

        // Check applicable categories
        if (discount.applicableCategories && discount.applicableCategories.length > 0) {
            const hasApplicableCategory = cart.some(item =>
                discount.applicableCategories?.includes(item.category)
            );
            if (!hasApplicableCategory) {
                addToast('This discount does not apply to items in your cart', 'error');
                return;
            }
        }

        setAppliedDiscount(discount);
        addToast('Discount applied successfully!', 'success');
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
