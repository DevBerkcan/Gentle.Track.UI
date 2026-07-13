// src/components/layout/Sidebar.tsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, FolderOpen, Settings, MessageSquare, Shield, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, labelKey: 'sidebar.dashboard' },
  { id: 'customers', icon: Users, labelKey: 'sidebar.customers' },
  { id: 'projects', icon: FolderOpen, labelKey: 'sidebar.projects' },
  { id: 'phases', icon: Settings, labelKey: 'sidebar.phases' },
  { id: 'comments', icon: MessageSquare, labelKey: 'sidebar.comments' },
  { id: 'admins', icon: Shield, labelKey: 'sidebar.admins' },
] as const;

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
  item: typeof menuItems[number];
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ item, isActive, onClick }) => {
  const { t } = useTranslation('layout');
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
      <span>{t(item.labelKey)}</span>
    </button>
  );
};

const Sidebar: React.FC = () => {
  const { t } = useTranslation('layout');
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
          <div className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-2 mt-1">
            {t('sidebar.navigation')}
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
      <div className="md:hidden flex items-center border-b border-border bg-card px-4 py-2.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={t('sidebar.openMenu')}
        >
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <span className="ml-2 text-sm font-semibold text-foreground">{t('sidebar.navigation')}</span>
      </div>

      {/* Mobile: Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-sidebar-border">
          <SheetHeader className="sr-only">
            <SheetTitle>{t('sidebar.navigation')}</SheetTitle>
          </SheetHeader>
          <div className="p-4 pt-5">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3">
                {t('sidebar.navigation')}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <X className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
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
