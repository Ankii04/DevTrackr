import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import Layout from '../components/layout/Layout';
import StatCard from '../components/cards/StatCard';
import AIInsightCard from '../components/cards/AIInsightCard';
import CommitFrequencyChart from '../components/charts/CommitFrequencyChart';
import PRStatusChart from '../components/charts/PRStatusChart';
import ContributorActivityChart from '../components/charts/ContributorActivityChart';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import { exportDashboardToPDF } from '../utils/exportPDF';

const Dashboard = () => {
  const { 
    selectedRepo, 
    analyticsData, 
    aiReports, 
    syncing, 
    analyticsLoading,
    syncActiveRepo
  } = useDashboard();

  const [exporting, setExporting] = useState(false);

  // Retrieve latest generated sprint summary report
  const latestSprintReport = aiReports.find(r => r.reportType === 'sprint');

  const handleExportPDF = async () => {
    if (!selectedRepo) return;
    setExporting(true);
    try {
      await exportDashboardToPDF('dashboard-grid', {
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

  // If no repository is linked/selected
  if (!selectedRepo) {
    return (
      <Layout title="Dashboard">
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-12">
          <div className="p-4 bg-primary-container/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <span className="material-symbols-outlined text-[32px] animate-pulse">rocket_launch</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-md font-bold text-on-surface">Connect your workspace</h3>
            <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
              Before we can build your developer productivity dashboard, you must connect a GitHub repository in the Repositories panel.
            </p>
          </div>
          <div className="pt-2">
            <a 
              href="/repositories" 
              className="bg-primary text-on-primary font-outfit text-[14px] font-bold px-6 py-3 rounded-lg hover:bg-primary/90 transition-all cursor-pointer inline-block shadow-lg shadow-primary/10"
            >
              Go to Repositories
            </a>
          </div>
        </div>
      </Layout>
    );
  }

  // If currently syncing in the background for the first time
  if (selectedRepo.syncStatus === 'syncing' && analyticsData.commits.length === 0) {
    return (
      <Layout title="Dashboard">
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-12 animate-pulse">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-[24px]">sync</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-sm font-bold text-on-surface">Synchronizing Repository Data</h3>
            <p className="font-outfit text-body-md text-on-surface-variant">
              We are currently running our background sync pipeline crawling commits, pull requests, and stats from the GitHub REST API. This will take a moment.
            </p>
          </div>
          <div className="text-[12px] font-mono text-primary bg-primary-container/10 py-1.5 px-3 rounded-lg inline-block border border-primary/15">
            Syncing: {selectedRepo.fullName}
          </div>
        </div>
      </Layout>
    );
  }

  const commitsCount = selectedRepo.stats?.totalCommits || 0;
  const velocityCount = analyticsData.velocity[3]?.commits || 0;
  const prsCount = (selectedRepo.stats?.openPRs || 0) + (selectedRepo.stats?.closedPRs || 0);
  const activeContributorsCount = selectedRepo.stats?.contributorsCount || 0;

  return (
    <Layout title="Dashboard">
      {/* Top Section Headers */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Repository Performance Overview
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Visual productivity metrics for <span className="font-mono text-primary font-medium">@{selectedRepo.fullName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={exporting || syncing}
            loading={exporting}
            className="flex items-center gap-1.5 text-[12px]"
          >
            <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
            <span>Export Report PDF</span>
          </Button>
        </div>
      </div>

      {/* Sync Warning Banner if failure occurs */}
      {selectedRepo.syncStatus === 'failed' && (
        <div className="bg-error-container/15 border border-error/20 text-error p-4 rounded-xl flex items-center justify-between gap-4 font-outfit">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">warning</span>
            <div>
              <p className="font-bold text-[14px]">Synchronization failed</p>
              <p className="text-[12px] text-on-surface-variant">{selectedRepo.syncError || 'Unknown crawler glitch.'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={syncActiveRepo} className="!py-1.5 !px-3 text-[12px] border-error/30 text-error hover:bg-error-container/20">
            Retry Sync
          </Button>
        </div>
      )}

      {/* Data Visualization Grid for PDF Capture */}
      <div id="dashboard-grid" className="space-y-gutter p-2 rounded-xl">
        
        {/* Metric Cards Row */}
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
              title="Total Commits" 
              value={commitsCount} 
              icon="inventory_2"
              color="blue"
            />
            <StatCard 
              title="Sprint Velocity" 
              value={`${velocityCount} commits`} 
              icon="speed"
              color="green"
            />
            <StatCard 
              title="Linked Pull Requests" 
              value={prsCount} 
              icon="call_merge"
              color="amber"
            />
            <StatCard 
              title="Active Contribs" 
              value={activeContributorsCount} 
              icon="groups"
              color="red"
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Commit Frequency Area Chart */}
          <div className="glass-card p-6 border border-white/5 lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                Commit Frequency (Project Timeline)
              </h4>
            </div>
            {analyticsLoading ? <Loader variant="chart" /> : <CommitFrequencyChart data={analyticsData.commits} />}
          </div>

          {/* PR Distribution Donut Chart */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
              Pull Request Distribution
            </h4>
            {analyticsLoading ? <Loader variant="chart" /> : <PRStatusChart prStats={analyticsData.prs} />}
          </div>
        </div>

        {/* Bottom Section: AI Insight + Contributor Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Executive AI insight block */}
          <div className="lg:col-span-2">
            {latestSprintReport ? (
              <AIInsightCard report={latestSprintReport} loading={analyticsLoading} />
            ) : (
              <div className="glass-card p-8 border border-white/5 text-center space-y-4 h-full flex flex-col justify-center items-center">
                <span className="material-symbols-outlined text-[40px] text-primary animate-pulse">psychology</span>
                <div>
                  <h4 className="font-headline-sm text-on-surface font-bold">No AI sprint report cached</h4>
                  <p className="font-outfit text-body-md text-on-surface-variant max-w-sm mt-1">
                    Generate your first premium AI sprint analysis report targeting active Git metrics!
                  </p>
                </div>
                <a 
                  href="/insights" 
                  className="bg-primary-container text-on-primary-container font-outfit text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-primary-container/90 transition-colors inline-block"
                >
                  Generate AI Analysis
                </a>
              </div>
            )}
          </div>

          {/* Contributor stacked additions/deletions */}
          <div className="glass-card p-6 border border-white/5 space-y-4">
            <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
              Contributor Activity (Top 5 Pushes)
            </h4>
            {analyticsLoading ? (
              <Loader variant="chart" />
            ) : (
              <ContributorActivityChart contributors={analyticsData.contributors.active} />
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
