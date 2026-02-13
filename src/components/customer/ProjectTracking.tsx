// src/components/customer/ProjectTracking.tsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projectService } from '../../api/services/projectService';
import { commentService } from '../../api/services/commentService';
import { notificationService } from '../../api/services/notificationService';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Notification from '../common/Notification';
import { formatDate, getPhaseIcon } from '../../utils/dateFormatter';
import type { CreateCommentDto, Comment, Project } from '../../types';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Bell, BellOff, Send, Mail, MessageSquare, CheckCircle, Circle, Clock } from 'lucide-react';

interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const ProjectTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  // Comment state
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentMessage, setCommentMessage] = useState('');
  const [authorName, setAuthorName] = useState('');

  // Notification state
  const [notificationEmail, setNotificationEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showNotificationForm, setShowNotificationForm] = useState(false);

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'info',
    message: ''
  });

  const loadProjectByTracking = async (tracking: string) => {
    if (!tracking.trim()) {
      showNotificationMsg('warning', 'Bitte geben Sie eine Tracking-Nummer ein');
      return;
    }

    try {
      setError('');
      const data = await projectService.getByTrackingNumber(tracking);
      setProject(data);
      setShowDetails(true);

      // Load comments for this project
      loadComments(data.projectID);

      // Check notification subscription if email is set
      const savedEmail = localStorage.getItem(`notification_email_${data.projectID}`);
      if (savedEmail) {
        setNotificationEmail(savedEmail);
        checkSubscription(data.projectID, savedEmail);
      }
    } catch (err) {
      setError('Projekt mit dieser Tracking-Nummer nicht gefunden');
      setShowDetails(false);
      showNotificationMsg('error', 'Projekt mit dieser Tracking-Nummer nicht gefunden');
    }
  };

  const loadComments = async (projectId: number) => {
    try {
      const commentsData = await commentService.getProjectComments(projectId);
      setComments(commentsData);
    } catch (err) {
      console.error('Error loading comments:', err);
    }
  };

  const checkSubscription = async (projectId: number, email: string) => {
    try {
      const subscribed = await notificationService.isSubscribed(projectId, email);
      setIsSubscribed(subscribed);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setIsSubscribed(false);
    }
  };

  const handleToggleNotification = async () => {
    if (!project) return;

    if (!notificationEmail.trim()) {
      showNotificationMsg('warning', 'Bitte geben Sie Ihre E-Mail-Adresse ein');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(notificationEmail)) {
      showNotificationMsg('warning', 'Bitte geben Sie eine gültige E-Mail-Adresse ein');
      return;
    }

    try {
      const result = await notificationService.toggle(project.projectID, notificationEmail);
      setIsSubscribed(result.isActive);

      // Save email to localStorage
      if (result.isActive) {
        localStorage.setItem(`notification_email_${project.projectID}`, notificationEmail);
      } else {
        localStorage.removeItem(`notification_email_${project.projectID}`);
      }

      showNotificationMsg(
        'success',
        result.isActive
          ? 'E-Mail-Benachrichtigungen aktiviert! Sie erhalten Updates zu diesem Projekt.'
          : 'E-Mail-Benachrichtigungen deaktiviert.'
      );

      setShowNotificationForm(false);
    } catch (err: any) {
      console.error('Error toggling notification:', err);
      showNotificationMsg('error', 'Fehler beim Ändern der Benachrichtigungseinstellungen');
    }
  };

  const handleSendComment = async () => {
    if (!commentMessage.trim()) {
      showNotificationMsg('warning', 'Bitte geben Sie eine Nachricht ein');
      return;
    }

    if (!authorName.trim()) {
      showNotificationMsg('warning', 'Bitte geben Sie Ihren Namen ein');
      return;
    }

    if (!project) return;

    try {
      const commentData: CreateCommentDto = {
        projectID: project.projectID,
        message: commentMessage,
        authorName: authorName.trim()
      };

      await commentService.createCustomerComment(commentData);
      showNotificationMsg('success', 'Kommentar erfolgreich gesendet!');
      setCommentMessage('');

      // Reload comments
      loadComments(project.projectID);
    } catch (err: any) {
      console.error('Comment error:', err.response?.data);
      showNotificationMsg('error', 'Fehler beim Senden des Kommentars');
    }
  };

  // Check URL parameter on component mount
  useEffect(() => {
    const trackingFromUrl = searchParams.get('tracking');
    if (trackingFromUrl) {
      setTrackingNumber(trackingFromUrl);
      loadProjectByTracking(trackingFromUrl);
    }
  }, []);

  const showNotificationMsg = (type: NotificationState['type'], message: string) => {
    setNotification({ show: true, type, message });
  };

  const hideNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      showNotificationMsg('warning', 'Bitte geben Sie eine Tracking-Nummer ein');
      return;
    }

    setSearchParams({ tracking: trackingNumber });
    await loadProjectByTracking(trackingNumber);
  };

  const resetTracking = () => {
    setShowDetails(false);
    setProject(null);
    setTrackingNumber('');
    setError('');
    setComments([]);
    setCommentMessage('');
    setAuthorName('');
    setNotificationEmail('');
    setIsSubscribed(false);
    setShowNotificationForm(false);
    setSearchParams({});
  };

  const getPhaseStatusIcon = (status: string) => {
    if (status === 'Abgeschlossen') return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    if (status === 'In Bearbeitung' || status === 'Warten auf Feedback') return <Clock className="w-5 h-5 text-amber-500" />;
    return <Circle className="w-5 h-5 text-slate-300" />;
  };

  if (!showDetails) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 mb-6">
          <Search className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Projekt-Status verfolgen</h2>
        <p className="text-muted-foreground mb-6">
          Geben Sie Ihre Tracking-Nummer ein
        </p>
        <div className="flex gap-2 w-full max-w-md">
          <Input
            type="text"
            placeholder="z.B. TR-2024-001"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
            className="text-center text-base"
          />
          <Button
            onClick={handleTrack}
            className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white shrink-0"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Verfolgen
          </Button>
        </div>
        {error && (
          <div className="mt-5 max-w-md bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {notification.show && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={hideNotification}
          />
        )}
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Project Overview Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{project.projectName}</h2>
              <p className="text-sm text-muted-foreground mt-1">Tracking-Nr: {project.trackingNumber}</p>
              <p className="text-sm text-muted-foreground">Kunde: {project.customerName}</p>
            </div>
            <div className="flex gap-2 items-center flex-wrap">
              {isSubscribed && (
                <span className="inline-flex items-center gap-1.5 bg-sky-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  <Bell className="w-3.5 h-3.5" />
                  Benachrichtigungen aktiv
                </span>
              )}
              <Badge status={project.status} />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-foreground mb-2">Gesamtfortschritt</h3>
            <ProgressBar progress={project.progress} height="12px" />
          </div>

          {project.description && (
            <div className="mt-5">
              <h3 className="text-sm font-semibold text-foreground mb-2">Projektbeschreibung</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-border">
            <div className="flex justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Startdatum</p>
                <p className="font-semibold text-foreground">{formatDate(project.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enddatum</p>
                <p className="font-semibold text-foreground">{formatDate(project.endDate)}</p>
              </div>
              {project.daysUntilDeadline !== undefined && (
                <div>
                  <p className="text-xs text-muted-foreground">Verbleibende Tage</p>
                  <p className={`font-semibold ${project.daysUntilDeadline < 7 ? 'text-red-500' : 'text-foreground'}`}>
                    {project.daysUntilDeadline} Tage
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases Card */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Projekt-Phasen</h2>
          {project.phases && project.phases.length > 0 ? (
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
              {project.phases.map((phase) => (
                <div key={phase.phaseID} className="relative mb-6 last:mb-0">
                  <div className="absolute -left-8 top-1">
                    {getPhaseStatusIcon(phase.status)}
                  </div>
                  <div className={`p-4 rounded-lg border ${
                    phase.status === 'Abgeschlossen' ? 'bg-emerald-50/50 border-emerald-200' :
                    phase.status === 'In Bearbeitung' || phase.status === 'Warten auf Feedback' ? 'bg-amber-50/50 border-amber-200' :
                    'bg-muted/30 border-border'
                  }`}>
                    <h4 className="font-semibold text-foreground">
                      {getPhaseIcon(phase.status)} {phase.phaseName}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">{phase.description || 'Keine Beschreibung verfügbar'}</p>
                    {phase.completedAt && (
                      <p className="text-xs text-muted-foreground/70 mt-2">Abgeschlossen am {formatDate(phase.completedAt)}</p>
                    )}
                    {phase.startedAt && !phase.completedAt && (
                      <p className="text-xs text-muted-foreground/70 mt-2">Gestartet am {formatDate(phase.startedAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Keine Phasen definiert</p>
          )}
        </CardContent>
      </Card>

      {/* Email Notifications Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5" />
              E-Mail-Benachrichtigungen
            </h2>
            <Button
              variant={showNotificationForm ? 'secondary' : 'default'}
              size="sm"
              className={!showNotificationForm ? 'bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white' : ''}
              onClick={() => setShowNotificationForm(!showNotificationForm)}
            >
              {showNotificationForm ? 'Schließen' : isSubscribed ? 'Verwalten' : 'Aktivieren'}
            </Button>
          </div>

          {showNotificationForm && (
            <div className="p-5 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="mb-4 text-sm text-foreground">
                {isSubscribed
                  ? 'Sie erhalten bereits E-Mail-Benachrichtigungen für dieses Projekt.'
                  : 'Erhalten Sie Updates über neue Kommentare und Fortschritte per E-Mail.'}
              </p>

              <div className="space-y-2 mb-4">
                <Label>Ihre E-Mail-Adresse *</Label>
                <Input
                  type="email"
                  placeholder="z.B. ihre.email@beispiel.de"
                  value={notificationEmail}
                  onChange={(e) => setNotificationEmail(e.target.value)}
                />
              </div>

              <Button
                variant={isSubscribed ? 'secondary' : 'default'}
                className={!isSubscribed ? 'bg-sky-500 hover:bg-sky-600 text-white' : ''}
                onClick={handleToggleNotification}
              >
                {isSubscribed ? <><BellOff className="w-4 h-4 mr-1.5" /> Benachrichtigungen deaktivieren</> : <><Bell className="w-4 h-4 mr-1.5" /> Benachrichtigungen aktivieren</>}
              </Button>
            </div>
          )}

          {!showNotificationForm && isSubscribed && (
            <p className="text-sm text-muted-foreground">
              Aktiv für: <strong>{notificationEmail}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5" />
            Kommentare & Diskussion
          </h2>

          {/* New Comment Form */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 mb-6">
            <h3 className="font-semibold text-foreground mb-4">Neuer Kommentar</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Ihr Name *</Label>
                <Input
                  type="text"
                  placeholder="z.B. Max Mustermann"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Ihre Nachricht *</Label>
                <Textarea
                  placeholder="Teilen Sie uns Ihre Gedanken, Fragen oder Feedback mit..."
                  value={commentMessage}
                  onChange={(e) => setCommentMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button
                className="bg-sky-500 hover:bg-sky-600 text-white"
                onClick={handleSendComment}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Kommentar senden
              </Button>
            </div>
          </div>

          {/* Existing Comments */}
          <div className="mb-6">
            {comments && comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.commentID}
                    className={`p-4 rounded-xl border-l-4 ${
                      comment.authorType === 'Admin'
                        ? 'bg-sky-50 border-l-sky-500'
                        : 'bg-cyan-50 border-l-cyan-500'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white ${
                        comment.authorType === 'Admin' ? 'bg-sky-500' : 'bg-cyan-500'
                      }`}>
                        {comment.authorName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.message}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-muted/30 rounded-lg border-2 border-dashed border-slate-300">
                <MessageSquare className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground mb-1">
                  Noch keine Kommentare vorhanden
                </p>
                <p className="text-sm text-muted-foreground/70">
                  Seien Sie der Erste, der kommentiert!
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-emerald-50 border-l-4 border-l-emerald-500 rounded-lg">
            <p className="text-sm text-sky-700">
              <strong>Hinweis:</strong> Alle Kommentare sind öffentlich sichtbar.
              {isSubscribed && ' Sie erhalten E-Mail-Benachrichtigungen bei neuen Antworten.'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={resetTracking} className="mt-2">
        <ArrowLeft className="w-4 h-4 mr-1.5" />
        Zurück zur Suche
      </Button>

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

export default ProjectTracking;
