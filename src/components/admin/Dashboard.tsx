// src/components/admin/Dashboard.tsx
import { useState, useEffect } from "react";
import { projectService } from "../../api/services/projectService";
import StatCard from "../common/StatCard";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import Notification from "../common/Notification";
import ResponsiveTable from "../common/ResponsiveTable";
import CustomSelect from "../common/CustomSelect";
import { ProjectModal } from "../modals/ProjectModal";
import { formatDate } from "../../utils/dateFormatter";
import type { Project, DashboardStats } from "../../types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: "info",
    message: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, statusFilter, projects]);

  const showNotification = (
    type: NotificationState["type"],
    message: string
  ) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsData, projectsData] = await Promise.all([
        projectService.getDashboardStats(),
        projectService.getAll(),
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setFilteredProjects(projectsData.slice(0, 10));
    } catch (error) {
      console.error("Error loading dashboard:", error);
      showNotification("error", "Fehler beim Laden der Dashboard-Daten");
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    setFilteredProjects(filtered.slice(0, 10));
  };

  const handleProjectClick = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch (error) {
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveSuccess = () => {
    loadDashboard();
    handleModalClose();
    showNotification("success", "Projekt erfolgreich aktualisiert!");
  };

  if (loading) {
    return <div className="text-center py-10 text-muted-foreground">Lade Dashboard-Daten...</div>;
  }

  const statusOptions = [
    { value: "", label: "Alle Status" },
    { value: "Planung", label: "Planung" },
    { value: "In Bearbeitung", label: "In Bearbeitung" },
    { value: "Warten auf Feedback", label: "Warten auf Feedback" },
    { value: "Abgeschlossen", label: "Abgeschlossen" },
  ];

  const columns = [
    {
      header: "Projekt",
      accessor: "projectName",
      render: (value: string, project: Project) => (
        <strong
          className="cursor-pointer text-sky-600 hover:text-sky-700 hover:underline"
          onClick={() => handleProjectClick(project.projectID)}
        >
          {value}
        </strong>
      ),
    },
    {
      header: "Kunde",
      accessor: "customerName",
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
      header: "Tracking-Nr.",
      accessor: "trackingNumber",
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
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-5">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Aktive Projekte" value={stats?.activeProjects || 0} />
        <StatCard
          title="Kunden"
          value={stats?.totalCustomers || 0}
          gradient="linear-gradient(135deg, #fc6076 0%, #ff9a44 100%)"
        />
        <StatCard
          title="Abgeschlossen"
          value={stats?.completedProjects || 0}
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <StatCard
          title="Kommentare"
          value={stats?.totalComments || 0}
          gradient="linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Aktuelle Projekte</h2>
          <div className="flex flex-wrap gap-3 mb-5">
            <Input
              type="text"
              placeholder="Suchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <CustomSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
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
      />

      {notification.show && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={hideNotification}
        />
      )}
    </div>
  );
};

export default Dashboard;
