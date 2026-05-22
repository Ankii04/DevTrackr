import React, { useState, useEffect, useRef } from 'react';
import useAIInsights from '../hooks/useAIInsights';
import { useDashboard } from '../context/DashboardContext';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import { formatDate, timeAgo } from '../utils/dateHelpers';

const AIInsights = () => {
  const { selectedRepo, syncing } = useDashboard();
  const { 
    reports, 
    loading, 
    error: hookError, 
    generateSprintSummary,
    generateCommitInsights,
    generateBottlenecks,
    generatePrioritization
  } = useAIInsights();

  const [activeReportId, setActiveReportId] = useState(null);
  const [generationError, setGenerationError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const activeReport = reports.find(r => r._id === activeReportId) || reports[0];
  const reportViewerRef = useRef(null);

  useEffect(() => {
    if (activeReportId && reportViewerRef.current) {
      if (window.innerWidth < 1024) {
        reportViewerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeReportId]);

  const handleRunReport = async (type) => {
    if (!selectedRepo) return;
    setGenerationError(null);
    setSuccessMsg('');
    try {
      let data;
      if (type === 'sprint') {
        data = await generateSprintSummary();
      } else if (type === 'commits') {
        data = await generateCommitInsights();
      } else if (type === 'bottlenecks') {
        data = await generateBottlenecks();
      } else if (type === 'prioritize') {
        data = await generatePrioritization();
      }
      setSuccessMsg(`AI ${type} Insight Report created successfully!`);
      if (data && data._id) {
        setActiveReportId(data._id);
      }
    } catch (err) {
      setGenerationError(err);
    }
  };

  if (!selectedRepo) {
    return (
      <Layout title="AI Insights">
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
          <div className="p-4 bg-primary-container/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <span className="material-symbols-outlined text-[32px] animate-pulse">psychology</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-md font-bold text-on-surface">AI Insights Engine</h3>
            <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
              Connect or select a GitHub repository to trigger Gemini neural assessments, code bottleneck crawlers, and priority metrics.
            </p>
          </div>
          <div className="pt-2">
            <a 
              href="/repositories" 
              className="bg-primary text-on-primary font-outfit text-[14px] font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all cursor-pointer inline-block"
            >
              Go to Repositories
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // Group reports by type
  const sprints = reports.filter(r => r.reportType === 'sprint');
  const bottlenecks = reports.filter(r => r.reportType === 'bottlenecks');
  const prioritizations = reports.filter(r => r.reportType === 'prioritize');

  return (
    <Layout title="AI Insights Dashboard">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Gemini AI Intelligence Engine
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Leverage Google Gemini 2.0 Flash to evaluate developers' commits, stale PR pipelines, and sprint health for <span className="font-mono text-primary font-medium">@{selectedRepo.fullName}</span>
          </p>
        </div>
      </div>

      {/* Notifications/Alert Banners */}
      {(hookError || generationError) && (
        <div className="bg-error-container/10 border border-error/25 text-error px-4 py-3 rounded-xl font-outfit text-body-md flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">warning</span>
          <span>{generationError || hookError}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-secondary/10 border border-secondary/25 text-secondary px-4 py-3 rounded-xl font-outfit text-body-md flex items-center gap-2 animate-pulse">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Left Side: Report Triggers & Historic List */}
        <div className="space-y-6 lg:col-span-1">
          {/* Action Trigger Panels */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
              AI Command center
            </h3>
            
            <div className="space-y-3 font-outfit">
              {/* Sprint Summary */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">analytics</span>
                    Sprint Executive Summary
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    Evaluate achievements, blockers, recommendations, and calculate sprint health.
                  </p>
                </div>
                <Button 
                  onClick={() => handleRunReport('sprint')} 
                  loading={loading.sprint}
                  disabled={loading.sprint || syncing}
                  className="w-full text-[12px] font-bold bg-primary text-on-primary mt-2"
                >
                  Run Sprint Analysis
                </Button>
              </div>

              {/* Bottlenecks Spotting */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-amber-500 text-[18px]">gpp_maybe</span>
                    Bottleneck Detector
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    Dissect stale Pull Requests, review cycles, and team speed caps.
                  </p>
                </div>
                <Button 
                  onClick={() => handleRunReport('bottlenecks')} 
                  loading={loading.bottlenecks}
                  disabled={loading.bottlenecks || syncing}
                  className="w-full text-[12px] font-bold bg-primary text-on-primary mt-2"
                >
                  Spot Bottlenecks
                </Button>
              </div>

              {/* Prioritization */}
              <div className="bg-surface-container-low p-4 rounded-xl border border-white/5 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-[14px] text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">list_alt</span>
                    Backlog Prioritizer
                  </h4>
                  <p className="text-[12px] text-on-surface-variant mt-1">
                    Examine issue backlogs and classify them by urgency, technical risk, and impact.
                  </p>
                </div>
                <Button 
                  onClick={() => handleRunReport('prioritize')} 
                  loading={loading.prioritize}
                  disabled={loading.prioritize || syncing}
                  className="w-full text-[12px] font-bold bg-primary text-on-primary mt-2"
                >
                  Prioritize Backlog
                </Button>
              </div>
            </div>
          </div>

          {/* Historic reports list */}
          <div className="glass-card p-6 border border-white/5 space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
              Historic Reports ({reports.length})
            </h3>
            
            <div className="space-y-2 font-outfit">
              {reports.map((r) => (
                <div
                  key={r._id}
                  onClick={() => setActiveReportId(r._id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    activeReport?._id === r._id
                      ? 'bg-primary/10 border-primary text-on-surface'
                      : 'bg-surface-container-low border-white/5 text-on-surface-variant hover:bg-surface-container-highest/50'
                  }`}
                >
                  <div className="flex justify-between items-center text-[12px]">
                    <span className="font-bold uppercase tracking-wider font-mono text-[10px] text-primary">{r.reportType}</span>
                    <span className="text-[10px] font-mono text-on-surface-variant">{timeAgo(r.generatedAt)}</span>
                  </div>
                  <p className="text-[12px] truncate font-medium text-on-surface mt-1">{r.content?.summary || 'AI Telemetry Assessment'}</p>
                </div>
              ))}
              {reports.length === 0 && (
                <p className="text-on-surface-variant text-[12px] italic text-center py-4 select-none">No history cached yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Elegant AI Report Viewer */}
        <div ref={reportViewerRef} className="lg:col-span-2 space-y-6">
          {activeReport ? (
            <div className="glass-card p-8 border border-white/5 space-y-6 animate-in fade-in duration-300 font-outfit">
              
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-white/5 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      activeReport.reportType === 'sprint' ? 'success' :
                      activeReport.reportType === 'bottlenecks' ? 'warning' : 'info'
                    }>
                      {activeReport.reportType}
                    </Badge>
                    <h2 className="font-headline-sm text-on-surface font-extrabold capitalize">
                      {activeReport.reportType} report
                    </h2>
                  </div>
                  <p className="text-[12px] text-on-surface-variant font-mono mt-1">
                    Generated on {formatDate(activeReport.generatedAt)}
                  </p>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
                  AI Summary & Decision Context
                </h4>
                <p className="text-body-lg text-on-surface leading-relaxed whitespace-pre-line bg-surface-container-low/40 p-5 rounded-xl border border-white/5">
                  {activeReport.content?.summary}
                </p>
              </div>

              {/* Tab/Type Specific Render Blocks */}
              
              {/* SPRINT TYPE SPECIFIC */}
              {activeReport.reportType === 'sprint' && (
                <div className="space-y-6 border-t border-white/5 pt-5">
                  
                  {activeReport.content?.sprintHealth && (
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] text-on-surface-variant font-mono">Sprint Health Status:</span>
                      <span className={`text-[12px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        activeReport.content.sprintHealth === 'on-track' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                        activeReport.content.sprintHealth === 'at-risk' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {activeReport.content.sprintHealth}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Achievements */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-[14px] text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                        Achievements
                      </h5>
                      <ul className="space-y-2 list-none pl-0">
                        {activeReport.content?.achievements?.map((ach, i) => (
                          <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
                            <span className="text-secondary font-bold">•</span>
                            <span>{ach}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Blockers */}
                    <div className="space-y-3">
                      <h5 className="font-bold text-[14px] text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">gpp_maybe</span>
                        Risks & Blockers
                      </h5>
                      <ul className="space-y-2 list-none pl-0">
                        {activeReport.content?.blockers?.map((blk, i) => (
                          <li key={i} className="flex gap-2 text-body-md text-on-surface-variant">
                            <span className="text-error font-bold">•</span>
                            <span>{blk}</span>
                          </li>
                        ))}
                        {(!activeReport.content?.blockers || activeReport.content.blockers.length === 0) && (
                          <li className="text-on-surface-variant/70 italic text-[13px]">No issues currently blocking the team.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTTLENECK TYPE SPECIFIC */}
              {activeReport.reportType === 'bottlenecks' && (
                <div className="space-y-4 border-t border-white/5 pt-5">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
                    Identified Bottleneck Details & Hotspots
                  </h4>
                  
                  {activeReport.content?.details?.stalePRs && activeReport.content.details.stalePRs.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-bold text-[14px] text-amber-500 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">git_pull_request</span>
                        Stale Pull Requests Needing Review
                      </h5>
                      <div className="bg-surface-container-low rounded-xl border border-white/5 overflow-hidden">
                        <table className="w-full border-collapse text-left text-body-md text-on-surface font-outfit">
                          <thead>
                            <tr className="border-b border-white/5 text-on-surface-variant text-[12px] font-mono uppercase tracking-wider">
                              <th className="py-2.5 px-4">PR #</th>
                              <th className="py-2.5 px-4">Author</th>
                              <th className="py-2.5 px-4 text-center">Idle Duration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {activeReport.content.details.stalePRs.map((pr, i) => (
                              <tr key={i} className="hover:bg-white/[0.01]">
                                <td className="py-2.5 px-4 font-semibold text-primary">PR #{pr.number || i}</td>
                                <td className="py-2.5 px-4 font-mono text-[12px] text-on-surface-variant">@{pr.author || 'unknown'}</td>
                                <td className="py-2.5 px-4 text-center text-red-400 font-mono text-[12px] font-bold">{pr.daysStale || pr.hoursIdle || 'Many'} days</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeReport.content?.details?.hotspots && activeReport.content.details.hotspots.length > 0 && (
                    <div className="space-y-3 mt-4">
                      <h5 className="font-bold text-[14px] text-error flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">campaign</span>
                        High-Volatility Hotspots
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeReport.content.details.hotspots.map((hot, i) => (
                          <div key={i} className="p-3.5 bg-surface-container-low rounded-xl border border-white/5 space-y-1">
                            <span className="text-[12px] font-mono text-primary">#{hot.file || hot.area}</span>
                            <p className="text-[13px] text-on-surface font-semibold">{hot.reason || 'High frequency churn.'}</p>
                            <p className="text-[11px] text-on-surface-variant">Risk Factor: {hot.severity || 'Medium'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PRIORITIZE TYPE SPECIFIC */}
              {activeReport.reportType === 'prioritize' && (
                <div className="space-y-4 border-t border-white/5 pt-5">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
                    AI Prioritized Action Plan & Backlog Matrix
                  </h4>

                  {activeReport.content?.details?.prioritizedBacklog && activeReport.content.details.prioritizedBacklog.length > 0 ? (
                    <div className="space-y-3 font-outfit">
                      {activeReport.content.details.prioritizedBacklog.map((item, i) => (
                        <div key={i} className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-all">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-mono text-primary">#{item.issueId || item.id || i}</span>
                              <h5 className="text-[14px] font-bold text-on-surface">{item.title}</h5>
                            </div>
                            <p className="text-[13px] text-on-surface-variant leading-relaxed">{item.rationale || item.comment}</p>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            <Badge variant={
                              item.priority === 'P0' || item.priority === 'High' ? 'danger' :
                              item.priority === 'P1' || item.priority === 'Medium' ? 'warning' : 'info'
                            }>
                              Priority: {item.priority}
                            </Badge>
                            <Badge variant="neutral">
                              Complexity: {item.effort || 'Medium'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-on-surface-variant text-[13px] italic bg-surface-container-low p-4 rounded-xl border border-white/5 text-center">
                      No issues currently in queue. Backlog is clear!
                    </p>
                  )}
                </div>
              )}

              {/* Recommendations (General Action items at the bottom) */}
              {activeReport.content?.recommendations && activeReport.content.recommendations.length > 0 && (
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
                    Gemini AI Advisory & Recommendations
                  </h4>
                  <ul className="space-y-2 list-none pl-0">
                    {activeReport.content.recommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 bg-surface-container-low/40 p-3.5 rounded-xl border border-white/5 text-body-md text-on-surface-variant items-start">
                        <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">tips_and_updates</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : (
            <div className="glass-card p-12 border border-white/5 text-center space-y-4 py-24 select-none h-full flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-[54px] text-primary/45 animate-bounce">psychology</span>
              <div>
                <h3 className="font-headline-sm text-on-surface font-extrabold">Generate Your First Analysis</h3>
                <p className="font-outfit text-body-md text-on-surface-variant max-w-sm mt-1 mx-auto">
                  Click on one of the analysis tools on the left to consult Google Gemini regarding active codebase productivity metrics.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AIInsights;
