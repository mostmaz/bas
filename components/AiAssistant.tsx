

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { chatWithShopAssistant } from '../services/geminiService';
import { ChatMessage } from '../types';
import { useNavigate } from 'react-router-dom';
import { renderMarkdown } from '../utils/markdownUtils';
import { slugify } from '../utils/slugUtils';

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { products, t, language, placeOrder, clearCart } = useShop();
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const aiNames = ["Layla", "Noor", "Sara", "Maya", "Amira"];
  const [aiName] = useState(() => aiNames[Math.floor(Math.random() * aiNames.length)]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'init', role: 'model', text: `Hi! I'm ${aiName}, your AI style assistant. Looking for a specific vibe?`, timestamp: Date.now() }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Update initial greeting when language changes
  useEffect(() => {
    setMessages(prev => prev.map(msg =>
      msg.id === 'init' ? { ...msg, text: t('aiIntro').replace('{name}', aiName) } : msg
    ));
  }, [language, t, aiName]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const langContext = language === 'ar' ? " Please reply in Arabic." : "";

      const selectedProductDetails = Array.from(selectedProducts).map(id => {
        const p = products.find(prod => prod.id === id);
        return p ? `${p.name} (${p.price} IQD)` : '';
      }).filter(Boolean).join(', ');

      const contextInput = selectedProductDetails
        ? `[User Selected Products: ${selectedProductDetails}] ${input}`
        : input;

      const responseText = await chatWithShopAssistant(contextInput + langContext, products, aiName);

      if (responseText.startsWith('ORDER_CONFIRMED:')) {
        try {
          const jsonStr = responseText.replace('ORDER_CONFIRMED:', '').trim();
          const orderDetails = JSON.parse(jsonStr);

          if (selectedProducts.size > 0) {
            const orderItems = Array.from(selectedProducts).map(id => {
              const p = products.find(prod => prod.id === id);
              return p ? {
                id: p.id,
                name: p.name,
                price: p.price,
                quantity: 1,
                image: p.image,
                selectedColor: p.colors?.[0]
              } : null;
            }).filter(Boolean);

            if (orderItems.length > 0) {
              await placeOrder({
                items: orderItems as any,
                customerName: orderDetails.name,
                phone: orderDetails.mobile,
                city: orderDetails.city,
                address: orderDetails.address,
                totalAmount: orderDetails.total,
                shippingFee: 5000,
                orderNumber: `ORD-${Date.now()}`
              });

              setSelectedProducts(new Set());
              clearCart();

              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: `✅ Order placed successfully! Thank you, ${orderDetails.name}. We will contact you at ${orderDetails.mobile}.`,
                timestamp: Date.now()
              }]);
              setIsTyping(false);
              return;
            }
          } else {
            setMessages(prev => [...prev, {
              id: (Date.now() + 1).toString(),
              role: 'model',
              text: "I tried to place the order, but you haven't selected any products! Please check the boxes on the products you want.",
              timestamp: Date.now()
            }]);
            setIsTyping(false);
            return;
          }
        } catch (e) {
          console.error("Order parsing failed", e);
        }
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const renderMessageContent = (text: string, role: 'user' | 'model') => {
    return renderMarkdown(text, {
      role,
      onLinkClick: (url) => navigate(url),
      renderProductCard: (productId, label) => {
        const product = products.find(p => p.id === productId);
        if (!product) return null;

        const isSelected = selectedProducts.has(product.id);
        return (
          <div
            key={productId}
            className={`block my-3 bg-white dark:bg-slate-900 border ${isSelected ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl overflow-hidden shadow-sm transition-all group max-w-[240px] relative`}
          >
            <div className="absolute top-2 right-2 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleProductSelection(product.id)}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
            <div className="flex p-2 gap-3 items-center text-left cursor-pointer" onClick={() => navigate(`/product/${product.id}/${slugify(product.device)}/${slugify(product.name)}`)}>
              <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{product.brand}</p>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate leading-tight mb-0.5 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{product.name}</h4>
                <p className="text-xs font-bold text-purple-600 dark:text-purple-400">IQD {product.price.toLocaleString()}</p>
              </div>
            </div>
          </div>
        );
      }
    });
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-6 rtl:right-auto rtl:left-6 z-40 flex flex-col items-end rtl:items-start">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/20 dark:shadow-black/50 border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-5 flex justify-between items-center">
            <div className="flex items-center text-white">
              <div className="bg-white/20 p-2 rounded-full mr-3 rtl:ml-3 rtl:mr-0 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{aiName} (AI Assistant)</h3>
                <p className="text-xs text-purple-100 opacity-80">{t('alwaysHelp')}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1 rounded-full transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm rtl:rounded-bl-sm rtl:rounded-br-2xl'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm rtl:rounded-br-sm rtl:rounded-bl-2xl shadow-sm'
                    }`}
                >
                  {renderMessageContent(msg.text, msg.role)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-none rtl:rounded-bl-2xl rtl:rounded-br-none px-4 py-4 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-2 border border-transparent focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('askStyles')}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 px-3"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-2 bg-purple-600 rounded-full text-white hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors"
              >
                <Send className="h-4 w-4 ml-0.5 rtl:mr-0.5 rtl:ml-0 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-full shadow-lg shadow-pink-600/30 hover:shadow-pink-600/50 hover:scale-110 transition-all duration-300 focus:outline-none ring-4 ring-white/10"
        >
          <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          <span className="absolute top-0 right-0 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-white dark:border-slate-900"></span>
          </span>
        </button>
      )}
    </div>
  );
};
