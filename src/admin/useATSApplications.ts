import React, { useState, useEffect } from 'react';
import type { ATSApplication, ATSNoteEntry } from './types';

export function useATSApplications(backendApiOrigin: string) {
  const [applications, setApplications] = useState<ATSApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<ATSApplication | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState<boolean>(false);
  const [atsNotes, setAtsNotes] = useState<ATSNoteEntry[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [liveConnected, setLiveConnected] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const clearStaffSession = (message?: string) => {
    setAuthToken(null);
    setAuthRole(null);
    setAuthPassword('');
    setApplications([]);
    setSelectedApp(null);
    setSelectedIds([]);
    setAtsNotes([]);
    setLiveConnected(false);
    setLastSyncTime(null);
    setAuthError(message || null);
  };

  const fetchLiveApplications = async () => {
    if (!authToken) return;

    setIsLoadingLive(true);
    setLiveError(null);
    try {
      const response = await fetch(`${backendApiOrigin}/api/admin/ats/applications`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (response.status === 401) {
        clearStaffSession('Your session expired. Sign in again.');
        return;
      }
      if (response.ok) {
        const json = await response.json();
        const records = json.data || (Array.isArray(json) ? json : null);
        if (Array.isArray(records)) {
          setApplications(records);
          setLiveConnected(true);
          setLastSyncTime(new Date().toLocaleTimeString());
          if (records.length === 0) {
            setSelectedApp(null);
            setSelectedIds([]);
          } else if (!selectedApp || !records.find((r: ATSApplication) => r.id === selectedApp.id)) {
            setSelectedApp(records[0]);
          }
        } else {
          setLiveConnected(true);
        }
      } else {
        setLiveError(`Unable to load applications (HTTP ${response.status}).`);
        setLiveConnected(false);
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to load applications.');
      setLiveConnected(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchLiveApplications();
  }, [authToken]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!selectedApp) {
        setAtsNotes([]);
        return;
      }
      if (!authToken) {
        setAtsNotes(
          selectedApp.interview_notes
            ? [
                {
                  id: 'seed-note',
                  author_name: selectedApp.recruiter_assigned || 'Recruiter',
                  note: selectedApp.interview_notes,
                  created_at: selectedApp.created_at || new Date().toISOString(),
                },
              ]
            : []
        );
        return;
      }
      setIsLoadingNotes(true);
      try {
        const res = await fetch(`${backendApiOrigin}/api/admin/ats/applications/${selectedApp.id}/notes`, {
          headers: { Accept: 'application/json', Authorization: `Bearer ${authToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.data)) {
            setAtsNotes(json.data);
          }
        }
      } catch {
        // ignore transient network errors
      } finally {
        setIsLoadingNotes(false);
      }
    };
    fetchNotes();
  }, [selectedApp?.id, authToken]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const response = await fetch(`${backendApiOrigin}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || 'Staff sign-in failed.');
      }
      const { access_token: token, role } = result.data || {};
      if (typeof token !== 'string' || typeof role !== 'string') {
        throw new Error('The authentication service returned an invalid response.');
      }
      setAuthToken(token);
      setAuthRole(role);
      setAuthPassword('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Staff sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = () => {
    clearStaffSession();
    setLiveError(null);
  };

  const handleStatusChange = async (appId: string, newStatus: string, rejectionReason?: string) => {
    const nextReason = newStatus === 'rejected' ? rejectionReason || undefined : undefined;
    setApplications((prev) =>
      prev.map((item) =>
        item.id === appId
          ? { ...item, application_status: newStatus, status: newStatus, rejection_reason: nextReason }
          : item
      )
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp((prev) =>
        prev ? { ...prev, application_status: newStatus, status: newStatus, rejection_reason: nextReason } : null
      );
    }

    if (!authToken) return;

    try {
      const payload: Record<string, string> = { application_status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }
      const response = await fetch(`${backendApiOrigin}/api/admin/ats/applications/${appId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        clearStaffSession('Your session expired. Sign in again.');
        return;
      }
      if (!response.ok) setLiveError(`Unable to update the application (HTTP ${response.status}).`);
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to update the application.');
    }
  };

  const toggleSelectId = (appId: string) => {
    setSelectedIds((prev) => (prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]));
  };

  const toggleSelectAll = (visibleIds: string[]) => {
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;

    const targetIds = [...selectedIds];
    setApplications((prev) =>
      prev.map((item) =>
        targetIds.includes(item.id) ? { ...item, application_status: newStatus, status: newStatus } : item
      )
    );
    if (selectedApp && targetIds.includes(selectedApp.id)) {
      setSelectedApp((prev) => (prev ? { ...prev, application_status: newStatus, status: newStatus } : null));
    }
    setSelectedIds([]);

    if (!authToken) return;

    setIsBulkUpdating(true);
    try {
      const response = await fetch(`${backendApiOrigin}/api/admin/ats/applications/bulk-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          application_ids: targetIds,
          application_status: newStatus,
        }),
      });
      if (response.status === 401) {
        clearStaffSession('Your session expired. Sign in again.');
        return;
      }
      if (!response.ok) {
        setLiveError(`Unable to bulk update applications (HTTP ${response.status}).`);
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to bulk update applications.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleAddNote = async (rawNoteText: string, noteTopic: string): Promise<boolean> => {
    if (!rawNoteText.trim() || !selectedApp) return false;

    const rawNote = rawNoteText.trim();
    const note = noteTopic !== 'General' ? `[${noteTopic}] ${rawNote}` : rawNote;
    const author = authEmail || 'Recruiter Admin';
    const optimistic: ATSNoteEntry = {
      id: `local-${Date.now()}`,
      author_name: author,
      note,
      created_at: new Date().toISOString(),
    };
    setAtsNotes((prev) => [optimistic, ...prev]);
    setApplications((prev) =>
      prev.map((item) =>
        item.id === selectedApp.id
          ? {
              ...item,
              interview_notes: note,
              notes_count: (item.notes_count || 0) + 1,
            }
          : item
      )
    );
    setSelectedApp((prev) =>
      prev ? { ...prev, interview_notes: note, notes_count: (prev.notes_count || 0) + 1 } : null
    );

    if (!authToken) return true;

    try {
      const response = await fetch(`${backendApiOrigin}/api/admin/ats/applications/${selectedApp.id}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          author_name: author,
          note,
        }),
      });
      if (response.status === 401) {
        clearStaffSession('Your session expired. Sign in again.');
        return true;
      }
      if (response.ok) {
        const json = await response.json();
        if (json?.data) {
          setAtsNotes((prev) => [json.data, ...prev.filter((n) => n.id !== optimistic.id)]);
        }
      } else {
        setLiveError(`Unable to save the note (HTTP ${response.status}).`);
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to save the note.');
    }
    return true;
  };

  const handleQuickContactLog = async (
    appId: string,
    channel: 'whatsapp' | 'phone' | 'email' | 'manual',
    outcome?: string
  ) => {
    const nowIso = new Date().toISOString();
    const outcomeText = outcome?.trim() || 'Outreach initiated';

    setApplications((prev) =>
      prev.map((item) =>
        item.id === appId
          ? {
              ...item,
              last_contacted_at: nowIso,
              last_contact_channel: channel,
              last_contact_outcome: outcomeText,
              notes_count: outcome ? (item.notes_count || 0) + 1 : item.notes_count,
            }
          : item
      )
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp((prev) =>
        prev
          ? {
              ...prev,
              last_contacted_at: nowIso,
              last_contact_channel: channel,
              last_contact_outcome: outcomeText,
              notes_count: outcome ? (prev.notes_count || 0) + 1 : prev.notes_count,
            }
          : null
      );
    }

    if (!authToken) return;

    try {
      const response = await fetch(`${backendApiOrigin}/api/admin/ats/applications/${appId}/contact-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          channel,
          outcome: outcome || null,
          author_name: authEmail || 'Recruiter Admin',
        }),
      });
      if (response.status === 401) {
        clearStaffSession('Your session expired. Sign in again.');
        return;
      }
      if (!response.ok) {
        setLiveError(`Unable to log contact (HTTP ${response.status}).`);
      }
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Unable to log contact.');
    }
  };

  return {
    applications,
    selectedApp,
    setSelectedApp,
    selectedIds,
    setSelectedIds,
    isBulkUpdating,
    atsNotes,
    isLoadingNotes,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authToken,
    authRole,
    authError,
    liveError,
    isSigningIn,
    isLoadingLive,
    liveConnected,
    lastSyncTime,
    fetchLiveApplications,
    handleLogin,
    handleLogout,
    handleStatusChange,
    toggleSelectId,
    toggleSelectAll,
    handleBulkStatusChange,
    handleAddNote,
    handleQuickContactLog,
  };
}
