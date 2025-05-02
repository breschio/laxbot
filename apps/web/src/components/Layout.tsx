import React from 'react';
import { Header } from '@/components/Header';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isComponentsPage = location.pathname === '/components';
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className={`flex-1 ${isComponentsPage ? 'w-full p-0' : 'container mx-auto px-4 py-8'}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 