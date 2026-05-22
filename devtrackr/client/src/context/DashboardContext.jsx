import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as githubApi from '../api/githubApi';
import * as analyticsApi from '../api/analyticsApi';
import * as aiApi from '../api/aiApi';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(() => {
    const saved = localStorage.getItem('selectedRepo');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [analyticsData, setAnalyticsData] = useState({
    commits: [],
    contributors: { active: [], inactive: [] },
    prs: null,
    issues: null,
    velocity: []
  });

  const [aiReports, setAIReports] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);
  const syncingRepoIdsRef = useRef(new Set());

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Fetch all repos if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchRepositories();
    } else {
      setRepos([]);
      setSelectedRepo(null);
      localStorage.removeItem('selectedRepo');
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      syncingRepoIdsRef.current.clear();
      setSyncing(false);
    }
  }, [isAuthenticated]);

  // Load analytics when repo selection changes
  useEffect(() => {
    if (selectedRepo && isAuthenticated) {
      fetchAnalytics(selectedRepo._id);
      fetchAIReports(selectedRepo._id);
      
      // If the selected repo is currently syncing in backend, restart polling loop
      if (selectedRepo.syncStatus === 'syncing') {
        startPollingSync(selectedRepo._id);
      }
    }
  }, [selectedRepo, isAuthenticated]);

  const fetchRepositories = async () => {
    try {
      const data = await githubApi.getRepos();
      setRepos(data);

      // Start polling for any repositories that are currently syncing in the background
      data.forEach(repo => {
        if (repo.syncStatus === 'syncing') {
          startPollingSync(repo._id);
        }
      });
      
      // If we don't have a selected repo yet, auto select the first one
      if (data.length > 0 && !selectedRepo) {
        selectRepo(data[0]);
      } else if (selectedRepo) {
        // Refresh selectedRepo details (like syncStatus)
        const updatedSelected = data.find(r => r._id === selectedRepo._id);
        if (updatedSelected) {
          setSelectedRepo(updatedSelected);
          localStorage.setItem('selectedRepo', JSON.stringify(updatedSelected));
        }
      }
    } catch (err) {
      console.error('[DASHBOARD CONTEXT] Failed fetching repos:', err);
      setError(err.response?.data?.error || 'Failed to fetch repositories');
    }
  };

  const selectRepo = (repo) => {
    setSelectedRepo(repo);
    localStorage.setItem('selectedRepo', JSON.stringify(repo));
    setError(null);
    if (repo.syncStatus === 'syncing') {
      startPollingSync(repo._id);
    }
  };

  const fetchAnalytics = async (repoId) => {
    setAnalyticsLoading(true);
    try {
      const [commits, contributors, prs, issues, velocity] = await Promise.all([
        analyticsApi.getCommits(repoId),
        analyticsApi.getContributors(repoId),
        analyticsApi.getPRs(repoId),
        analyticsApi.getIssues(repoId),
        analyticsApi.getVelocity(repoId)
      ]);

      setAnalyticsData({
        commits,
        contributors,
        prs,
        issues,
        velocity
      });
    } catch (err) {
      console.error('[DASHBOARD CONTEXT] Analytics fetch failed:', err);
      setError('Could not retrieve repository analytics. Ensure sync is run first.');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchAIReports = async (repoId) => {
    setAiLoading(true);
    try {
      const data = await aiApi.getAIReports(repoId);
      setAIReports(data);
    } catch (err) {
      console.error('[DASHBOARD CONTEXT] Failed fetching AI reports:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Polls backend to check on background sync status
  const startPollingSync = (repoId) => {
    syncingRepoIdsRef.current.add(repoId);
    setSyncing(true);

    if (pollIntervalRef.current) return;

    pollIntervalRef.current = setInterval(async () => {
      try {
        const reposList = await githubApi.getRepos();
        setRepos(reposList);

        const finishedIds = [];

        syncingRepoIdsRef.current.forEach(id => {
          const repo = reposList.find(r => r._id === id);
          if (repo) {
            // Only update selectedRepo if it matches the repo currently being polled
            if (selectedRepo && selectedRepo._id === id) {
              setSelectedRepo(repo);
              localStorage.setItem('selectedRepo', JSON.stringify(repo));
            }

            if (repo.syncStatus !== 'syncing') {
              console.log(`[DASHBOARD CONTEXT] Background sync finished for ${repo.name} with status: ${repo.syncStatus}`);
              finishedIds.push(id);
              
              // Reload fresh synced stats if it is currently selected
              if (selectedRepo && selectedRepo._id === id) {
                fetchAnalytics(id);
                fetchAIReports(id);
              }
            }
          } else {
            finishedIds.push(id);
          }
        });

        finishedIds.forEach(id => syncingRepoIdsRef.current.delete(id));

        if (syncingRepoIdsRef.current.size === 0) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setSyncing(false);
        }
      } catch (err) {
        console.error('[DASHBOARD CONTEXT] Sync polling error:', err);
      }
    }, 3000); // Poll every 3 seconds
  };

  const syncActiveRepo = async (repoId) => {
    const targetId = repoId || selectedRepo?._id;
    if (!targetId) return;
    
    setSyncing(true);
    try {
      const data = await githubApi.syncRepo(targetId);
      
      // Update local repository status immediately
      setRepos(prevRepos => prevRepos.map(r => r._id === targetId ? { ...r, syncStatus: 'syncing' } : r));
      
      if (selectedRepo && selectedRepo._id === targetId) {
        const updatedRepo = {
          ...selectedRepo,
          syncStatus: 'syncing'
        };
        setSelectedRepo(updatedRepo);
        localStorage.setItem('selectedRepo', JSON.stringify(updatedRepo));
      }

      // Trigger polling loop for this specific repo
      startPollingSync(targetId);
      return data;
    } catch (err) {
      // Set syncing back to false if no other repo is actively polling
      if (syncingRepoIdsRef.current.size === 0) {
        setSyncing(false);
      }
      const errMsg = err.response?.data?.error || 'Failed to trigger synchronization';
      setError(errMsg);
      throw errMsg;
    }
  };

  const value = {
    repos,
    selectedRepo,
    analyticsData,
    aiReports,
    syncing,
    analyticsLoading,
    aiLoading,
    error,
    setError,
    fetchRepositories,
    selectRepo,
    syncActiveRepo,
    fetchAnalytics,
    fetchAIReports
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
