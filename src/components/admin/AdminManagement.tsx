// src/components/admin/AdminManagement.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../api/services/adminService';
import { useAuth } from '../../contexts/AuthContext';
import Badge from '../common/Badge';
import AdminModal from '../modals/AdminModal';
import EditAdminModal from '../modals/EditAdminModal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import ResponsiveTable from '../common/ResponsiveTable';
import type { Admin } from '../../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Shield, Lock, Loader2, Key, UserCheck, Pencil, Ban, RotateCcw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info'; }

const AdminManagement = () => {
  const { t } = useTranslation('admins');
  const { t: tc } = useTranslation('common');
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
      showNotification('error', error.response?.status === 403 ? t('list.errors.forbidden') : t('list.errors.loadAdmins'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm(t('list.confirmDeactivate.title'), t('list.confirmDeactivate.message', { name }), async () => {
      try { await adminService.delete(id); showNotification('success', t('list.notifications.deactivated')); loadAdmins(); }
      catch { showNotification('error', t('list.errors.deactivateFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'danger');
  };

  const handleReactivate = (admin: Admin) => {
    showConfirm(t('list.confirmReactivate.title'), t('list.confirmReactivate.message', { name: admin.name }), async () => {
      try {
        await adminService.update(admin.adminID, { name: admin.name, email: admin.email, role: admin.role, projectAccess: admin.projectAccess, status: 'Aktiv', assignedProjectIDs: admin.assignedProjectIDs || [] });
        showNotification('success', t('list.notifications.reactivated'));
        loadAdmins();
      } catch { showNotification('error', t('list.errors.reactivateFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, 'info');
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">{t('list.loading')}</p>
    </div>
  );

  if (!isOwner) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
        <Lock className="w-8 h-8 text-text-muted" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">{t('list.accessDenied.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('list.accessDenied.message')}</p>
      </div>
    </div>
  );

  const inactiveCount = admins.filter(a => a.status === 'Inaktiv').length;

  const columns = [
    { header: t('list.columns.name'), accessor: 'name', render: (v: string) => <span className="font-semibold text-foreground">{v}</span> },
    { header: t('list.columns.email'), accessor: 'email', render: (v: string) => <span className="text-sm text-muted-foreground">{v}</span> },
    {
      header: t('list.columns.role'), accessor: 'role',
      render: (v: string) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${v === 'Owner' ? 'bg-warning-bg text-[#9A6510] border border-warning/25' : 'bg-info-bg text-[#2557B0] border border-info/25'}`}>
          {v === 'Owner' ? <Key className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}{v}
        </span>
      )
    },
    {
      header: t('list.columns.projectAccess'), accessor: 'projectAccess',
      render: (v: string, admin: Admin) => (
        <div>
          <Badge status={v} />
          {v === 'Zugewiesene Projekte' && admin.assignedProjectIDs && (
            <p className="text-xs text-muted-foreground mt-1">{t('list.projectCount', { count: admin.assignedProjectIDs.length })}</p>
          )}
        </div>
      )
    },
    { header: t('list.columns.status'), accessor: 'status', render: (v: string) => <Badge status={v} /> },
    {
      header: t('list.columns.actions'), accessor: 'adminID',
      render: (_: any, admin: Admin) => (
        <div className="flex gap-1.5">
          <Button size="icon-sm" onClick={() => { setSelectedAdmin(admin); setIsEditModalOpen(true); }} title={tc('actions.edit')} aria-label={tc('actions.edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          {admin.status === 'Aktiv' ? (
            <Button size="icon-sm" variant="destructive" onClick={() => handleDelete(admin.adminID, admin.name)} title={t('list.actionTitles.deactivate')} aria-label={t('list.actionTitles.deactivate')}>
              <Ban className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="icon-sm" variant="outline" onClick={() => handleReactivate(admin)} title={t('list.actionTitles.reactivate')} aria-label={t('list.actionTitles.reactivate')}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t('list.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />{t('list.newAdmin')}
        </Button>
      </div>

      {/* Info card */}
      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-primary mb-2">{t('list.roleOverview.heading')}</h4>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p><span className="font-medium text-[#9A6510]">{t('list.roleOverview.owner')}</span> {t('list.roleOverview.ownerDescription')}</p>
            <p><span className="font-medium text-[#2557B0]">{t('list.roleOverview.admin')}</span> {t('list.roleOverview.adminDescription')}</p>
          </div>
          <div className="flex gap-3 mt-3 text-xs font-medium flex-wrap">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">{t('list.stats.total', { count: admins.length })}</span>
            <span className="bg-success-bg text-[#15805A] px-2 py-1 rounded-md">{t('list.stats.active', { count: admins.filter(a => a.status === 'Aktiv').length })}</span>
            {inactiveCount > 0 && <span className="bg-error-bg text-[#A23531] px-2 py-1 rounded-md">{t('list.stats.inactive', { count: inactiveCount })}</span>}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
            <Label htmlFor="show-inactive" className="text-sm cursor-pointer">{t('list.showInactive')}</Label>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredAdmins.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Shield className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('list.emptyState')}</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredAdmins} keyField="adminID" />
          )}
        </CardContent>
      </Card>

      <AdminModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSaveSuccess={() => { loadAdmins(); setIsModalOpen(false); showNotification('success', t('list.notifications.created')); }} />
      <EditAdminModal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedAdmin(null); }} onSaveSuccess={() => { loadAdmins(); setIsEditModalOpen(false); setSelectedAdmin(null); showNotification('success', t('list.notifications.updated')); }} onDeleteSuccess={() => { loadAdmins(); setIsEditModalOpen(false); setSelectedAdmin(null); showNotification('success', t('list.notifications.deleted')); }} admin={selectedAdmin} />
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === 'danger' ? t('list.actionTitles.deactivate') : tc('actions.confirm')} />
    </div>
  );
};

export default AdminManagement;
