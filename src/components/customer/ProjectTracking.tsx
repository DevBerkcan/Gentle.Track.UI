// src/components/customer/ProjectTracking.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { projectService } from '../../api/services/projectService';
import { commentService } from '../../api/services/commentService';
import { notificationService } from '../../api/services/notificationService';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Notification from '../common/Notification';
import ProjectBriefingForm from './ProjectBriefingForm';
import { formatDate, getPhaseIcon } from '../../utils/dateFormatter';
import type { CreateCommentDto, Comment, Project } from '../../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Bell, BellOff, Send, Mail, MessageSquare, CheckCircle2, Circle, Clock, AlertCircle, CalendarDays, ClipboardList, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import lockupLight from '@/assets/brand/gentle-track-lockup-light.svg';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const PhaseStatusIcon = ({ status }: { status: string }) => {
  if (status === 'Abgeschlossen') {
    return (
      <span className="grid place-items-center w-8 h-8 rounded-full bg-teal text-teal-foreground ring-4 ring-background shrink-0">
        <CheckCircle2 className="w-4 h-4" />
      </span>
    );
  }
  if (status === 'In Bearbeitung' || status === 'Warten auf Feedback') {
    return (
      <span className="relative grid place-items-center w-9 h-9 -m-0.5 rounded-full bg-primary text-primary-foreground ring-4 ring-background shadow-[0_0_0_6px_var(--accent)] shrink-0">
        <Clock className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span className="grid place-items-center w-8 h-8 rounded-full border-2 border-border bg-card ring-4 ring-background text-text-muted shrink-0">
      <Circle className="w-3.5 h-3.5" />
    </span>
  );
};

