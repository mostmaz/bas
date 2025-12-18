import { useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, DiscountCode } from '../types';

export const useCartLogic = (addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void, products: Product[]) => {
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
                newCart.push({
                    ...product,
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

    const applyDiscount = (code: string, discounts: DiscountCode[]) => {
        const discount = discounts.find(d => d.code === code && d.isActive);
        if (discount) {
            if (discount.minOrderAmount && totalAmount < discount.minOrderAmount) {
                addToast(`Minimum order amount of ${discount.minOrderAmount} not met`, 'error');
                return;
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
