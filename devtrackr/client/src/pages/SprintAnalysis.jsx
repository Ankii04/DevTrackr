import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Layout from '../components/layout/Layout';
import StatCard from '../components/cards/StatCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import SprintSummaryCard from '../components/cards/SprintSummaryCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { exportDashboardToPDF } from '../utils/exportPDF';

const SprintAnalysis = () => {
  const { 
    selectedRepo, 
    analyticsData, 
    aiReports, 
    analyticsLoading,
    syncing
  } = useDashboard();

  const [exporting, setExporting] = useState(false);

  // Filter out sprint reports
  const sprintReports = aiReports.filter(r => r.reportType === 'sprint');
  const latestSprintReport = sprintReports[0];

  const handleExportPDF = async () => {
    if (!selectedRepo) return;
    setExporting(true);
    try {
      await exportDashboardToPDF('sprint-grid', {
        repoName: selectedRepo.fullName,
        language: selectedRepo.language,
        aiSummary: latestSprintReport?.content?.summary || '',
        sprintHealth: latestSprintReport?.content?.sprintHealth || '',
        recommendations: latestSprintReport?.content?.recommendations || []
      });
    } catch (error) {
      alert(`Export failed: ${error.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (!selectedRepo) {
    return (
      <Layout title="Sprint Analysis">
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
          <div className="p-4 bg-primary-container/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <span className="material-symbols-outlined text-[32px] animate-pulse">rocket_launch</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-md font-bold text-on-surface">Connect repository</h3>
            <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
              Link or select a repository to evaluate sprint velocities, code health milestones, and achievements.
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

  // Calculate metrics
  const totalCommitsInSprint = analyticsData.velocity.reduce((acc, curr) => acc + curr.commits, 0);
  const avgWeeklyCommits = analyticsData.velocity.length > 0 
    ? parseFloat((totalCommitsInSprint / analyticsData.velocity.length).toFixed(1))
    : 0;
  
  const sprintHealth = latestSprintReport?.content?.sprintHealth || 'idle';

  return (
    <Layout title="Sprint Analysis">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Sprint Velocity & Health
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Track coding cycles and team achievements for <span className="font-mono text-primary font-medium">@{selectedRepo.fullName}</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={exporting || syncing}
          loading={exporting}
          className="flex items-center gap-1.5 text-[12px]"
        >
          <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
          <span>Export Sprint PDF</span>
        </Button>
      </div>

      {/* Grid wrapper */}
      <div id="sprint-grid" className="space-y-gutter p-2 rounded-xl">
        
        {/* KPI Cards Row */}
        {analyticsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Loader variant="card" />
            <Loader variant="card" />
            <Loader variant="card" />
            <Loader variant="card" />
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Sprint Commits" 
              value={totalCommitsInSprint} 
              icon="assessment"
              color="blue"
            />
            <StatCard 
              title="Weekly Velocity" 
              value={`${avgWeeklyCommits} / wk`} 
              icon="speed"
              color="green"
            />
            <StatCard 
              title="Sprint Health" 
              value={sprintHealth.toUpperCase()} 
              icon="favorite"
              color={
                sprintHealth === 'on-track' ? 'green' :
                sprintHealth === 'at-risk' ? 'amber' :
                sprintHealth === 'blocked' ? 'red' : 'blue'
              }
            />
            <StatCard 
              title="Linked Pull Requests" 
              value={analyticsData.prs?.total || 0} 
              icon="git_pull_request"
              color="amber"
            />
          </div>
        )}

        {/* Charts and reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Velocity chart */}
          <div className="glass-card p-6 border border-white/5 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                Weekly Velocity Commit Output (4 Weeks)
              </h4>
            </div>
            
            {analyticsLoading ? (
              <Loader variant="chart" />
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.velocity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis 
                      dataKey="week" 
                      stroke="#8c909f" 
                      fontFamily="Outfit"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#8c909f"
                      fontFamily="JetBrains Mono"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}
                      labelStyle={{ color: '#dce2f3', fontFamily: 'Outfit', fontWeight: 'bold' }}
                      itemStyle={{ color: '#adc6ff', fontFamily: 'Outfit' }}
                      cursor={{ fill: 'rgba(173, 198, 255, 0.02)' }}
                    />
                    <Bar 
                      dataKey="commits" 
                      fill="#4a8eff" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={45} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* AI Sprint Health report */}
          <div>
            {latestSprintReport ? (
              <SprintSummaryCard report={latestSprintReport} />
            ) : (
              <div className="glass-card p-8 border border-white/5 text-center space-y-4 h-full flex flex-col justify-center items-center select-none py-12">
                <span className="material-symbols-outlined text-[44px] text-primary animate-pulse">analytics</span>
                <div>
                  <h4 className="font-headline-sm text-on-surface font-bold">No cached sprint report</h4>
                  <p className="font-outfit text-body-md text-on-surface-variant max-w-sm mt-1">
                    To populate advanced health metrics, blockers, and achievements, trigger a Gemini AI sprint analysis in the AI Insights section.
                  </p>
                </div>
                <a 
                  href="/insights" 
                  className="bg-primary-container text-on-primary-container font-outfit text-[12px] font-bold px-4 py-2.5 rounded-lg hover:bg-primary-container/90 transition-colors inline-block"
                >
                  Generate AI Insights
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Sprint Achievements & Blocker section */}
        {latestSprintReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter animate-in fade-in duration-300">
            {/* Achievements */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">emoji_events</span>
                <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest font-bold">
                  Sprint Achievements
                </h4>
              </div>
              <ul className="space-y-2.5 text-body-md text-on-surface-variant font-outfit list-none pl-0">
                {latestSprintReport.content?.achievements?.map((ach, i) => (
                  <tr key={i} className="flex gap-2.5 items-start">
                    <td className="mt-1 text-secondary text-[16px] font-bold">•</td>
                    <td>{ach}</td>
                  </tr>
                ))}
                {(!latestSprintReport.content?.achievements || latestSprintReport.content.achievements.length === 0) && (
                  <p className="text-on-surface-variant text-[13px] italic">No specific achievements reported.</p>
                )}
              </ul>
            </div>

            {/* Blockers / Risks */}
            <div className="glass-card p-6 border border-white/5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error">gpp_maybe</span>
                <h4 className="font-label-caps text-label-caps text-on-surface uppercase tracking-widest font-bold">
                  Identified Risks & Blockers
                </h4>
              </div>
              <ul className="space-y-2.5 text-body-md text-on-surface-variant font-outfit list-none pl-0">
                {latestSprintReport.content?.blockers?.map((blk, i) => (
                  <tr key={i} className="flex gap-2.5 items-start">
                    <td className="mt-1 text-error text-[16px] font-bold">•</td>
                    <td>{blk}</td>
                  </tr>
                ))}
                {(!latestSprintReport.content?.blockers || latestSprintReport.content.blockers.length === 0) && (
                  <p className="text-secondary text-[13px] italic">Zero blockers identified. Sprint is running smoothly!</p>
                )}
              </ul>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default SprintAnalysis;