const ProjectTracking = () => {
  const { t } = useTranslation('customerPortal');
  const { t: tc } = useTranslation('common');
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentMessage, setCommentMessage] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [notificationEmail, setNotificationEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });
  const [activeTab, setActiveTab] = useState<'status' | 'briefing'>('status');

  const showNotificationMsg = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  const loadProjectByTracking = async (tracking: string) => {
    if (!tracking.trim()) { showNotificationMsg('warning', t('tracking.emptyTrackingNumberWarning')); return; }
    try {
      setError('');
      const data = await projectService.getByTrackingNumber(tracking);
      setProject(data);
      setShowDetails(true);
      loadComments(data.projectID);
      const savedEmail = localStorage.getItem(`notification_email_${data.projectID}`);
      if (savedEmail) { setNotificationEmail(savedEmail); checkSubscription(data.projectID, savedEmail); }
    } catch {
      setError(t('tracking.notFoundError'));
      setShowDetails(false);
    }
  };

  const loadComments = async (projectId: number) => {
    try { setComments(await commentService.getProjectComments(projectId)); } catch { /* ignore */ }
  };

  const checkSubscription = async (projectId: number, email: string) => {
    try { setIsSubscribed(await notificationService.isSubscribed(projectId, email)); } catch { setIsSubscribed(false); }
  };

  const handleToggleNotification = async () => {
    if (!project || !notificationEmail.trim()) { showNotificationMsg('warning', t('tracking.emptyEmailWarning')); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) { showNotificationMsg('warning', t('tracking.invalidEmailWarning')); return; }
    try {
      const result = await notificationService.toggle(project.projectID, notificationEmail);
      setIsSubscribed(result.isActive);
      result.isActive ? localStorage.setItem(`notification_email_${project.projectID}`, notificationEmail) : localStorage.removeItem(`notification_email_${project.projectID}`);
      showNotificationMsg('success', result.isActive ? t('tracking.notificationsEnabledSuccess') : t('tracking.notificationsDisabledSuccess'));
      setShowNotificationForm(false);
    } catch { showNotificationMsg('error', t('tracking.notificationToggleError')); }
  };

  const handleSendComment = async () => {
    if (!commentMessage.trim()) { showNotificationMsg('warning', t('tracking.emptyMessageWarning')); return; }
    if (!authorName.trim()) { showNotificationMsg('warning', t('tracking.emptyNameWarning')); return; }
    if (!project) return;
    try {
      const commentData: CreateCommentDto = { projectID: project.projectID, message: commentMessage, authorName: authorName.trim() };
      await commentService.createCustomerComment(commentData);
      showNotificationMsg('success', t('tracking.commentSentSuccess'));
      setCommentMessage('');
      loadComments(project.projectID);
    } catch { showNotificationMsg('error', t('tracking.commentSendError')); }
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) { showNotificationMsg('warning', t('tracking.emptyTrackingNumberWarning')); return; }
    setSearchParams({ tracking: trackingNumber });
    await loadProjectByTracking(trackingNumber);
  };

  const resetTracking = () => {
    setShowDetails(false); setProject(null); setTrackingNumber(''); setError('');
    setComments([]); setCommentMessage(''); setAuthorName('');
    setNotificationEmail(''); setIsSubscribed(false); setShowNotificationForm(false);
    setActiveTab('status');
    setSearchParams({});
  };

  useEffect(() => {
    const trackingFromUrl = searchParams.get('tracking');
    if (trackingFromUrl) { setTrackingNumber(trackingFromUrl); loadProjectByTracking(trackingFromUrl); }
    if (searchParams.get('tab') === 'briefing') setActiveTab('briefing');
  }, []);

  // ─── Search View ────────────────────────────────────────────────────────────
  if (!showDetails) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        {/* Branding */}
        <img src={lockupLight} alt="Gentle Track" className="h-9 w-auto mb-8" />

        <h1 className="text-3xl font-bold text-foreground mb-2">{t('tracking.searchTitle')}</h1>
        <p className="text-muted-foreground mb-8 max-w-sm">
          {t('tracking.searchSubtitle')}
        </p>

        <div className="flex gap-2 w-full max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('tracking.trackingNumberPlaceholder')}
              value={trackingNumber}
              onChange={e => setTrackingNumber(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTrack()}
              className="pl-10 h-11 text-base"
            />
          </div>
          <Button onClick={handleTrack} className="h-11 px-5 shrink-0">
            <Search className="w-4 h-4 mr-1.5" />{t('tracking.trackButton')}
          </Button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive p-3.5 rounded-xl text-sm max-w-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
      </div>
    );
  }

  if (!project) return null;

  // ─── Project Detail View ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={resetTracking} className="text-muted-foreground hover:text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" />{t('tracking.backToSearch')}
      </Button>

      {/* Partner-Branding */}
      <div className="flex justify-center">
        <img src="/kreavolut_logo.png" alt="Kreavolut" className="h-6 sm:h-7 w-auto opacity-90" />
      </div>

      {/* Tab switch */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('status')}
          className={cn('flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'status' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />{t('tracking.statusTab')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('briefing')}
          className={cn('flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
            activeTab === 'briefing' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
        >
          <ClipboardList className="w-3.5 h-3.5" />{t('tracking.briefingTab')}
        </button>
      </div>

      {activeTab === 'briefing' && <ProjectBriefingForm trackingNumber={project.trackingNumber} />}

      {activeTab === 'status' && (
      <>
      {/* Project Overview */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
              <h1 className="text-xl font-bold text-foreground">{project.projectName}</h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-sm text-muted-foreground font-mono">{project.trackingNumber}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-sm text-muted-foreground">{project.customerName}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isSubscribed && (
                <span className="inline-flex items-center gap-1.5 bg-success-bg border border-success/20 text-[#15805A] px-3 py-1 rounded-full text-xs font-medium">
                  <Bell className="w-3 h-3" />{t('tracking.notificationsActiveBadge')}
                </span>
              )}
              <Badge status={project.status} />
            </div>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('tracking.overallProgress')}</span>
            </div>
            <ProgressBar progress={project.progress} />
          </div>

          {project.description && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 p-3.5 bg-secondary rounded-lg border border-border">
              {project.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-border">
            {[
              { label: t('tracking.startDateLabel'), value: formatDate(project.startDate) },
              { label: t('tracking.endDateLabel'), value: formatDate(project.endDate) },
              ...(project.daysUntilDeadline !== undefined ? [{
                label: t('tracking.remainingLabel'),
                value: t('tracking.daysRemaining', { count: project.daysUntilDeadline }),
                urgent: project.daysUntilDeadline < 7,
              }] : []),
            ].map(item => (
              <div key={item.label} className="flex items-start gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className={cn('text-sm font-semibold', (item as any).urgent && 'text-error')}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      {project.phases && project.phases.length > 0 && (
        <Card className="border border-border shadow-sm">
          <CardHeader className="border-b border-border pb-4">
            <h2 className="text-base font-semibold text-foreground">{t('tracking.phasesTitle')}</h2>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-0">
              {project.phases.map((phase, index) => (
                <div key={phase.phaseID} className="flex gap-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <PhaseStatusIcon status={phase.status} />
                    {index < project.phases!.length - 1 && (
                      <div className={cn('w-0.5 flex-1 mt-1 mb-1 min-h-[1.5rem]', phase.status === 'Abgeschlossen' ? 'bg-teal' : 'bg-border')} />
                    )}
                  </div>
                  {/* Content */}
                  <div className={cn('flex-1 pb-4', index === project.phases!.length - 1 && 'pb-0')}>
                    <div className={cn('p-4 rounded-xl border', {
                      'bg-teal-tint border-teal/15': phase.status === 'Abgeschlossen',
                      'bg-accent border-accent-foreground/15': phase.status === 'In Bearbeitung',
                      'bg-warning-bg border-warning/15': phase.status === 'Warten auf Feedback',
                      'bg-secondary border-border': phase.status !== 'Abgeschlossen' && phase.status !== 'In Bearbeitung' && phase.status !== 'Warten auf Feedback',
                    })}>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground text-sm">
                          {getPhaseIcon(phase.status)} {phase.phaseName}
                        </h4>
                      </div>
                      {phase.description && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{phase.description}</p>}
                      {phase.completedAt && <p className="text-xs text-muted-foreground/60 mt-1.5">{t('tracking.completedOnDate', { date: formatDate(phase.completedAt) })}</p>}
                      {phase.startedAt && !phase.completedAt && <p className="text-xs text-muted-foreground/60 mt-1.5">{t('tracking.startedOnDate', { date: formatDate(phase.startedAt) })}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Notifications */}
      <Card className="border border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success-bg flex items-center justify-center">
                <Bell className="w-4 h-4 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('tracking.emailNotificationsTitle')}</h3>
                <p className="text-xs text-muted-foreground">
                  {isSubscribed ? t('tracking.notificationActiveFor', { email: notificationEmail }) : t('tracking.notificationSubtitle')}
                </p>
              </div>
            </div>
            <Button variant={showNotificationForm ? 'secondary' : 'outline'} size="sm" onClick={() => setShowNotificationForm(!showNotificationForm)}>
              {showNotificationForm ? tc('actions.close') : isSubscribed ? t('tracking.manageButton') : t('tracking.activateButton')}
            </Button>
          </div>

          {showNotificationForm && (
            <div className="mt-4 p-4 bg-success-bg/60 border border-success/15 rounded-xl space-y-3">
              <p className="text-sm text-muted-foreground">
                {isSubscribed ? t('tracking.alreadySubscribedText') : t('tracking.subscribePromptText')}
              </p>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('tracking.emailAddressLabel')}</Label>
                <Input type="email" placeholder={t('tracking.emailPlaceholder')} value={notificationEmail} onChange={e => setNotificationEmail(e.target.value)} className="h-9" />
              </div>
              <Button size="sm" variant={isSubscribed ? 'destructive' : 'default'} onClick={handleToggleNotification}>
                {isSubscribed ? <><BellOff className="w-3.5 h-3.5 mr-1.5" />{t('tracking.deactivateButton')}</> : <><Bell className="w-3.5 h-3.5 mr-1.5" />{t('tracking.activateButton')}</>}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border pb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            {t('tracking.commentsTitle')}
            {comments.length > 0 && (
              <span className="ml-auto text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">{comments.length}</span>
            )}
          </h2>
        </CardHeader>
        <CardContent className="p-5 space-y-5">
          {/* New Comment Form */}
          <div className="p-4 bg-secondary border border-border rounded-xl space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t('tracking.writeCommentTitle')}</h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('tracking.yourNameLabel')}</Label>
              <Input type="text" placeholder={t('tracking.namePlaceholder')} value={authorName} onChange={e => setAuthorName(e.target.value)} className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('tracking.messageLabel')}</Label>
              <Textarea placeholder={t('tracking.messagePlaceholder')} value={commentMessage} onChange={e => setCommentMessage(e.target.value)} rows={3} />
            </div>
            <Button size="sm" onClick={handleSendComment}>
              <Send className="w-3.5 h-3.5 mr-1.5" />{t('tracking.sendCommentButton')}
            </Button>
          </div>

          {/* Existing Comments */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map(comment => (
                <div
                  key={comment.commentID}
                  className={cn('p-4 rounded-xl border-l-4', comment.authorType === 'Admin' ? 'bg-primary/5 border-l-primary' : 'bg-info-bg/60 border-l-info')}
                >
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', comment.authorType === 'Admin' ? 'bg-primary' : 'bg-info')}>
                      {comment.authorName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', comment.authorType === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-info-bg text-[#2557B0]')}>
                      {comment.authorType === 'Admin' ? t('tracking.commentAuthorAdmin') : t('tracking.commentAuthorCustomer')}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <MessageSquare className="w-8 h-8 opacity-30" />
              <p className="text-sm font-medium">{t('tracking.noCommentsTitle')}</p>
              <p className="text-xs">{t('tracking.noCommentsSubtitle')}</p>
            </div>
          )}

          <div className="flex items-start gap-2 p-3.5 bg-success-bg/60 border border-success/15 rounded-lg text-xs text-[#15805A]">
            <Mail className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{t('tracking.commentsVisibilityNote')}{isSubscribed && t('tracking.commentsNotificationNote')}</span>
          </div>
        </CardContent>
      </Card>
      </>
      )}

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </div>
  );
};

export default ProjectTracking;
