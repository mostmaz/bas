import React, { useState, useEffect } from 'react';

interface NotificationBarProps {
    message: string;
}

export const NotificationBar: React.FC<NotificationBarProps> = ({ message }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    // Split messages by '|' and trim whitespace
    const messages = message.split('|').map(msg => msg.trim()).filter(msg => msg.length > 0);

    useEffect(() => {
        if (messages.length <= 1) return;

        const interval = setInterval(() => {
            setIsVisible(false);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % messages.length);
                setIsVisible(true);
            }, 300); // Wait for fade out
        }, 3000); // Change every 3 seconds

        return () => clearInterval(interval);
    }, [messages.length]);

    if (messages.length === 0) return null;

    return (
        <div className="mt-4 px-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl py-1.5 px-3 text-center transition-all duration-300">
                <p
                    className={`text-xs font-medium text-indigo-800 dark:text-indigo-200 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    dir="rtl"
                >
                    {messages[currentIndex]}
                </p>
            </div>
        </div>
    );
};
