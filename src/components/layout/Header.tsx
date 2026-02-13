// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { User, LogOut, LogIn, ChevronDown } from 'lucide-react';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determine current view based on URL
  const currentView = location.pathname.startsWith('/kundenansicht') ? 'customer' : 'admin';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewChange = (view: 'admin' | 'customer') => {
    if (view === 'admin') {
      navigate('/admin/dashboard');
    } else {
      navigate('/kundenansicht');
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/kundenansicht');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-sm">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-500 to-cyan-400 bg-clip-text text-transparent cursor-default">
        Gentle Track
      </h1>
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Show admin view button only if authenticated */}
        {isAuthenticated && (
          <Button
            variant={currentView === 'admin' ? 'default' : 'ghost'}
            size="sm"
            className={currentView === 'admin' ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
            onClick={() => handleViewChange('admin')}
          >
            Admin-Bereich
          </Button>
        )}

        <Button
          variant={currentView === 'customer' ? 'default' : 'ghost'}
          size="sm"
          className={currentView === 'customer' ? 'bg-sky-500 hover:bg-sky-600 text-white' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}
          onClick={() => handleViewChange('customer')}
        >
          Kundenansicht
        </Button>

        {/* Show profile dropdown if authenticated, otherwise show login */}
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">{admin?.name}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{admin?.name}</div>
                      <div className="text-xs text-slate-500">{admin?.email}</div>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Abmelden
                </button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            onClick={handleLogin}
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            Login
          </Button>
        )}
      </div>
    </div>
  );
};

export default Header;
