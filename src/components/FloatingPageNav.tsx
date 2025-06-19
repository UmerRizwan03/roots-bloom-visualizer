import React from 'react';
import { Link } from 'react-router-dom';

const FloatingPageNav: React.FC = () => {
  return (
    <nav className="hidden md:flex md:space-x-4 fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-200/30 dark:bg-slate-900/30 backdrop-blur-md rounded-full px-6 py-3 shadow-xl ring-1 ring-slate-900/5">
      <Link to="/" className="text-emerald-600 dark:text-emerald-400 font-medium">Home</Link>
      <Link to="/members" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Members</Link>
      <Link to="/magazines" className="text-gray-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Magazines</Link>
    </nav>
  );
};

export default FloatingPageNav;
