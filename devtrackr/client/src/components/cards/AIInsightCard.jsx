import React from 'react';
import Badge from '../ui/Badge';
import { HEALTH_COLOR_MAP, HEALTH_LABEL_MAP } from '../../utils/constants';
import { formatDate } from '../../utils/dateHelpers';

const AIInsightCard = ({ report, loading = false }) => {
  if (loading) {
    return (
      <div className="glass-card p-6 animate-pulse space-y-4 border border-white/5">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-surface-container-highest rounded w-1/4"></div>
          <div className="h-6 bg-surface-container-highest rounded-full w-20"></div>
        </div>
        <div className="h-4 bg-surface-container-highest rounded w-full"></div>
        <div className="h-4 bg-surface-container-highest rounded w-5/6"></div>
        <div className="space-y-2 pt-4">
          <div className="h-4 bg-surface-container-highest rounded w-1/3"></div>
          <div className="h-3 bg-surface-container-highest rounded w-2/3"></div>
          <div className="h-3 bg-surface-container-highest rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="glass-card p-8 border border-white/5 text-center space-y-3">
        <span className="material-symbols-outlined text-[36px] text-on-surface-variant">psychology</span>
        <h4 className="font-headline-sm text-on-surface">No AI Insights Available</h4>
        <p className="font-body-md text-on-surface-variant max-w-sm mx-auto">
          Synchronize this repository and run an analysis from the AI Analysis panel to generate report summaries.
        </p>
      </div>
    );
  }

  const { content, generatedAt, reportType } = report;
  const healthClass = HEALTH_COLOR_MAP[content.sprintHealth] || HEALTH_COLOR_MAP.unknown;
  const healthLabel = HEALTH_LABEL_MAP[content.sprintHealth] || HEALTH_LABEL_MAP.unknown;

  const reportTypeLabels = {
    sprint: 'Sprint Summary',
    contributor: 'Commit & Code Churn Analysis',
    bottleneck: 'Bottleneck Detection',
    prioritization: 'Backlog Prioritization'
  };

  return (
    <div className="glass-card p-6 border border-white/10 hover:border-white/15 transition-all space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-4">
        <div>
          <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider">
            {reportTypeLabels[reportType] || 'AI Report'}
          </span>
          <p className="text-[12px] text-on-surface-variant font-mono mt-0.5">
            Generated {formatDate(generatedAt)}
          </p>
        </div>
        {content.sprintHealth && (
          <span className={`px-3 py-1 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider ${healthClass}`}>
            Health: {healthLabel}
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Executive Summary</h4>
        <p className="font-body-md text-on-surface leading-relaxed">{content.summary}</p>
      </div>

      {/* Key Insights / Achievements */}
      {content.achievements && content.achievements.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">Achievements & Focus Area</h4>
          <ul className="space-y-2">
            {content.achievements.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">check_circle</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Blockers */}
      {content.blockers && content.blockers.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-label-caps text-label-caps text-error uppercase tracking-widest">Risks & Blockers</h4>
          <ul className="space-y-2">
            {content.blockers.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-error mt-0.5">warning</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {content.recommendations && content.recommendations.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-white/5">
          <h4 className="font-label-caps text-label-caps text-tertiary uppercase tracking-widest text-glow">Actionable Recommendations</h4>
          <ul className="space-y-2.5">
            {content.recommendations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-body-md text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] text-tertiary mt-0.5">lightbulb</span>
                <span className="text-on-surface italic">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AIInsightCard;
