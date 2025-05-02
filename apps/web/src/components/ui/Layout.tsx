import React from 'react';
import { Header } from '@components/Header';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      {/* Optional Footer Here */}
      {/* <footer className="bg-gray-100 dark:bg-gray-800 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          Laxbot © {new Date().getFullYear()}
        </div>
      </footer> */}
    </div>
  );
};

export default Layout; 