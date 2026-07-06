// src/components/layout/Header.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, LogIn, ChevronDown, LayoutDashboard, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import lockupLight from '@/assets/brand/gentle-track-lockup-light.svg';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentView = location.pathname.startsWith('/kundenansicht') ? 'customer' : 'admin';

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
    navigate(view === 'admin' ? '/admin/dashboard' : '/kundenansicht');
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/kundenansicht');
  };

  // Initialen aus dem Namen generieren
  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className="bg-card/95 backdrop-blur-sm border-b border-border px-5 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
      {/* Logo */}
      <button
        onClick={() => navigate(isAuthenticated ? '/admin/dashboard' : '/kundenansicht')}
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <img src={lockupLight} alt="Gentle Track" className="h-6 w-auto" />
      </button>

      {/* Navigation */}
      <div className="flex items-center gap-1.5">
        {isAuthenticated && (
          <button
            onClick={() => handleViewChange('admin')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
              currentView === 'admin'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </button>
        )}

        <button
          onClick={() => handleViewChange('customer')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
            currentView === 'customer'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          Kundenansicht
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-accent transition-all duration-200"
            >
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{getInitials(admin?.name)}</span>
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block max-w-[120px] truncate">
                {admin?.name}
              </span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200', showDropdown && 'rotate-180')} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-60 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3.5 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{getInitials(admin?.name)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{admin?.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{admin?.email}</div>
                    </div>
                  </div>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/8 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/login')}
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            Login
          </Button>
        )}
      </div>
    </header>
  );
};

export default Header;
