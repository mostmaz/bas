import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { useShop } from '../context/ShopContext';

export const OrderSuccess: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useShop();
  const orderNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
      <div className="text-center max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="flex justify-center mb-6">
          <div className="h-24 w-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('orderConfirmed')}</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {t('thankYou')} <span className="font-mono font-medium text-slate-900 dark:text-white">#{orderNumber}</span> {t('received')}
        </p>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 mb-8 border border-slate-100 dark:border-slate-700 text-left rtl:text-right">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">{t('importantInfo')}</h3>
          <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-4">
            <li className="flex items-start gap-3">
              <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full text-purple-600 dark:text-purple-400 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white block mb-0.5">{t('estimatedDelivery')}</span>
                {t('reachYouIn')} <span className="font-bold text-purple-600 dark:text-purple-400">24 - 36 {t('hours')}</span>.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="p-1.5 bg-white dark:bg-slate-900 rounded-full text-purple-600 dark:text-purple-400 shadow-sm border border-slate-100 dark:border-slate-800 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <span className="font-medium text-slate-900 dark:text-white block mb-0.5">{t('uponDelivery')}</span>
                {t('checkOrder')} <span className="font-bold text-purple-600 dark:text-purple-400">{t('beforePaying')}</span>
              </div>
            </li>
          </ul>
        </div>

        <Button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2" size="lg">
          {t('continueShopping')} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
};