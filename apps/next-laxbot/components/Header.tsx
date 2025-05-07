import React from 'react';
import Link from 'next/link'; // Use Next.js Link
import { useRouter } from 'next/router'; // Use Next.js Router
import { ThemeToggle } from '@/components/ThemeToggle'; // Import copied ThemeToggle

export const Header: React.FC = () => {
  const router = useRouter(); // Get router instance
  
  return (
    // Apply the same styling as the original header
    <header className="sticky top-0 z-50 flex items-center justify-between h-16 px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* // Use border-border, bg-background, text-foreground for theme consistency */}
      {/* <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b border-border bg-background">
       */}
      <div className="text-lg font-semibold text-foreground">
        Laxbot
      </div>
      <nav className="flex items-center space-x-1 sm:space-x-4">
        {/* Use the NavLink sub-component adapted for Next.js */}
        <NavLink href="/" isActive={router.pathname === '/'}>Home</NavLink>
        <NavLink href="/standings" isActive={router.pathname.startsWith('/standings')}>Rankings</NavLink> {/* Use startsWith if there are sub-routes */}
        {/* <NavLink href="/components" isActive={router.pathname === '/components'}>Components</NavLink> */}
        <ThemeToggle />
      </nav>
    </header>
  );
};

// Define the NavLink sub-component using next/link
const NavLink = ({ href, children, isActive = false }: { href: string, children: React.ReactNode, isActive?: boolean }) => (
  <Link 
    href={href} 
    className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${
      isActive 
      ? 'text-foreground' // Use theme-aware foreground color
      : 'text-muted-foreground hover:text-foreground' // Use muted and hover effects
    }`}
  >
    {children}
  </Link>
); 