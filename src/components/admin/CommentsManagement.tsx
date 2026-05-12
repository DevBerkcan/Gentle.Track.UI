// src/components/admin/CommentsManagement.tsx
import { useState, useEffect } from 'react';
import { commentService } from '../../api/services/commentService';
import { projectService } from '../../api/services/projectService';
import { notificationService } from '../../api/services/notificationService';
import { useAuth } from '../../contexts/AuthContext';
import Notification from '../common/Notification';
import { formatDate } from '../../utils/dateFormatter';
import type { Comment, Project } from '../../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageSquare, Search, Bell, BellOff, Send, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationState { show: boolean; type: 'success' | 'error' | 'warning' | 'info'; message: string; }

interface GroupedComments {
  [projectId: number]: { project: Project; comments: Comment[]; };
}

const CommentsManagement = () => {
  const { admin } = useAuth();
  const [, setProjects] = useState<Project[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [groupedComments, setGroupedComments] = useState<GroupedComments>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [replyingToProject, setReplyingToProject] = useState<number | null>(null);
  const [commentMessages, setCommentMessages] = useState<{ [key: number]: string }>({});
  const [collapsedProjects, setCollapsedProjects] = useState<{ [key: number]: boolean }>({});
  const [subscriptions, setSubscriptions] = useState<{ [key: number]: boolean }>({});
  const [notification, setNotification] = useState<NotificationState>({ show: false, type: 'info', message: '' });

  useEffect(() => { if (admin?.email) loadData(); }, [admin]);

  const loadData = async () => {
    if (!admin?.email) return;
    try {
      setLoading(true);
      const projectsData = await projectService.getAll();
      setProjects(projectsData);
      const allCommentsArrays = await Promise.all(projectsData.map(p => commentService.getProjectComments(p.projectID).catch(() => [])));
      const flatComments = allCommentsArrays.flat();
      setAllComments(flatComments);
      const grouped: GroupedComments = {};
      projectsData.forEach((project, i) => {
        if (allCommentsArrays[i].length > 0) grouped[project.projectID] = { project, comments: allCommentsArrays[i] };
      });
      setGroupedComments(grouped);
      const subscriptionStatuses: { [key: number]: boolean } = {};
      for (const project of projectsData) {
        try { subscriptionStatuses[project.projectID] = await notificationService.isSubscribed(project.projectID, admin.email); }
        catch { subscriptionStatuses[project.projectID] = false; }
      }
      setSubscriptions(subscriptionStatuses);
    } catch {
      showNotification('error', 'Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleNotification = async (projectId: number) => {
    if (!admin?.email) return;
    try {
      const result = await notificationService.toggleAdmin(projectId, admin.email);
      setSubscriptions(prev => ({ ...prev, [projectId]: result.isActive }));
      showNotification('success', result.isActive ? 'E-Mail-Benachrichtigungen aktiviert' : 'E-Mail-Benachrichtigungen deaktiviert');
    } catch { showNotification('error', 'Fehler beim Ändern der Benachrichtigungseinstellungen'); }
  };

  const handleSendComment = async (projectId: number) => {
    const message = commentMessages[projectId];
    if (!message?.trim()) { showNotification('warning', 'Bitte geben Sie eine Nachricht ein'); return; }
    try {
      await commentService.createAdminComment(projectId, message, '');
      showNotification('success', 'Kommentar erfolgreich gesendet!');
      setCommentMessages(prev => ({ ...prev, [projectId]: '' }));
      setReplyingToProject(null);
      loadData();
    } catch { showNotification('error', 'Fehler beim Senden des Kommentars'); }
  };

  const showNotification = (type: NotificationState['type'], message: string) => setNotification({ show: true, type, message });

  const getFilteredComments = () => {
    if (!searchTerm) return groupedComments;
    const filtered: GroupedComments = {};
    const q = searchTerm.toLowerCase();
    Object.entries(groupedComments).forEach(([projectId, data]) => {
      const matchingComments = data.comments.filter((c: { message: string; authorName: string; }) => c.message.toLowerCase().includes(q) || c.authorName.toLowerCase().includes(q) || data.project.projectName.toLowerCase().includes(q));
      if (matchingComments.length > 0) filtered[parseInt(projectId)] = { project: data.project, comments: matchingComments };
    });
    return filtered;
  };

  const filteredComments = getFilteredComments();
  const customerComments = allComments.filter(c => c.authorType === 'Customer').length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm">Kommentare werden geladen…</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Kommentar-Verwaltung</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-md">{allComments.length} gesamt</span>
            <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">{customerComments} von Kunden</span>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Projekt, Autor oder Nachricht…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 text-sm w-64" />
        </div>
      </div>

      {Object.keys(filteredComments).length === 0 ? (
        <Card className="border border-border">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <MessageSquare className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium">{searchTerm ? 'Keine Kommentare gefunden' : 'Noch keine Kommentare vorhanden'}</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(filteredComments).map(([projectId, data]) => {
          const projectIdNum = parseInt(projectId);
          const isReplying = replyingToProject === projectIdNum;
          const isSubscribed = subscriptions[projectIdNum] || false;
          const isCollapsed = collapsedProjects[projectIdNum] || false;

          return (
            <Card key={projectId} className="border border-border shadow-sm overflow-hidden">
              <CardHeader
                className={cn('pb-3 cursor-pointer hover:bg-zinc-50 transition-colors', !isCollapsed && 'border-b border-border')}
                onClick={() => setCollapsedProjects(prev => ({ ...prev, [projectIdNum]: !prev[projectIdNum] }))}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0', isCollapsed && '-rotate-90')} />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{data.project.projectName}</h3>
                      <p className="text-xs text-muted-foreground">
                        {data.project.trackingNumber} · {data.comments.length} Kommentar{data.comments.length !== 1 ? 'e' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant={isSubscribed ? 'default' : 'outline'}
                      className="h-7 text-xs gap-1"
                      onClick={() => handleToggleNotification(projectIdNum)}
                    >
                      {isSubscribed ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                      E-Mail
                    </Button>
                    {!isCollapsed && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setReplyingToProject(isReplying ? null : projectIdNum)}>
                        <Plus className="w-3 h-3 mr-1" />Kommentar
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              {!isCollapsed && (
                <CardContent className="p-4 space-y-3">
                  {isReplying && (
                    <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">Kommentar als Admin hinzufügen</h4>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nachricht *</Label>
                        <Textarea
                          placeholder="Kommentar eingeben…"
                          value={commentMessages[projectIdNum] || ''}
                          onChange={e => setCommentMessages(prev => ({ ...prev, [projectIdNum]: e.target.value }))}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSendComment(projectIdNum)}>
                          <Send className="w-3.5 h-3.5 mr-1.5" />Senden
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setReplyingToProject(null); setCommentMessages(prev => ({ ...prev, [projectIdNum]: '' })); }}>Abbrechen</Button>
                      </div>
                    </div>
                  )}

                  {data.comments.map((comment: Comment) => (
                    <div
                      key={comment.commentID}
                      className={cn(
                        'p-4 rounded-xl border-l-4',
                        comment.authorType === 'Admin'
                          ? 'bg-primary/5 border-l-primary'
                          : 'bg-blue-50/50 border-l-blue-400'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', comment.authorType === 'Admin' ? 'bg-primary' : 'bg-blue-500')}>
                          {comment.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{comment.authorName}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full', comment.authorType === 'Admin' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-700')}>
                          {comment.authorType === 'Admin' ? 'Admin' : 'Kunde'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{comment.message}</p>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          );
        })
      )}

      {notification.show && <Notification type={notification.type} message={notification.message} onClose={() => setNotification(n => ({ ...n, show: false }))} />}
    </div>
  );
};

export default CommentsManagement;
