// src/components/admin/ProjectManagement.tsx
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Archive, RotateCcw, Search, FolderOpen, Loader2 } from "lucide-react";

interface NotificationState { show: boolean; type: "success" | "error" | "warning" | "info"; message: string; }
interface ConfirmState { show: boolean; title: string; message: string; onConfirm: () => void; type?: "danger" | "warning" | "info"; }

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
      showNotification("error", "Fehler beim Laden der Projekte");
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
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleArchive = (id: number, name: string) => {
    showConfirm("Projekt archivieren", `Möchten Sie das Projekt "${name}" wirklich archivieren?`, async () => {
      try { await projectService.archive(id); showNotification("success", "Projekt erfolgreich archiviert!"); loadProjects(); }
      catch { showNotification("error", "Fehler beim Archivieren"); }
      setConfirm(c => ({ ...c, show: false }));
    }, "warning");
  };

  const handleRestore = (id: number, name: string) => {
    showConfirm("Projekt wiederherstellen", `Möchten Sie das Projekt "${name}" wiederherstellen?`, async () => {
      try { await projectService.restore(id); showNotification("success", "Projekt wiederhergestellt!"); loadProjects(); }
      catch { showNotification("error", "Fehler beim Wiederherstellen"); }
      setConfirm(c => ({ ...c, show: false }));
    }, "info");
  };

  const handleSaveSuccess = () => {
    loadProjects();
    setIsModalOpen(false);
    setSelectedProject(null);
    showNotification("success", selectedProject ? "Projekt erfolgreich aktualisiert!" : "Projekt erfolgreich angelegt!");
  };

  const archiveOptions = [
    { value: "active", label: "Aktive Projekte" },
    { value: "archived", label: "Archivierte Projekte" },
  ];

  const columns = [
    { header: "Projektname", accessor: "projectName", render: (v: string) => <span className="font-semibold text-foreground">{v}</span> },
    { header: "Kunde", accessor: "customerName" },
    { header: "Tracking-Nr.", accessor: "trackingNumber", render: (v: string) => <span className="font-mono text-sm text-muted-foreground">{v}</span> },
    { header: "Status", accessor: "status", render: (v: string) => <Badge status={v} /> },
    { header: "Fortschritt", accessor: "progress", render: (v: number) => <ProgressBar progress={v} /> },
    { header: "Start", accessor: "startDate", render: (v: string) => formatDate(v) },
    { header: "Ende", accessor: "endDate", render: (v: string) => formatDate(v) },
    {
      header: "Aktionen", accessor: "projectID",
      render: (_: any, project: Project) => (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => handleEdit(project.projectID)}>
            <Pencil className="w-3.5 h-3.5 mr-1" />Bearbeiten
          </Button>
          {!project.isArchived ? (
            <Button size="sm" variant="secondary" onClick={() => handleArchive(project.projectID, project.projectName)}>
              <Archive className="w-3.5 h-3.5 mr-1" />Archivieren
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => handleRestore(project.projectID, project.projectName)}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />Wiederherstellen
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Projekte werden geladen…</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Projekte verwalten</h1>
          </div>
          <p className="text-sm text-muted-foreground">Alle Projekte erstellen, bearbeiten und archivieren</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />Neues Projekt
        </Button>
      </div>

      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Projekt suchen…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm w-48" />
            </div>
            <CustomSelect value={archiveFilter} onChange={setArchiveFilter} options={archiveOptions} className="w-44 h-8 text-sm" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Keine Projekte gefunden</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredProjects} keyField="projectID" />
          )}
        </CardContent>
      </Card>

      <ProjectModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProject(null); }} project={selectedProject} onSaveSuccess={handleSaveSuccess} onDeleteSuccess={() => { loadProjects(); setIsModalOpen(false); setSelectedProject(null); showNotification("success", "Projekt erfolgreich gelöscht!"); }} />
      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      <ConfirmDialog isOpen={confirm.show} title={confirm.title} message={confirm.message} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(c => ({ ...c, show: false }))} type={confirm.type} confirmText={confirm.type === "danger" ? "Löschen" : "Bestätigen"} />
    </div>
  );
};

export default ProjectManagement;
