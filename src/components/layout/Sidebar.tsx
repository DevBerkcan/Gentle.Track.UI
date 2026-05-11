// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderOpen, Settings, MessageSquare, Shield, Menu, X, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'customers', icon: Users, label: 'Kunden' },
  { id: 'projects', icon: FolderOpen, label: 'Projekte' },
  { id: 'phases', icon: Settings, label: 'Projekt-Phasen' },
  { id: 'comments', icon: MessageSquare, label: 'Kommentare' },
  { id: 'admins', icon: Shield, label: 'Admin-Verwaltung' },
];

function useCurrentSection() {
  const location = useLocation();
  const path = location.pathname;
  if (path.includes('/customers')) return 'customers';
  if (path.includes('/projects')) return 'projects';
  if (path.includes('/phases')) return 'phases';
  if (path.includes('/admins')) return 'admins';
  if (path.includes('/comments')) return 'comments';
  return 'dashboard';
}

interface NavItemProps {
  item: typeof menuItems[0];
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{item.label}</span>
    </button>
  );
};

const SidebarLogo: React.FC = () => (
  <div className="flex items-center gap-2.5 px-3 py-2 mb-6">
    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
      <Activity className="w-4 h-4 text-primary-foreground" />
    </div>
    <span className="text-sidebar-foreground font-bold text-base tracking-tight">Gentle Track</span>
  </div>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const currentSection = useCurrentSection();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigation = (sectionId: string) => {
    navigate(`/admin/${sectionId}`);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar shrink-0 border-r border-sidebar-border">
        <div className="p-4 pt-5 flex-1">
          <SidebarLogo />
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2">
            Navigation
          </div>
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={currentSection === item.id}
                onClick={() => handleNavigation(item.id)}
              />
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile: Hamburger Button */}
      <div className="md:hidden flex items-center border-b border-border bg-white px-4 py-2.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label="Menü öffnen"
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground">Gentle Track</span>
        </div>
      </div>

      {/* Mobile: Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-6">
              <SidebarLogo />
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
            </div>
            <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2">
              Navigation
            </div>
            <nav className="space-y-0.5">
              {menuItems.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentSection === item.id}
                  onClick={() => handleNavigation(item.id)}
                />
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Sidebar;
