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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LayoutDashboard, Users, FolderCheck, MessageSquare, Search, Loader2, FolderOpen } from "lucide-react";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    show: false, type: "info", message: "",
  });

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { filterProjects(); }, [searchTerm, statusFilter, projects]);

  const showNotification = (type: NotificationState["type"], message: string) => {
    setNotification({ show: true, type, message });
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
    } catch {
      showNotification("error", "Fehler beim Laden der Dashboard-Daten");
    } finally {
      setLoading(false);
    }
  };


const filterProjects = () => {
  let filtered = projects;
  if (searchTerm) {
    const q = searchTerm.toLowerCase();
    filtered = filtered.filter(p =>
      p.projectName.toLowerCase().includes(q) ||
      p.customerName.toLowerCase().includes(q) ||
      p.trackingNumber.toLowerCase().includes(q)
    );
  }
  if (statusFilter && statusFilter !== "all") {  // ✅ changed condition
    filtered = filtered.filter(p => p.status === statusFilter);
  }
  setFilteredProjects(filtered.slice(0, 10));
};


  const handleProjectClick = async (id: number) => {
    try {
      const project = await projectService.getById(id);
      setSelectedProject(project);
      setIsModalOpen(true);
    } catch {
      showNotification("error", "Fehler beim Laden des Projekts");
    }
  };

  const handleModalClose = () => { setIsModalOpen(false); setSelectedProject(null); };
  const handleSaveSuccess = () => { loadDashboard(); handleModalClose(); showNotification("success", "Projekt erfolgreich aktualisiert!"); };

const statusOptions = [
  { value: "all", label: "Alle Status" }, 
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
        <button
          className="font-semibold text-primary hover:text-primary/80 hover:underline text-left transition-colors"
          onClick={() => handleProjectClick(project.projectID)}
        >
          {value}
        </button>
      ),
    },
    { header: "Kunde", accessor: "customerName" },
    { header: "Status", accessor: "status", render: (value: string) => <Badge status={value} /> },
    { header: "Fortschritt", accessor: "progress", render: (value: number) => <ProgressBar progress={value} /> },
    { header: "Tracking-Nr.", accessor: "trackingNumber" },
    { header: "Start", accessor: "startDate", render: (value: string) => formatDate(value) },
    { header: "Ende", accessor: "endDate", render: (value: string) => formatDate(value) },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Dashboard wird geladen…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">Übersicht aller Projekte und Aktivitäten</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Aktive Projekte"
          value={stats?.activeProjects || 0}
          icon={FolderOpen}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title="Kunden gesamt"
          value={stats?.totalCustomers || 0}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Abgeschlossen"
          value={stats?.completedProjects || 0}
          icon={FolderCheck}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <StatCard
          title="Kommentare"
          value={stats?.totalComments || 0}
          icon={MessageSquare}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Projects Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Aktuelle Projekte</h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Suchen…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-sm w-48"
                />
              </div>
              <CustomSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                className="w-44 h-8 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <FolderOpen className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">Keine Projekte gefunden</p>
              <p className="text-xs">Versuche einen anderen Suchbegriff oder Filter</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredProjects} keyField="projectID" />
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
          onClose={() => setNotification(n => ({ ...n, show: false }))}
        />
      )}
    </div>
  );
};

export default Dashboard;
