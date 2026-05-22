import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import * as githubApi from '../api/githubApi';

export const useGitHub = () => {
  const {
    repos,
    selectedRepo,
    syncing,
    fetchRepositories,
    selectRepo,
    syncActiveRepo,
    error,
    setError
  } = useDashboard();

  const [loading, setLoading] = useState(false);

  const connectGitHub = async () => {
    setLoading(true);
    try {
      const data = await githubApi.getConnectUrl();
      if (data.url) {
        window.location.href = data.url; // Redirect to GitHub OAuth flow
      }
    } catch (err) {
      console.error('[USE GITHUB HOOK] Auth redirect failed:', err);
      setError('Could not connect to GitHub OAuth authorization servers.');
    } finally {
      setLoading(false);
    }
  };

  return {
    repos,
    selectedRepo,
    syncing,
    loading,
    error,
    fetchRepos: fetchRepositories,
    selectRepo,
    syncRepo: syncActiveRepo,
    connectGitHub
  };
};

export default useGitHub;
