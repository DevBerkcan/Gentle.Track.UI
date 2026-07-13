// src/components/admin/ProjectManagement.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { projectService } from "../../api/services/projectService";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import Notification from "../common/Notification";
import ConfirmDialog from "../common/ConfirmDialog";
import ResponsiveTable from "../common/ResponsiveTable";
import CustomSelect from "../common/CustomSelect";
import { formatDate } from "../../utils/dateFormatter";
import type { Project } from "../../types";
import { ProjectModal } from "../modals/ProjectModal";
import { BriefingViewModal } from "../modals/BriefingViewModal";
import { PriceOfferModal } from "../modals/PriceOfferModal";
import { useAuth } from "../../contexts/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Archive, RotateCcw, Search, FolderOpen, Loader2, ClipboardList, Send, Tag } from "lucide-react";

interface NotificationState { show: boolean; type: "success" | "error" | "warning" | "info"; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: "danger" | "warning" | "info"; }

const ProjectManagement = () => {
  const { t } = useTranslation('projects');
  const { t: tc } = useTranslation('common');
  const { admin } = useAuth();
  const isOwner = admin?.role === "Owner";
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [briefingProject, setBriefingProject] = useState<Project | null>(null);
  const [offerProject, setOfferProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: "info", message: "" });
  const [confirm, setConfirm] = useState<ConfirmState>({ show: false, title: "", message: "", onConfirm: () => {}, type: "warning" });

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { filterProjects(); }, [searchTerm, archiveFilter, projects]);

  const showNotification = (type: NotificationState["type"], message: string) => setNotification({ show: true, type, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: ConfirmState["type"] = "warning") => setConfirm({ show: true, title, message, onConfirm, type });

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll(true);
      setProjects(data);
    } catch {
      showNotification("error", t('list.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = archiveFilter === "active" ? projects.filter(p => !p.isArchived) : projects.filter(p => p.isArchived);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(p => p.projectName.toLowerCase().includes(q) || p.customerName.toLowerCase().includes(q) || p.trackingNumber.toLowerCase().includes(q));
    }
    setFilteredProjects(filtered);
  };

  const handleEdit = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch {
      showNotification("error", t('list.errors.loadOneFailed'));
    }
  };

  const handleArchive = (id: number, name: string) => {
    showConfirm(t('list.confirm.archiveTitle'), t('list.confirm.archiveMessage', { name }), async () => {
      try { await projectService.archive(id); showNotification("success", t('list.notifications.archived')); loadProjects(); }
      catch { showNotification("error", t('list.errors.archiveFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, "warning");
  };

  const handleRestore = (id: number, name: string) => {
    showConfirm(t('list.confirm.restoreTitle'), t('list.confirm.restoreMessage', { name }), async () => {
      try { await projectService.restore(id); showNotification("success", t('list.notifications.restored')); loadProjects(); }
      catch { showNotification("error", t('list.errors.restoreFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, "info");
  };

  const handleRelease = (id: number, name: string) => {
    showConfirm(t('list.actions.release'), t('list.confirm.releaseMessage', { name }), async () => {
      try { await projectService.release(id); showNotification("success", t('list.notifications.released')); loadProjects(); }
      catch { showNotification("error", t('list.errors.releaseFailed')); }
      setConfirm(c => ({ ...c, show: false }));
    }, "info");
  };

  const handleSaveSuccess = () => {
    loadProjects();
    setIsModalOpen(false);
    setSelectedProject(null);
    showNotification("success", selectedProject ? t('list.notifications.updated') : t('list.notifications.created'));
  };

  const archiveOptions = [
    { value: "active", label: t('list.filters.active') },
    { value: "archived", label: t('list.filters.archived') },
  ];

  const columns = [
    { header: t('list.columns.projectName'), accessor: "projectName", render: (v: string) => <span className="font-semibold text-foreground">{v}</span> },
    { header: t('list.columns.customer'), accessor: "customerName" },
    { header: t('list.columns.trackingNumber'), accessor: "trackingNumber", render: (v: string) => <span className="font-mono text-sm text-muted-foreground">{v}</span> },
    { header: t('list.columns.status'), accessor: "status", render: (v: string) => <Badge status={v} /> },
    { header: t('list.columns.offer'), accessor: "offerStatus", render: (v?: string) => v ? <Badge status={v} /> : <span className="text-xs text-muted-foreground">–</span> },
    { header: t('list.columns.progress'), accessor: "progress", render: (v: number) => <ProgressBar progress={v} /> },
    { header: t('list.columns.start'), accessor: "startDate", render: (v: string) => formatDate(v) },
    { header: t('list.columns.end'), accessor: "endDate", render: (v: string) => formatDate(v) },
    {
      header: t('list.columns.actions'), accessor: "projectID",
      render: (_: any, project: Project) => (
        <div className="flex flex-wrap gap-1.5">
          <Button size="icon-sm" onClick={() => handleEdit(project.projectID)} title={tc('actions.edit')} aria-label={tc('actions.edit')}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button size="icon-sm" variant="outline" onClick={() => setBriefingProject(project)} title={t('list.actions.briefing')} aria-label={t('list.actions.briefing')}>
            <ClipboardList className="w-3.5 h-3.5" />
          </Button>
          {!project.isReleased ? (
            <Button size="icon-sm" variant="outline" onClick={() => handleRelease(project.projectID, project.projectName)} title={t('list.actions.release')} aria-label={t('list.actions.release')}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="icon-sm" variant="outline" onClick={() => setOfferProject(project)} title={isOwner ? t('list.actions.priceOffer') : t('list.actions.offer')} aria-label={isOwner ? t('list.actions.priceOffer') : t('list.actions.offer')}>
              <Tag className="w-3.5 h-3.5" />
            </Button>
          )}
          {!project.isArchived ? (
            <Button size="icon-sm" variant="outline" onClick={() => handleArchive(project.projectID, project.projectName)} title={t('list.actions.archive')} aria-label={t('list.actions.archive')}>
              <Archive className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button size="icon-sm" variant="outline" onClick={() => handleRestore(project.projectID, project.projectName)} title={t('list.actions.restore')} aria-label={t('list.actions.restore')}>
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
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
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t('list.title')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">{t('list.subtitle')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />{t('list.newProject')}
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder={t('list.searchPlaceholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm w-48" />
            </div>
            <CustomSelect value={archiveFilter} onChange={setArchiveFilter} options={archiveOptions} className="w-44 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">{t('list.empty')}</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredProjects} keyField="projectID" />
          )}
        </CardContent>
      </Card>

      <ProjectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProject(null); }} project={selectedProject} onSaveSuccess={handleSaveSuccess} onDeleteSuccess={() => { loadProjects(); setIsModalOpen(false); setSelectedProject(null); showNotification("success", t('list.notifications.deleted')); }} />
      <BriefingViewModal isOpen={!!briefingProject} onClose={() => setBriefingProject(null)} projectId={briefingProject?.projectID ?? null} projectName={briefingProject?.projectName} />
      <PriceOfferModal isOpen={!!offerProject} onClose={() => setOfferProject(null)} projectId={offerProject?.projectID ?? null} projectName={offerProject?.projectName} onChanged={loadProjects} />
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === "danger" ? tc('actions.delete') : tc('actions.confirm')} />
    </div>
  );
};

export default ProjectManagement;
