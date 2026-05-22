import React from 'react';
import Badge from '../ui/Badge';
import { formatDate } from '../../utils/dateHelpers';

const SprintSummaryCard = ({ repository }) => {
  if (!repository) return null;

  const { name, fullName, language, lastSyncedAt, stats, syncStatus } = repository;

  return (
    <div className="glass-card p-6 border border-white/10 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <Badge variant={language !== 'Unknown' ? 'info' : 'neutral'}>{language}</Badge>
          <h3 className="font-headline-md text-headline-sm text-on-surface font-bold mt-1.5">{name}</h3>
          <p className="font-mono text-[12px] text-on-surface-variant">@{fullName}</p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold tracking-wider font-mono uppercase ${
            syncStatus === 'completed' ? 'bg-secondary/15 text-secondary' : 
            syncStatus === 'syncing' ? 'bg-primary/15 text-primary animate-pulse' :
            'bg-surface-container-highest text-on-surface-variant'
          }`}>
            {syncStatus}
          </span>
          <p className="text-[11px] text-on-surface-variant font-mono mt-2">
            Last synced: {formatDate(lastSyncedAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5 font-mono text-center">
        <div className="space-y-1">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Total Commits</p>
          <h4 className="text-[20px] font-bold text-on-surface">{stats?.totalCommits || 0}</h4>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Open PRs</p>
          <h4 className="text-[20px] font-bold text-primary">{stats?.openPRs || 0}</h4>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Closed PRs</p>
          <h4 className="text-[20px] font-bold text-on-surface-variant">{stats?.closedPRs || 0}</h4>
        </div>
        <div className="space-y-1">
          <p className="text-[11px] text-on-surface-variant uppercase tracking-wider">Open Issues</p>
          <h4 className="text-[20px] font-bold text-tertiary">{stats?.openIssues || 0}</h4>
        </div>
      </div>
    </div>
  );
};

export default SprintSummaryCard;
