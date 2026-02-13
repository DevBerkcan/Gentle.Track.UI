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
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Archive, RotateCcw } from "lucide-react";

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type?: "danger" | "warning" | "info";
}

const ProjectManagement = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<string>("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "info",
    message: "",
  });

  const handleDeleteSuccess = () => {
    loadProjects();
    handleModalClose();
    showNotification("success", "Projekt erfolgreich gelöscht!");
  };

  const [confirm, setConfirm] = useState<ConfirmState>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "warning",
  });

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, archiveFilter, projects]);

  const showNotification = (
    type: NotificationState["type"],
    message: string
  ) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: ConfirmState["type"] = "warning"
  ) => {
    setConfirm({ show: true, title, message, onConfirm, type });
  };

  const hideConfirm = () => {
    setConfirm({ ...confirm, show: false });
  };

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAll(true);
      setProjects(data);
    } catch (error) {
      console.error("Error loading projects:", error);
      showNotification("error", "Fehler beim Laden der Projekte");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (archiveFilter === "active") {
      filtered = filtered.filter((p) => !p.isArchived);
    } else {
      filtered = filtered.filter((p) => p.isArchived);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
  };

  const handleEdit = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch (error) {
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleArchive = (id: number, name: string) => {
    showConfirm(
      "Projekt archivieren",
      `Möchten Sie das Projekt "${name}" wirklich archivieren?`,
      async () => {
        try {
          await projectService.archive(id);
          showNotification("success", "Projekt erfolgreich archiviert!");
          loadProjects();
        } catch (error) {
          showNotification("error", "Fehler beim Archivieren des Projekts");
        }
        hideConfirm();
      },
      "warning"
    );
  };

  const handleRestore = (id: number, name: string) => {
    showConfirm(
      "Projekt wiederherstellen",
      `Möchten Sie das Projekt "${name}" wiederherstellen?`,
      async () => {
        try {
          await projectService.restore(id);
          showNotification("success", "Projekt erfolgreich wiederhergestellt!");
          loadProjects();
        } catch (error) {
          showNotification(
            "error",
            "Fehler beim Wiederherstellen des Projekts"
          );
        }
        hideConfirm();
      },
      "info"
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveSuccess = () => {
    loadProjects();
    handleModalClose();
    showNotification(
      "success",
      selectedProject
        ? "Projekt erfolgreich aktualisiert!"
        : "Projekt erfolgreich angelegt!"
    );
  };

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Lade Projekte...</div>;
  }

  const archiveOptions = [
    { value: "active", label: "Aktive Projekte" },
    { value: "archived", label: "Archivierte Projekte" },
  ];

  const columns = [
    {
      header: "Projektname",
      accessor: "projectName",
      render: (value: string) => <strong className="text-foreground">{value}</strong>,
    },
    {
      header: "Kunde",
      accessor: "customerName",
    },
    {
      header: "Tracking-Nr.",
      accessor: "trackingNumber",
    },
    {
      header: "Status",
      accessor: "status",
      render: (value: string) => <Badge status={value} />,
    },
    {
      header: "Fortschritt",
      accessor: "progress",
      render: (value: number) => <ProgressBar progress={value} />,
    },
    {
      header: "Startdatum",
      accessor: "startDate",
      render: (value: string) => formatDate(value),
    },
    {
      header: "Enddatum",
      accessor: "endDate",
      render: (value: string) => formatDate(value),
    },
    {
      header: "Aktionen",
      accessor: "projectID",
      render: (_: any, project: Project) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="default"
            className="bg-sky-500 hover:bg-sky-600 text-white"
            onClick={() => handleEdit(project.projectID)}
          >
            <Pencil className="w-3.5 h-3.5 mr-1" />
            Bearbeiten
          </Button>
          {!project.isArchived ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                handleArchive(project.projectID, project.projectName)
              }
            >
              <Archive className="w-3.5 h-3.5 mr-1" />
              Archivieren
            </Button>
          ) : (
            <Button
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
              onClick={() =>
                handleRestore(project.projectID, project.projectName)
              }
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Wiederherstellen
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center flex-wrap gap-3 mb-5">
        <h2 className="text-xl font-bold text-foreground">Projekte verwalten</h2>
        <Button
          className="bg-cyan-500 hover:bg-cyan-600 text-white"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Neues Projekt
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 mb-5">
            <Input
              type="text"
              placeholder="Projekt suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <CustomSelect
              value={archiveFilter}
              onChange={setArchiveFilter}
              options={archiveOptions}
              className="w-[200px]"
            />
          </div>

          {filteredProjects.length === 0 ? (
            <p className="text-center text-muted-foreground py-5">
              Keine Projekte gefunden
            </p>
          ) : (
            <ResponsiveTable
              columns={columns}
              data={filteredProjects}
              keyField="projectID"
            />
          )}
        </CardContent>
      </Card>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        project={selectedProject}
        onSaveSuccess={handleSaveSuccess}
        onDeleteSuccess={handleDeleteSuccess}
      />

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}

      <ConfirmDialog
        isOpen={confirm.show}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={hideConfirm}
        type={confirm.type}
        confirmText={confirm.type === "danger" ? "Löschen" : "Bestätigen"}
      />
    </div>
  );
};

export default ProjectManagement;
