// src/components/admin/CustomerManagement.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { customerService } from '../../api/services/customerService';
import CustomerModal from '../modals/CustomerModal';
import Notification from '../common/Notification';
import ConfirmDialog from '../common/ConfirmDialog';
import ResponsiveTable from '../common/ResponsiveTable';
import type { Customer } from '../../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Trash2, Search, Users, Loader2 } from 'lucide-react';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info'; }

const CustomerManagement = () => {
  const { t } = useTranslation('customers');
  const { t: tc } = useTranslation('common');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });
  const [confirm, setConfirm] = useState<ConfirmState>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'warning' });

  useEffect(() => { loadCustomers(); }, []);
  useEffect(() => { filterCustomers(); }, [searchTerm, customers]);

  const showNotification = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState['type'] = 'warning') => setConfirm({ show: true, title, message, onConfirm, type });

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerService.getAll();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch {
      showNotification('error', t('list.errors.load'));
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) { setFilteredCustomers(customers); return; }
    const q = searchTerm.toLowerCase();
    setFilteredCustomers(customers.filter(c =>
      c.companyName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    ));
  };

  const handleDelete = (id: number, name: string) => {
    showConfirm(t('list.confirmDelete.title'), t('list.confirmDelete.message', { name }), async () => {
      try {
        await customerService.delete(id);
        showNotification('success', t('list.notifications.deleted'));
        loadCustomers();
      } catch {
        showNotification('error', t('list.errors.delete'));
      }
      setConfirm(c => ({ ...c, show: false }));
    }, 'danger');
  };

  const handleSaveSuccess = () => {
    loadCustomers();
    setIsModalOpen(false);
    setSelectedCustomer(null);
    showNotification('success', selectedCustomer ? t('list.notifications.updated') : t('list.notifications.created'));
  };

  const columns = [
    { header: t('list.table.companyName'), accessor: 'companyName', render: (v: string) => <span className="font-semibold text-foreground">{v}</span> },
    { header: t('list.table.contactPerson'), accessor: 'contactPerson' },
    { header: t('list.table.email'), accessor: 'email', render: (v: string) => <span className="text-muted-foreground text-sm">{v}</span> },
    { header: t('list.table.projects'), accessor: 'projectCount', render: (v: number) => <span className="font-medium">{v || 0}</span> },
    {
      header: t('list.table.actions'), accessor: 'customerID',
      render: (_: any, customer: Customer) => (
        <div className="flex gap-1.5">
          <Button size="icon-sm" onClick={() => { setSelectedCustomer(customer); setIsModalOpen(true); }} title={tc('actions.edit')} aria-label={tc('actions.edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="destructive" onClick={() => handleDelete(customer.customerID, customer.companyName)} title={tc('actions.delete')} aria-label={tc('actions.delete')}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">{t('list.loading')}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t('list.header.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('list.header.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />{t('list.header.newCustomer')}
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder={t('list.search.placeholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Users className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('list.empty')}</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredCustomers} keyField="customerID" />
          )}
        </CardContent>
      </Card>

      <CustomerModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedCustomer(null); }} customer={selectedCustomer} onSaveSuccess={handleSaveSuccess} />
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === 'danger' ? tc('actions.delete') : tc('actions.confirm')} />
    </div>
  );
};

export default CustomerManagement;
