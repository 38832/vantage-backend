/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, LayoutDashboard, Lock, RefreshCw } from 'lucide-react';
import { ATSFilters } from './admin/ATSFilters';
import { ATSKpiAndFunnel } from './admin/ATSKpiAndFunnel';
import { ATSTable } from './admin/ATSTable';
import { CandidateDetailPanel } from './admin/CandidateDetailPanel';
import { exportCandidatesToFile, filterAndSortApplications } from './admin/atsUtils';
import type { ATSApplication, ATSNoteEntry, SortOption } from './admin/types';
import { useATSApplications } from './admin/useATSApplications';

export type { ATSApplication, ATSNoteEntry };

export function AdminDashboardView({ onCopy }: { onCopy: (text: string) => void; copiedSnippet: boolean }) {
  const backendApiOrigin = 'http://localhost:8000';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const adminUiLink = `${origin}/#admin`;
  const backendApiDashboardLink = `${backendApiOrigin}/api/admin/dashboard`;
  const backendApiAtsLink = `${backendApiOrigin}/api/admin/ats/applications`;
  const swaggerDocsLink = `${backendApiOrigin}/docs`;

  const {
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
  } = useATSApplications(backendApiOrigin);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tradeFilter, setTradeFilter] = useState('');
  const [minExperienceFilter, setMinExperienceFilter] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [passportFilter, setPassportFilter] = useState('');
  const [attentionOnlyFilter, setAttentionOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [bulkStatusTarget, setBulkStatusTarget] = useState<string>('shortlisted');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const handleCopyLink = (link: string, id: string) => {
    onCopy(link);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const resetFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setTradeFilter('');
    setMinExperienceFilter('');
    setDestinationFilter('');
    setPassportFilter('');
    setAttentionOnlyFilter(false);
    setSortBy('date_desc');
  };

  const filteredApps = filterAndSortApplications(applications, {
    statusFilter,
    searchQuery,
    tradeFilter,
    minExperienceFilter,
    destinationFilter,
    passportFilter,
    attentionOnlyFilter,
    sortBy,
  });

  const handleExportCandidates = (format: 'csv' | 'excel') => {
    exportCandidatesToFile(filteredApps, selectedIds, format);
  };

  return (
    <div className="space-y-8">
      {/* Direct Links Master Card */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-500/40">
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span>Candidate Applications & Deployment Status</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">Recruiter ATS Command Center</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Live overseas recruitment pipeline, real candidate verification, Supabase Storage CV downloads, and WhatsApp outreach.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchLiveApplications}
              disabled={!authToken || isLoadingLive}
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold px-3.5 py-2 rounded-xl text-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
              <span>{isLoadingLive ? 'Syncing...' : 'Sync Live Backend'}</span>
            </button>
            <a
              href={swaggerDocsLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold px-3.5 py-2 rounded-xl text-xs transition"
            >
              <span>Swagger API Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {!authToken && (
          <form onSubmit={handleLogin} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-[11px] text-slate-400">
              Staff email
              <input
                type="email"
                autoComplete="username"
                required
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </label>
            <label className="flex min-w-48 flex-1 flex-col gap-1 text-[11px] text-slate-400">
              Password
              <input
                type="password"
                autoComplete="current-password"
                required
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              />
            </label>
            <button
              type="submit"
              disabled={isSigningIn}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? 'Signing in...' : 'Sign in'}
            </button>
            {authError && (
              <p role="alert" className="w-full text-xs text-rose-400">
                {authError}
              </p>
            )}
          </form>
        )}

        {/* Sync Status & RBAC Security Banner */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${liveConnected ? 'bg-emerald-400 shadow-md shadow-emerald-400/50' : 'bg-amber-400'}`} />
              <span className="text-slate-300 font-medium">
                {liveConnected ? (
                  <>
                    Connected to FastAPI (<code className="text-cyan-400">http://localhost:8000/api/admin/ats/applications</code>)
                  </>
                ) : isLoadingLive ? (
                  <>Loading live applications from FastAPI...</>
                ) : (
                  <>
                    Not connected (Sign in above and run <code className="text-amber-400">uvicorn app.main:app --port 8000 --reload</code> for live data)
                  </>
                )}
              </span>
            </div>

            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{authToken ? `RBAC Protected: JWT (${(authRole || '').toUpperCase()})` : 'Authentication required for live admin data'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
            {lastSyncTime && <span>Last Synced: {lastSyncTime}</span>}
            {authToken && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 transition"
              >
                <span>Sign out</span>
              </button>
            )}
          </div>
        </div>

        {liveError && (
          <p role="alert" className="mt-2 text-xs text-rose-400">
            {liveError}
          </p>
        )}

        {/* Link Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
          {[
            { id: 'ui', title: 'Web Admin URL', badge: 'Frontend UI', badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', url: adminUiLink, urlClass: 'text-amber-400 line-clamp-2', copyLabel: 'Copy UI Link' },
            { id: 'api_dash', title: 'ATS KPI API', badge: 'GET /api/admin', badgeClass: 'bg-blue-500/10 text-cyan-400 border-blue-500/30', url: backendApiDashboardLink, urlClass: 'text-cyan-400', copyLabel: 'Copy Endpoint' },
            { id: 'api_ats', title: 'Applications API', badge: 'Candidate Data', badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30', url: backendApiAtsLink, urlClass: 'text-purple-300', copyLabel: 'Copy Endpoint' },
            { id: 'docs', title: 'Interactive Docs', badge: 'OpenAPI Spec', badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30', url: swaggerDocsLink, urlClass: 'text-amber-300', copyLabel: 'Copy URL' },
          ].map((card) => (
            <div key={card.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>{card.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${card.badgeClass}`}>{card.badge}</span>
                </div>
                <p className={`text-xs font-mono mt-1 break-all ${card.urlClass}`}>{card.url}</p>
              </div>
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-900">
                <button
                  onClick={() => handleCopyLink(card.url, card.id)}
                  className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[11px] font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition"
                >
                  {copiedLink === card.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedLink === card.id ? 'Copied' : card.copyLabel}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ATSKpiAndFunnel
        applications={applications}
        onSelectStatusFilter={setStatusFilter}
        onSelectTradeFilter={setTradeFilter}
        onSelectDestinationFilter={setDestinationFilter}
      />

      <ATSFilters
        applications={applications}
        filteredCount={filteredApps.length}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        tradeFilter={tradeFilter}
        setTradeFilter={setTradeFilter}
        minExperienceFilter={minExperienceFilter}
        setMinExperienceFilter={setMinExperienceFilter}
        destinationFilter={destinationFilter}
        setDestinationFilter={setDestinationFilter}
        passportFilter={passportFilter}
        setPassportFilter={setPassportFilter}
        attentionOnlyFilter={attentionOnlyFilter}
        setAttentionOnlyFilter={setAttentionOnlyFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onResetFilters={resetFilters}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <ATSTable
          applicationsCount={applications.length}
          filteredApps={filteredApps}
          selectedApp={selectedApp}
          selectedIds={selectedIds}
          bulkStatusTarget={bulkStatusTarget}
          setBulkStatusTarget={setBulkStatusTarget}
          isBulkUpdating={isBulkUpdating}
          isLoadingLive={isLoadingLive}
          authToken={authToken}
          liveError={liveError}
          onRetryFetch={fetchLiveApplications}
          onSelectApp={setSelectedApp}
          onToggleSelectId={toggleSelectId}
          onToggleSelectAll={toggleSelectAll}
          onClearSelection={() => setSelectedIds([])}
          onBulkStatusChange={handleBulkStatusChange}
          onStatusChange={handleStatusChange}
          onQuickContactLog={handleQuickContactLog}
          onExportCandidates={handleExportCandidates}
        />

        <CandidateDetailPanel
          selectedApp={selectedApp}
          atsNotes={atsNotes}
          isLoadingNotes={isLoadingNotes}
          onStatusChange={handleStatusChange}
          onQuickContactLog={handleQuickContactLog}
          onAddNote={handleAddNote}
        />
      </div>
    </div>
  );
}
