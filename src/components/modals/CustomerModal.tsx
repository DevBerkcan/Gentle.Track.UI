// src/components/modals/CustomerModal.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { customerService } from '../../api/services/customerService';
import Modal from '../common/Modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Save, Plus, X, Loader2 } from 'lucide-react';
import type { Customer, CreateCustomerDto } from '../../types';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSaveSuccess: () => void;
}

const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose, customer, onSaveSuccess }) => {
  const { t } = useTranslation('customers');
  const { t: tc } = useTranslation('common');
  const [formData, setFormData] = useState<CreateCustomerDto>({
    companyName: '', contactPerson: '', email: '', phone: '', address: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone || '',
        address: customer.address || '',
      });
    } else {
      setFormData({ companyName: '', contactPerson: '', email: '', phone: '', address: '' });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      if (customer) {
        await customerService.update(customer.customerID, formData);
      } else {
        await customerService.create(formData);
      }
      onSaveSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || t('modal.errors.save'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={customer ? t('modal.title.edit') : t('modal.title.create')}>
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t('modal.labels.companyName')}</Label>
          <Input required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('modal.labels.contactPerson')}</Label>
          <Input required value={formData.contactPerson} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('modal.labels.email')}</Label>
          <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('modal.labels.phone')}</Label>
          <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t('modal.labels.address')}</Label>
          <Textarea rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : customer ? <Save className="w-4 h-4 mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
            {loading ? t('modal.buttons.saving') : (customer ? t('modal.buttons.update') : t('modal.buttons.create'))}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-1.5" />{tc('actions.cancel')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CustomerModal;
