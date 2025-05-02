import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

// Recreating the Header from Components.tsx to serve as single source of truth
export const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50 dark:bg-gray-950">
      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Laxbot</div>
      <nav className="flex items-center space-x-4">
        <NavLink href="/" isActive={location.pathname === '/'}>Home</NavLink>
        <NavLink href="/schedule" isActive={location.pathname === '/schedule'}>Schedule</NavLink>
        <NavLink href="/rankings" isActive={location.pathname === '/rankings'}>Rankings</NavLink>
        <NavLink href="/components" isActive={location.pathname === '/components'}>Components</NavLink>
        <ThemeToggle aria-label="Toggle theme" />
      </nav>
    </header>
  );
};

// Extracted NavLink component from Components.tsx
const NavLink = ({ href, children, isActive = false }: { href: string, children: React.ReactNode, isActive?: boolean }) => (
  <Link 
    to={href} 
    className={`text-sm font-medium ${isActive 
      ? 'text-gray-900 dark:text-gray-100' 
      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
    } px-3 py-2 rounded-md`} 
    aria-label={String(children)}
  >
    {children}
  </Link>
); 