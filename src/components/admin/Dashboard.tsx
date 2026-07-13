// src/components/admin/Dashboard.tsx
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { projectService } from "../../api/services/projectService";
import StatCard from "../common/StatCard";
import Badge from "../common/Badge";
import ProgressBar from "../common/ProgressBar";
import Notification from "../common/Notification";
import ResponsiveTable from "../common/ResponsiveTable";
import CustomSelect from "../common/CustomSelect";
import { ProjectModal } from "../modals/ProjectModal";
import { formatDate } from "../../utils/dateFormatter";
import type { Project, DashboardStats, DashboardCustomer } from "../../types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard, Users, FolderCheck, MessageSquare, Search, Loader2, FolderOpen,
  AlarmClock, ClipboardList, Tag, UserPlus,
} from "lucide-react";

interface NotificationState {
  show: boolean;
  type: "success" | "error" | "warning" | "info";
  message: string;
}

const Dashboard = () => {
  const { t } = useTranslation('dashboard');
  const { t: tc } = useTranslation('common');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentCustomers, setRecentCustomers] = useState<DashboardCustomer[]>([]);
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
      const [statsData, projectsData, customersData] = await Promise.all([
        projectService.getDashboardStats(),
        projectService.getAll(),
        projectService.getRecentCustomers(5),
      ]);
      setStats(statsData);
      setProjects(projectsData);
      setFilteredProjects(projectsData.slice(0, 10));
      setRecentCustomers(customersData);
    } catch {
      showNotification("error", t('errors.loadDashboard'));
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
      showNotification("error", t('errors.loadProject'));
    }
  };

  const handleModalClose = () => { setIsModalOpen(false); setSelectedProject(null); };
  const handleSaveSuccess = () => { loadDashboard(); handleModalClose(); showNotification("success", t('notifications.projectUpdated')); };

const statusOptions = [
  { value: "all", label: t('filters.allStatuses') },
  { value: "Planung", label: tc('statusValues.Planung') },
  { value: "In Bearbeitung", label: tc('statusValues.In Bearbeitung') },
  { value: "Warten auf Feedback", label: tc('statusValues.Warten auf Feedback') },
  { value: "Abgeschlossen", label: tc('statusValues.Abgeschlossen') },
];

  const columns = [
    {
      header: t('table.project'),
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
    { header: t('table.customer'), accessor: "customerName" },
    { header: t('table.status'), accessor: "status", render: (value: string) => <Badge status={value} /> },
    { header: t('table.progress'), accessor: "progress", render: (value: number) => <ProgressBar progress={value} /> },
    { header: t('table.trackingNumber'), accessor: "trackingNumber" },
    { header: t('table.start'), accessor: "startDate", render: (value: string) => formatDate(value) },
    { header: t('table.end'), accessor: "endDate", render: (value: string) => formatDate(value) },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">{t('header.title')}</h1>
        </div>
        <p className="text-sm text-muted-foreground">{t('header.subtitle')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.activeProjects')}
          value={stats?.activeProjects || 0}
          icon={FolderOpen}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title={t('stats.totalCustomers')}
          value={stats?.totalCustomers || 0}
          icon={Users}
          iconColor="text-info"
          iconBg="bg-info-bg"
        />
        <StatCard
          title={t('stats.completedProjects')}
          value={stats?.completedProjects || 0}
          icon={FolderCheck}
          iconColor="text-success"
          iconBg="bg-success-bg"
        />
        <StatCard
          title={t('stats.totalComments')}
          value={stats?.totalComments || 0}
          icon={MessageSquare}
          iconColor="text-warning"
          iconBg="bg-warning-bg"
        />
      </div>

      {/* Attention-needed Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.dueSoon')}
          value={stats?.projectsDueSoon || 0}
          icon={AlarmClock}
          iconColor="text-warning"
          iconBg="bg-warning-bg"
        />
        <StatCard
          title={t('stats.pendingBriefings')}
          value={stats?.pendingBriefings || 0}
          icon={ClipboardList}
          iconColor="text-info"
          iconBg="bg-info-bg"
        />
        <StatCard
          title={t('stats.openOffers')}
          value={stats?.offersAwaitingResponse || 0}
          icon={Tag}
          iconColor="text-primary"
          iconBg="bg-primary/10"
        />
        <StatCard
          title={t('stats.newCustomers')}
          value={stats?.newCustomersThisMonth || 0}
          icon={UserPlus}
          iconColor="text-success"
          iconBg="bg-success-bg"
        />
      </div>

      {/* Projects Table */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">{t('projectsCard.title')}</h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('filters.searchPlaceholder')}
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
              <p className="text-sm font-medium">{t('projectsCard.emptyTitle')}</p>
              <p className="text-xs">{t('projectsCard.emptyHint')}</p>
            </div>
          ) : (
            <ResponsiveTable columns={columns} data={filteredProjects} keyField="projectID" />
          )}
        </CardContent>
      </Card>

      {/* Recent Customers */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">{t('recentCustomers.title')}</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentCustomers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Users className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">{t('recentCustomers.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentCustomers.map((c) => (
                <div key={c.customerID} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{c.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.contactPerson} · {c.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md whitespace-nowrap">
                      {t('recentCustomers.projectCount', { count: c.projectCount })}
                    </span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(c.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
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
