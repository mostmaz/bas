
import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ShopProvider, useShop } from './context/ShopContext';
// ... imports ...

// ... AppContent component ...

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <ToastProvider>
        <ShopProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ShopProvider>
      </ToastProvider>
    </HelmetProvider>
  );
};

export default App;
