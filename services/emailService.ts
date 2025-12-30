import emailjs from '@emailjs/browser';
import { Order } from '../types';
import { EMAILJS_CONFIG } from '../constants';

export const sendOrderNotification = async (order: Order) => {
    if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
        console.warn('EmailJS keys not set. Skipping email notification.');
        return;
    }

    const templateParams = {
        order_id: order.orderNumber,
        customer_name: order.customerName,
        phone: order.phone,
        city: order.city,
        address: order.address,
        total_amount: order.totalAmount.toLocaleString(),
        items_summary: order.items.map(item => `${item.quantity}x ${item.name} (${item.selectedVariant?.color || 'Default'})`).join('\n'),
        to_email: EMAILJS_CONFIG.TARGET_EMAIL
    };

    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams,
            EMAILJS_CONFIG.PUBLIC_KEY
        );
        console.log('Email sent successfully!', response.status, response.text);
    } catch (err) {
        console.error('Failed to send email:', err);
    }
};
