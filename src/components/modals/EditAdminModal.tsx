// src/components/modals/EditAdminModal.tsx
import { useState, useEffect } from 'react';
import { adminService } from '../../api/services/adminService';
import { projectService } from '../../api/services/projectService';
import type { Admin, Project } from '../../types';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeleteSuccess?: () => void;
  admin: Admin | null;
}

const EditAdminModal: React.FC<EditAdminModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveSuccess,
  onDeleteSuccess,
  admin 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Admin' as 'Owner' | 'Admin',
    projectAccess: 'Alle Projekte',
    status: 'Aktiv' as 'Aktiv' | 'Inaktiv',
    assignedProjectIDs: [] as number[]
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && admin) {
      loadProjects();
      setFormData({
        name: admin.name,
        email: admin.email,
        role: admin.role as 'Owner' | 'Admin',
        projectAccess: admin.projectAccess,
        status: admin.status as 'Aktiv' | 'Inaktiv',
        assignedProjectIDs: admin.assignedProjectIDs || []
      });
      setShowDeleteConfirm(false);
    }
    setError('');
  }, [isOpen, admin]);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!admin) return;
    
    if (!formData.name || !formData.email) {
      setError('Bitte füllen Sie alle Pflichtfelder aus');
      return;
    }

    if (formData.role === 'Admin' && 
        formData.projectAccess === 'Zugewiesene Projekte' && 
        formData.assignedProjectIDs.length === 0) {
      setError('Bitte wählen Sie mindestens ein Projekt aus');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await adminService.update(admin.adminID, {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        projectAccess: formData.projectAccess,
        status: formData.status,
        assignedProjectIDs: formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte' 
          ? formData.assignedProjectIDs 
          : []
      });
      
      onSaveSuccess();
    } catch (err: any) {
      console.error('Error updating admin:', err);
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.title
        || err.message 
        || 'Fehler beim Aktualisieren des Administrators';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!admin) return;

    try {
      setLoading(true);
      setError('');
      await adminService.deletePermanently(admin.adminID);
      setShowDeleteConfirm(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (err: any) {
      console.error('Error deleting admin:', err);
      setError(err.response?.data?.message || 'Fehler beim Löschen des Administrators');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectToggle = (projectId: number) => {
    setFormData(prev => ({
      ...prev,
      assignedProjectIDs: prev.assignedProjectIDs.includes(projectId)
        ? prev.assignedProjectIDs.filter(id => id !== projectId)
        : [...prev.assignedProjectIDs, projectId]
    }));
  };

  const handleRoleChange = (role: 'Owner' | 'Admin') => {
    setFormData(prev => ({
      ...prev,
      role,
      projectAccess: role === 'Owner' ? 'Alle Projekte' : prev.projectAccess,
      assignedProjectIDs: role === 'Owner' ? [] : prev.assignedProjectIDs
    }));
  };

  const handleProjectAccessChange = (projectAccess: string) => {
    setFormData(prev => ({
      ...prev,
      projectAccess,
      assignedProjectIDs: projectAccess === 'Alle Projekte' ? [] : prev.assignedProjectIDs
    }));
  };

  if (!isOpen || !admin) return null;

  const showProjectSelection = formData.role === 'Admin' && formData.projectAccess === 'Zugewiesene Projekte';

  return (
    <div className="modal show">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Administrator bearbeiten</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {showDeleteConfirm ? (
          <div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
              <h3 style={{ marginBottom: '10px', color: '#dc2626' }}>
                Administrator unwiderruflich löschen?
              </h3>
              <p style={{ color: '#64748b', marginBottom: '20px' }}>
                Der Administrator "{admin.name}" ({admin.email}) wird permanent gelöscht. 
                Alle zugehörigen Daten werden entfernt. Diese Aktion kann nicht rückgängig gemacht werden!
              </p>
              
              {error && (
                <div className="error-message" style={{ marginBottom: '20px' }}>
                  {error}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="btn btn-danger" 
                onClick={handleDelete}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Löschen...' : '🗑️ Ja, endgültig löschen'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-message" style={{ marginBottom: '20px' }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>E-Mail *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Rolle *</label>
              <select
                value={formData.role}
                onChange={(e) => handleRoleChange(e.target.value as 'Owner' | 'Admin')}
                required
              >
                <option value="Admin">Admin</option>
                <option value="Owner">Owner</option>
              </select>
              <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                {formData.role === 'Owner' 
                  ? '🔑 Vollzugriff auf alle Funktionen und Projekte' 
                  : '👤 Eingeschränkter Zugriff basierend auf Projektzuweisung'}
              </small>
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Aktiv' | 'Inaktiv' })}
                required
              >
                <option value="Aktiv">Aktiv</option>
                <option value="Inaktiv">Inaktiv</option>
              </select>
            </div>

            {formData.role === 'Admin' && (
              <div className="form-group">
                <label>Projektzugriff *</label>
                <select
                  value={formData.projectAccess}
                  onChange={(e) => handleProjectAccessChange(e.target.value)}
                  required
                >
                  <option value="Alle Projekte">Alle Projekte</option>
                  <option value="Zugewiesene Projekte">Zugewiesene Projekte</option>
                </select>
                <small style={{ display: 'block', marginTop: '5px', color: '#64748b' }}>
                  {formData.projectAccess === 'Alle Projekte' 
                    ? '📂 Zugriff auf alle Projekte und Kunden' 
                    : '📁 Nur Zugriff auf ausgewählte Projekte'}
                </small>
              </div>
            )}

            {showProjectSelection && (
              <div className="form-group">
                <label>Projekte zuweisen * ({formData.assignedProjectIDs.length} ausgewählt)</label>
                <div style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px'
                }}>
                  {projects.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                      Keine Projekte verfügbar
                    </p>
                  ) : (
                    projects.map(project => (
                      <label
                        key={project.projectID}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '10px',
                          cursor: 'pointer',
                          borderRadius: '6px',
                          marginBottom: '5px',
                          background: formData.assignedProjectIDs.includes(project.projectID) 
                            ? '#f0f9ff' 
                            : 'transparent',
                          border: formData.assignedProjectIDs.includes(project.projectID)
                            ? '2px solid #0ea5e9'
                            : '2px solid transparent',
                          transition: 'all 0.2s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.assignedProjectIDs.includes(project.projectID)}
                          onChange={() => handleProjectToggle(project.projectID)}
                          style={{ marginRight: '10px', width: '18px', height: '18px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {project.projectName}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            {project.customerName} • {project.trackingNumber}
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                type="submit" 
                className="btn btn-success" 
                disabled={loading}
              >
                {loading ? 'Speichern...' : '✓ Speichern'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                🗑️ Löschen
              </button>

            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditAdminModal;