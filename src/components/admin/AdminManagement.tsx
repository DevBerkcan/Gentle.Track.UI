// src/components/admin/AdminManagement.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/dateFormatter';
import AdminModal from '../modals/AdminModal';
import EditAdminModal from '../modals/EditAdminModal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import ResponsiveTable from '../common/ResponsiveTable';
import type { Admin } from '../../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Lock, Loader2, Key, UserCheck } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info'; }

const AdminManagement = () => {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<Admin[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });
  const [confirm, setConfirm] = useState<ConfirmState>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'warning' });

  const isOwner = currentAdmin?.role === 'Owner';

  useEffect(() => { loadAdmins(); }, []);
  useEffect(() => {
    setFilteredAdmins(showInactive ? admins : admins.filter(a => a.status === 'Aktiv'));
  }, [admins, showInactive]);

  const showNotification = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState['type'] = 'warning') => setConfirm({ show: true, title, message, onConfirm, type });

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAll();
      setAdmins(data);
    } catch (error: any) {
      showNotification('error', error.response?.status === 403 ? 'Keine Berechtigung. Nur Owners können Administratoren verwalten.' : 'Fehler beim Laden der Administratoren');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm('Administrator deaktivieren', `Möchten Sie den Administrator "${name}" wirklich deaktivieren?`, async () => {
      try { await adminService.delete(id); showNotification('success', 'Administrator deaktiviert!'); loadAdmins(); }
      catch { showNotification('error', 'Fehler beim Deaktivieren'); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'danger');
  };

  const handleReactivate = (admin: Admin) => {
    showConfirm('Administrator reaktivieren', `Möchten Sie "${admin.name}" wieder aktivieren?`, async () => {
      try {
        await adminService.update(admin.adminID, { name: admin.name, email: admin.email, role: admin.role, projectAccess: admin.projectAccess, status: 'Aktiv', assignedProjectIDs: admin.assignedProjectIDs || [] });
        showNotification('success', 'Administrator reaktiviert!');
        loadAdmins();
      } catch { showNotification('error', 'Fehler beim Reaktivieren'); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'info');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Administratoren werden geladen…</p>
    </div>
  );

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
        <Lock className="w-8 h-8 text-text-muted" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Zugriff verweigert</h2>
        <p className="text-sm text-muted-foreground">Nur Benutzer mit der Rolle "Owner" können Administratoren verwalten.</p>
      </div>
    </div>
  );

  const inactiveCount = admins.filter(a => a.status === 'Inaktiv').length;

  const columns = [
    { header: 'Name', accessor: 'name', render: (v: string) => <span className="font-semibold text-foreground">{v}</span> },
    { header: 'E-Mail', accessor: 'email', render: (v: string) => <span className="text-sm text-muted-foreground">{v}</span> },
    {
      header: 'Rolle', accessor: 'role',
      render: (v: string) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${v === 'Owner' ? 'bg-warning-bg text-[#9A6510] border border-warning/25' : 'bg-info-bg text-[#2557B0] border border-info/25'}`}>
          {v === 'Owner' ? <Key className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}{v}
        </span>
      )
    },
    {
      header: 'Projektzugriff', accessor: 'projectAccess',
      render: (v: string, admin: Admin) => (
        <div>
          <Badge status={v} />
          {v === 'Zugewiesene Projekte' && admin.assignedProjectIDs && (
            <p className="text-xs text-muted-foreground mt-1">{admin.assignedProjectIDs.length} Projekt{admin.assignedProjectIDs.length !== 1 ? 'e' : ''}</p>
          )}
        </div>
      )
    },
    { header: 'Status', accessor: 'status', render: (v: string) => <Badge status={v} /> },
    { header: 'Letzter Login', accessor: 'lastLogin', render: (v?: string) => <span className="text-sm text-muted-foreground">{v ? formatDate(v) : '—'}</span> },
    {
      header: 'Aktionen', accessor: 'adminID',
      render: (_: any, admin: Admin) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { setSelectedAdmin(admin); setIsEditModalOpen(true); }}>Bearbeiten</Button>
          {admin.status === 'Aktiv' ? (
            <Button size="sm" variant="destructive" onClick={() => handleDelete(admin.adminID, admin.name)}>Deaktivieren</Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleReactivate(admin)}>Reaktivieren</Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Admin-Verwaltung</h1>
          </div>
          <p className="text-sm text-muted-foreground">Administratoren und Rollen verwalten</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />Neuer Administrator
        </Button>
      </div>

      {/* Info card */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-primary mb-2">Rollen-Übersicht</h4>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p><span className="font-medium text-[#9A6510]">Owner:</span> Vollzugriff auf alle Funktionen, Projekte und Kunden</p>
            <p><span className="font-medium text-[#2557B0]">Admin:</span> Zugriff auf alle oder zugewiesene Projekte</p>
          </div>
          <div className="flex gap-3 mt-3 text-xs font-medium flex-wrap">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">Gesamt: {admins.length}</span>
            <span className="bg-success-bg text-[#15805A] px-2 py-1 rounded-md">Aktiv: {admins.filter(a => a.status === 'Aktiv').length}</span>
            {inactiveCount > 0 && <span className="bg-error-bg text-[#A23531] px-2 py-1 rounded-md">Inaktiv: {inactiveCount}</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="show-inactive" className="text-sm cursor-pointer">Inaktive Admins anzeigen</Label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Shield className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Keine Administratoren gefunden</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredAdmins} keyField="adminID" />
          )}
        </CardContent>
      </Card>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={() => { loadAdmins(); setIsModalOpen(false); showNotification('success', 'Administrator angelegt!'); }} />
      <EditAdminModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedAdmin(null); }} onSaveSuccess={() => { loadAdmins(); setIsEditModalOpen(false); setSelectedAdmin(null); showNotification('success', 'Administrator aktualisiert!'); }} onDeleteSuccess={() => { loadAdmins(); setIsEditModalOpen(false); setSelectedAdmin(null); showNotification('success', 'Administrator gelöscht!'); }} admin={selectedAdmin} />
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === 'danger' ? 'Deaktivieren' : 'Bestätigen'} />
    </div>
  );
};

export default AdminManagement;
