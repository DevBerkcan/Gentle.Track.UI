// src/components/layout/Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FolderOpen, Settings, MessageSquare, Shield } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine current section based on URL path
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path.includes('/customers')) return 'customers';
    if (path.includes('/projects')) return 'projects';
    if (path.includes('/phases')) return 'phases';
    if (path.includes('/admins')) return 'admins';
    if (path.includes('/comments')) return 'comments';
    return 'dashboard';
  };

  const currentSection = getCurrentSection();

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'customers', icon: Users, label: 'Kunden' },
    { id: 'projects', icon: FolderOpen, label: 'Projekte' },
    { id: 'phases', icon: Settings, label: 'Projekt-Phasen' },
    { id: 'comments', icon: MessageSquare, label: 'Kommentare' },
    { id: 'admins', icon: Shield, label: 'Admin-Verwaltung' },
  ];

  const handleNavigation = (sectionId: string) => {
    navigate(`/admin/${sectionId}`);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-slate-50/80 border-r border-slate-200 p-4 shrink-0">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <a
                key={item.id}
                href="#"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.id);
                }}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Horizontal Nav */}
      <div className="md:hidden w-full border-b border-slate-200 bg-slate-50/80 px-3 py-2 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <a
                key={item.id}
                href="#"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(item.id);
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
