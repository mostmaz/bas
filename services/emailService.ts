import emailjs from '@emailjs/browser';
import { Order } from '../types';
import { EMAILJS_CONFIG, TWILIO_CONFIG } from '../constants';

export const sendOrderNotification = async (order: Order) => {
    if (EMAILJS_CONFIG.SERVICE_ID === 'YOUR_SERVICE_ID') {
        console.warn('EmailJS keys not set. Skipping email notification.');
        return;
    }

    // Support multiple emails separated by comma
    const recipients = EMAILJS_CONFIG.TARGET_EMAIL.split(',').map(e => e.trim());

    const sendToRecipient = async (recipientEmail: string) => {
        const templateParams = {
            order_id: order.orderNumber,
            customer_name: order.customerName,
            phone: order.phone,
            city: order.city,
            address: order.address,
            full_address: `${order.city}, ${order.address}`,
            total_amount: `IQD ${order.totalAmount.toLocaleString()}`,
            shipping_fee: `IQD ${order.shippingFee.toLocaleString()}`,
            discount_amount: `IQD ${(order.discountAmount || 0).toLocaleString()}`,
            items_summary: order.items.map(item =>
                `${item.quantity}x ${item.name}\n` +
                `   - Brand: ${item.brand}\n` +
                `   - Device: ${item.device}\n` +
                `   - Color: ${item.selectedVariant?.color || 'Default'}\n` +
                `   - Price: IQD ${((item.salePrice || item.price) * item.quantity).toLocaleString()}`
            ).join('\n\n'),
            to_email: recipientEmail,
            email: recipientEmail,
            recipient: recipientEmail,
            to_name: 'Store Owner',
            from_name: 'BasCavarat Store',
            reply_to: order.phone
        };

        try {
            const response = await emailjs.send(
                EMAILJS_CONFIG.SERVICE_ID,
                EMAILJS_CONFIG.TEMPLATE_ID,
                templateParams,
                EMAILJS_CONFIG.PUBLIC_KEY
            );
            console.log(`Email sent successfully to ${recipientEmail}!`, response.status, response.text);
        } catch (err) {
            console.error(`Failed to send email to ${recipientEmail}:`, err);
        }
    };

    // Send to all recipients in parallel
    await Promise.all(recipients.map(email => sendToRecipient(email)));
};

/**
 * Sends a WhatsApp notification using CallMeBot (Free API)
 * To use this, the user needs to:
 * 1. Add +34 644 20 47 56 on WhatsApp
 * 2. Send "I allow callmebot to send me messages"
 * 3. They will get an API Key
 */
export const sendWhatsAppNotification = async (order: Order) => {
    // This is a placeholder for the user's phone and API key
    // In a real app, these should be in constants.ts or env vars
    const PHONE = '9647502062804'; // User's phone number with country code
    const API_KEY = 'YOUR_CALLMEBOT_API_KEY';

    if (API_KEY === 'YOUR_CALLMEBOT_API_KEY') {
        console.warn('WhatsApp API Key not set. Skipping WhatsApp notification.');
        return;
    }

    const message = `*New Order Received!* 🛍️\n\n` +
        `*Order:* #${order.orderNumber}\n` +
        `*Customer:* ${order.customerName}\n` +
        `*Phone:* ${order.phone}\n` +
        `*Total:* IQD ${order.totalAmount.toLocaleString()}\n\n` +
        `*Items:*\n${order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${PHONE}&text=${encodeURIComponent(message)}&apikey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log('WhatsApp notification sent successfully!');
        } else {
            console.error('Failed to send WhatsApp notification:', response.statusText);
        }
    } catch (err) {
        console.error('Error sending WhatsApp notification:', err);
    }
};

/**
 * Sends a WhatsApp notification using Twilio API
 * NOTE: This is a client-side implementation. In production, 
 * you should use a server-side function to keep your Auth Token secure.
 */
export const sendTwilioWhatsAppNotification = async (order: Order, type: 'admin' | 'customer') => {
    const { ACCOUNT_SID, AUTH_TOKEN, FROM_NUMBER, ADMIN_NUMBER } = TWILIO_CONFIG;

    if (ACCOUNT_SID === 'YOUR_TWILIO_ACCOUNT_SID') {
        console.warn('Twilio keys not set. Skipping Twilio notification.');
        return;
    }

    const recipientNumber = type === 'admin' ? ADMIN_NUMBER : order.phone;

    // Clean the number: remove spaces, dashes, etc. Keep + if present.
    const cleanNumber = recipientNumber.replace(/[^\d+]/g, '');

    // Ensure number has + prefix for Twilio
    const formattedRecipient = cleanNumber.startsWith('+') ? cleanNumber : `+${cleanNumber}`;

    let message = '';

    if (type === 'admin') {
        message = `*New Order Received!* 🛍️\n\n` +
            `*Order:* #${order.orderNumber}\n` +
            `*Customer:* ${order.customerName}\n` +
            `*Phone:* ${order.phone}\n` +
            `*Total:* IQD ${order.totalAmount.toLocaleString()}\n\n` +
            `*Items:*\n${order.items.map(item => `- ${item.quantity}x ${item.name}`).join('\n')}`;
    } else {
        message = `*Thank you for your order!* 🛍️\n\n` +
            `Hello ${order.customerName},\n` +
            `We have received your order *#${order.orderNumber}*.\n\n` +
            `*Total Amount:* IQD ${order.totalAmount.toLocaleString()}\n` +
            `*Delivery Address:* ${order.city}, ${order.address}\n\n` +
            `We will contact you soon to confirm delivery. Thank you for shopping with BasCavarat!`;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`;

    const formData = new URLSearchParams();
    formData.append('From', FROM_NUMBER);
    formData.append('To', `whatsapp:${formattedRecipient}`);
    formData.append('Body', message);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${ACCOUNT_SID}:${AUTH_TOKEN}`),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            console.log(`Twilio WhatsApp notification sent to ${type} (${formattedRecipient}) successfully!`);
        } else {
            const errorData = await response.json();
            console.error(`Failed to send Twilio WhatsApp notification to ${type}:`, {
                status: response.status,
                statusText: response.statusText,
                code: errorData.code,
                message: errorData.message,
                moreInfo: errorData.more_info
            });
        }
    } catch (err) {
        console.error(`Error sending Twilio WhatsApp notification to ${type}:`, err);
    }
};
