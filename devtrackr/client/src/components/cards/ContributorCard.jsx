import React from 'react';
import { formatDate } from '../../utils/dateHelpers';

const ContributorCard = ({ contributor }) => {
  const { _id: username, name, avatarUrl, commits, additions, deletions, lastCommitDate } = contributor;

  return (
    <div className="glass-card glass-card-hover p-6 border border-white/5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={username} className="w-12 h-12 rounded-full border border-white/10" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-white/10 flex items-center justify-center font-headline-sm text-primary">
            {username.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="space-y-1">
          <h4 className="font-outfit text-body-lg font-semibold text-on-surface">{name || username}</h4>
          <p className="text-[12px] text-on-surface-variant font-mono">@{username}</p>
        </div>
      </div>
      
      <div className="text-right space-y-1.5">
        <p className="text-[13px] text-on-surface font-semibold font-mono">{commits} Commits</p>
        <div className="flex gap-2 text-[11px] font-mono justify-end">
          <span className="text-secondary">+{additions}</span>
          <span className="text-error">-{deletions}</span>
        </div>
        <p className="text-[11px] text-on-surface-variant">Last active: {formatDate(lastCommitDate)}</p>
      </div>
    </div>
  );
};

export default ContributorCard;
