import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => (
  <header className="w-full bg-gray-900 text-white py-4 shadow">
    <div className="container mx-auto flex items-center justify-between px-4">
      <Link to="/" className="text-2xl font-bold tracking-tight">Laxbot</Link>
      <nav className="space-x-6 flex items-center">
        <Link to="/teams" className="hover:underline">Teams</Link>
        <Link to="/standings" className="hover:underline">Standings</Link>
        <Link to="/login" className="hover:underline">Login</Link>
        <ThemeToggle />
      </nav>
    </div>
  </header>
);

export default Header; 