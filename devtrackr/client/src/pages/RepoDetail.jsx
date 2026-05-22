import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import StatCard from '../components/cards/StatCard';
import CommitFrequencyChart from '../components/charts/CommitFrequencyChart';
import PRStatusChart from '../components/charts/PRStatusChart';
import IssueResolutionChart from '../components/charts/IssueResolutionChart';
import * as analyticsApi from '../api/analyticsApi';
import * as aiApi from '../api/aiApi';
import { formatDate, timeAgo } from '../utils/dateHelpers';

const RepoDetail = () => {
  const { id } = useParams();
  const { repos, syncing, syncActiveRepo } = useDashboard();
  const [repo, setRepo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState({ active: [], inactive: [] });
  const [prs, setPrs] = useState(null);
  const [issues, setIssues] = useState(null);
  const [rawCommits, setRawCommits] = useState([]);
  const [rawPrs, setRawPrs] = useState([]);
  const [aiReports, setAiReports] = useState([]);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiReportType, setAiReportType] = useState('sprint');
  const [error, setError] = useState('');

  useEffect(() => {
    if (repos.length > 0) {
      const found = repos.find(r => r._id === id);
      if (found) {
        setRepo(found);
      }
    }
  }, [repos, id]);

  const fetchRepoData = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [
        commitFreq,
        contribs,
        prStats,
        issueStats,
        commitsList,
        prsList,
        reports
      ] = await Promise.all([
        analyticsApi.getCommits(id),
        analyticsApi.getContributors(id),
        analyticsApi.getPRs(id),
        analyticsApi.getIssues(id),
        analyticsApi.getRawCommits(id),
        analyticsApi.getRawPRs(id),
        aiApi.getAIReports(id)
      ]);

      setCommits(commitFreq);
      setContributors(contribs);
      setPrs(prStats);
      setIssues(issueStats);
      setRawCommits(commitsList);
      setRawPrs(prsList);
      setAiReports(reports);
    } catch (err) {
      console.error('[REPO DETAIL] Data fetch failed:', err);
      setError('Could not retrieve repository analytics. Ensure repository sync has completed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (repo && repo.syncStatus !== 'syncing') {
      fetchRepoData();
    }
  }, [repo]);

  const handleSync = async () => {
    try {
      await syncActiveRepo();
    } catch (err) {
      alert(`Sync failed: ${err}`);
    }
  };

  const handleGenerateAIReport = async () => {
    setGeneratingAi(true);
    try {
      let data;
      if (aiReportType === 'sprint') {
        data = await aiApi.generateSprintSummary(id);
      } else if (aiReportType === 'bottlenecks') {
        data = await aiApi.generateBottlenecks(id);
      } else if (aiReportType === 'prioritize') {
        data = await aiApi.generatePrioritization(id);
      }
      
      // Refresh AI reports
      const updatedReports = await aiApi.getAIReports(id);
      setAiReports(updatedReports);
      alert('AI Insight Report Generated Successfully!');
    } catch (err) {
      alert(`AI Generation failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGeneratingAi(false);
    }
  };

  if (!repo) {
    return (
      <Layout title="Repository Details">
        <div className="flex justify-center py-12">
          <Loader variant="card" />
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'grid_view' },
    { id: 'commits', name: 'Commits', icon: 'history' },
    { id: 'prs', name: 'Pull Requests', icon: 'call_merge' },
    { id: 'issues', name: 'Issues', icon: 'bug_report' },
    { id: 'ai', name: 'AI Analysis', icon: 'psychology' }
  ];

  return (
    <Layout title={`Repo: ${repo.name}`}>
      {/* Detail Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
              {repo.name}
            </h1>
            <Badge variant={repo.language !== 'Unknown' ? 'info' : 'neutral'}>
              {repo.language}
            </Badge>
          </div>
          <p className="font-mono text-body-md text-primary font-medium mt-1">
            @{repo.fullName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/repositories">
            <Button variant="outline" className="text-[12px]">
              <span className="material-symbols-outlined text-[18px] mr-1.5">arrow_back</span>
              Back to List
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={repo.syncStatus === 'syncing' || syncing}
            className="flex items-center gap-1.5 text-[12px] border-primary/20 text-primary hover:bg-primary-container/10"
          >
            <span className={`material-symbols-outlined text-[18px] ${repo.syncStatus === 'syncing' ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{repo.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}</span>
          </Button>
        </div>
      </div>

      {/* Sync Warning Banner if failure occurs */}
      {repo.syncStatus === 'failed' && (
        <div className="bg-error-container/15 border border-error/20 text-error p-4 rounded-xl flex items-center justify-between gap-4 font-outfit">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">warning</span>
            <div>
              <p className="font-bold text-[14px]">Synchronization failed</p>
              <p className="text-[12px] text-on-surface-variant">{repo.syncError || 'Unknown crawler glitch.'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading state for syncing */}
      {repo.syncStatus === 'syncing' ? (
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-12">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              <span className="material-symbols-outlined absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary text-[24px]">sync</span>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-sm font-bold text-on-surface">Synchronizing Data...</h3>
            <p className="font-outfit text-body-md text-on-surface-variant">
              Caching git activities (commits, branches, pull requests, cycle times) in background. Polling for results.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Loader variant="card" />
            <Loader variant="card" />
            <Loader variant="card" />
            <Loader variant="card" />
          </div>
          <Loader variant="chart" />
        </div>
      ) : error ? (
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-8 select-none">
          <div className="p-4 bg-error-container/10 text-error w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-error/20">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-sm font-bold text-on-surface">Analytics Not Sync'd</h3>
            <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
              Before we can build your developer productivity dashboard, you must run your first repository sync.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={handleSync} className="bg-primary text-on-primary font-bold py-3 px-6 rounded-lg">
              Trigger Repository Sync
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex border-b border-white/5 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-outfit text-body-md font-medium transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface hover:border-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENTS */}
          
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-gutter animate-in fade-in duration-300">
              {/* StatCards Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                  title="Total Commits" 
                  value={repo.stats?.totalCommits || 0} 
                  icon="inventory_2"
                  color="blue"
                />
                <StatCard 
                  title="Active Pull Requests" 
                  value={prs?.open || 0} 
                  icon="call_merge"
                  color="amber"
                />
                <StatCard 
                  title="Average Cycle Time" 
                  value={`${prs?.avgCycleTimeHours || 0} hrs`} 
                  icon="schedule"
                  color="green"
                />
                <StatCard 
                  title="Contributors" 
                  value={repo.stats?.contributorsCount || 0} 
                  icon="groups"
                  color="red"
                />
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                <div className="glass-card p-6 border border-white/5 lg:col-span-2 space-y-4">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                    Commit Frequency (Project Timeline)
                  </h4>
                  <CommitFrequencyChart data={commits} />
                </div>
                <div className="glass-card p-6 border border-white/5 space-y-4">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                    Pull Request Status
                  </h4>
                  {prs && <PRStatusChart prStats={prs} />}
                </div>
              </div>

              {/* Contributors list */}
              <div className="glass-card p-6 border border-white/5 space-y-4">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Contributor Velocity Leaderboard
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-outfit border-collapse text-body-md text-on-surface">
                    <thead>
                      <tr className="border-b border-white/5 text-on-surface-variant font-semibold text-[13px] uppercase tracking-wider">
                        <th className="py-3 px-4">Contributor</th>
                        <th className="py-3 px-4 text-center">Commits</th>
                        <th className="py-3 px-4 text-green-400 text-center">Additions</th>
                        <th className="py-3 px-4 text-red-400 text-center">Deletions</th>
                        <th className="py-3 px-4 text-right">Last Contribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contributors.active.slice(0, 5).map((c) => (
                        <tr key={c._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 px-4 flex items-center gap-3">
                            <img src={c.avatarUrl || 'https://github.com/identicons/git.png'} alt={c._id} className="w-8 h-8 rounded-full border border-white/10" />
                            <div>
                              <p className="font-bold">{c.name || c._id}</p>
                              <p className="font-mono text-[11px] text-on-surface-variant">@{c._id}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-semibold font-mono text-[14px]">{c.commits}</td>
                          <td className="py-4 px-4 text-center font-mono text-[13px] text-green-400/90 font-semibold">+{c.additions}</td>
                          <td className="py-4 px-4 text-center font-mono text-[13px] text-red-400/90 font-semibold">-{c.deletions}</td>
                          <td className="py-4 px-4 text-right text-[12px] text-on-surface-variant font-mono">{formatDate(c.lastCommitDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* COMMITS TAB */}
          {activeTab === 'commits' && (
            <div className="glass-card p-6 border border-white/5 space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Commit History Snapshot (Last 100 commits)
                </h4>
                <div className="text-[12px] font-mono text-primary bg-primary/5 py-1 px-3 border border-primary/10 rounded-full">
                  Total Captured: {rawCommits.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-outfit border-collapse text-body-md text-on-surface">
                  <thead>
                    <tr className="border-b border-white/5 text-on-surface-variant font-semibold text-[13px] uppercase tracking-wider">
                      <th className="py-3 px-4">SHA</th>
                      <th className="py-3 px-4">Message</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4 text-center">Changes</th>
                      <th className="py-3 px-4 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-outfit">
                    {rawCommits.map((c) => (
                      <tr key={c.sha} className="hover:bg-white/[0.01] transition-colors text-[13.5px]">
                        <td className="py-3.5 px-4 font-mono text-[12px] text-primary hover:underline">
                          <a href={`https://github.com/${repo.fullName}/commit/${c.sha}`} target="_blank" rel="noreferrer">
                            {c.sha.slice(0, 7)}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-xs md:max-w-md truncate" title={c.message}>
                          {c.message}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[12px] text-on-surface-variant">
                          {c.author.login || c.author.name}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[12px]">
                          <span className="text-green-400 font-semibold">+{c.additions}</span>
                          <span className="text-on-surface-variant mx-1">/</span>
                          <span className="text-red-400 font-semibold">-{c.deletions}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right text-[12px] text-on-surface-variant font-mono">
                          {timeAgo(c.date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PULL REQUESTS TAB */}
          {activeTab === 'prs' && (
            <div className="glass-card p-6 border border-white/5 space-y-6 animate-in fade-in duration-300">
              <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                Pull Request Registry
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                  <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">Merged PRs</p>
                  <p className="text-[20px] font-bold text-secondary mt-1">{prs?.merged || 0}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                  <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">Open PRs</p>
                  <p className="text-[20px] font-bold text-primary mt-1">{prs?.open || 0}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                  <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">Closed PRs</p>
                  <p className="text-[20px] font-bold text-on-surface-variant mt-1">{prs?.closed || 0}</p>
                </div>
                <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                  <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">Average Cycle Time</p>
                  <p className="text-[20px] font-bold text-green-400 mt-1">{prs?.avgCycleTimeHours || 0} hrs</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-outfit border-collapse text-body-md text-on-surface">
                  <thead>
                    <tr className="border-b border-white/5 text-on-surface-variant font-semibold text-[13px] uppercase tracking-wider">
                      <th className="py-3 px-4">Number</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Author</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Cycle Time</th>
                      <th className="py-3 px-4 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-outfit">
                    {rawPrs.map((pr) => (
                      <tr key={pr._id} className="hover:bg-white/[0.01] transition-colors text-[13.5px]">
                        <td className="py-3.5 px-4 font-mono text-[12px] text-on-surface-variant">
                          #{pr.number}
                        </td>
                        <td className="py-3.5 px-4 font-medium max-w-xs md:max-w-md truncate">
                          <a 
                            href={`https://github.com/${repo.fullName}/pull/${pr.number}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="hover:text-primary transition-colors"
                          >
                            {pr.title}
                          </a>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[12px] text-on-surface-variant">
                          @{pr.author}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant={
                            pr.state === 'merged' ? 'success' :
                            pr.state === 'open' ? 'info' :
                            'neutral'
                          }>
                            {pr.state}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[12px] font-semibold text-green-400">
                          {pr.cycleTimeHours !== null ? `${pr.cycleTimeHours} hrs` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right text-[12px] text-on-surface-variant font-mono">
                          {formatDate(pr.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {rawPrs.length === 0 && (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-on-surface-variant">
                          No Pull Requests recorded for this repository.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ISSUES TAB */}
          {activeTab === 'issues' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Metric Summary Card */}
                <div className="glass-card p-6 border border-white/5 flex flex-col justify-between h-72">
                  <div className="space-y-2">
                    <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                      Issue Load
                    </h4>
                    <p className="text-[13px] text-on-surface-variant font-outfit">
                      Current open bugs vs closed work tickets.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 font-outfit">
                    <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                      <p className="text-[11px] text-red-400/90 font-mono uppercase tracking-wider">Open</p>
                      <p className="text-[28px] font-bold text-red-400 mt-1">{issues?.open || 0}</p>
                    </div>
                    <div className="bg-surface-container-low p-4 rounded-xl border border-white/5">
                      <p className="text-[11px] text-secondary font-mono uppercase tracking-wider">Closed</p>
                      <p className="text-[28px] font-bold text-secondary mt-1">{issues?.closed || 0}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 flex justify-between items-center text-[12px] font-mono text-on-surface-variant">
                    <span>Resolution Velocity Rate</span>
                    <span className="font-bold text-primary">{issues?.resolutionRate || 0}%</span>
                  </div>
                </div>

                {/* Issue Resolution Progress Circle */}
                <div className="glass-card p-6 border border-white/5 lg:col-span-2 space-y-4">
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                    Issue Volumes
                  </h4>
                  {issues && <IssueResolutionChart openIssues={issues.open} closedIssues={issues.closed} />}
                </div>
              </div>
            </div>
          )}

          {/* AI ANALYSIS TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Trigger panel */}
              <div className="glass-card p-6 border border-white/5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2">
                  <h4 className="font-headline-sm text-on-surface font-bold">Gemini AI Project Consultant</h4>
                  <p className="font-outfit text-body-md text-on-surface-variant max-w-xl">
                    Run full-context developer telemetry analysis. Evaluate sprint speeds, detect architectural blockages, or organize feature priority matrices.
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <select
                    value={aiReportType}
                    onChange={(e) => setAiReportType(e.target.value)}
                    className="bg-surface-container-highest border border-white/5 rounded-lg px-4 py-2.5 font-outfit text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-48"
                  >
                    <option value="sprint">Sprint Summary</option>
                    <option value="bottlenecks">Bottlenecks Spotting</option>
                    <option value="prioritize">Task Backlog Priority</option>
                  </select>
                  <Button
                    onClick={handleGenerateAIReport}
                    loading={generatingAi}
                    disabled={generatingAi}
                    className="w-full sm:w-auto bg-primary text-on-primary font-bold px-6 py-2.5"
                  >
                    <span className="material-symbols-outlined text-[18px] mr-1.5">psychology</span>
                    Run Gemini AI
                  </Button>
                </div>
              </div>

              {/* Historic Reports Checklist */}
              <div className="space-y-4">
                <h4 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  AI Knowledge Base & Historic Reports
                </h4>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {aiReports.map((report) => (
                    <div key={report._id} className="glass-card p-6 border border-white/5 space-y-4 hover:border-white/10 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant={
                            report.reportType === 'sprint' ? 'success' :
                            report.reportType === 'bottlenecks' ? 'warning' : 'info'
                          }>
                            {report.reportType}
                          </Badge>
                          <span className="text-[11px] font-mono text-on-surface-variant ml-2">
                            Generated {timeAgo(report.generatedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="font-outfit text-body-lg font-bold text-on-surface">
                          AI Executive Insight Summary
                        </p>
                        <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
                          {report.content?.summary}
                        </p>
                      </div>

                      {report.content?.sprintHealth && (
                        <div className="flex items-center gap-2 border-t border-white/5 pt-3">
                          <span className="text-[12px] text-on-surface-variant font-mono">Sprint Health:</span>
                          <span className={`text-[12px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            report.content.sprintHealth === 'on-track' ? 'bg-secondary/15 text-secondary' :
                            report.content.sprintHealth === 'at-risk' ? 'bg-amber-500/15 text-amber-500' :
                            'bg-red-500/15 text-red-500'
                          }`}>
                            {report.content.sprintHealth}
                          </span>
                        </div>
                      )}

                      {/* Recommendations list */}
                      {report.content?.recommendations && report.content.recommendations.length > 0 && (
                        <div className="space-y-1.5 border-t border-white/5 pt-3">
                          <p className="text-[11px] text-on-surface-variant font-mono uppercase tracking-wider">Top Action Items</p>
                          <ul className="list-disc pl-4 space-y-1 text-[13px] text-on-surface-variant font-outfit">
                            {report.content.recommendations.slice(0, 3).map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  {aiReports.length === 0 && (
                    <div className="glass-card p-12 border border-white/5 text-center space-y-4 lg:col-span-2 flex flex-col items-center py-16">
                      <span className="material-symbols-outlined text-[40px] text-primary/45 animate-bounce">psychology</span>
                      <div>
                        <h5 className="font-headline-sm text-on-surface font-semibold">No AI Reports Cache</h5>
                        <p className="font-outfit text-body-md text-on-surface-variant max-w-sm mt-1 mx-auto">
                          Consult with Google Gemini flash processing to dissect active developer velocity statistics.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default RepoDetail;
