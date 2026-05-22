import { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import * as aiApi from '../api/aiApi';

export const useAIInsights = () => {
  const { selectedRepo, aiReports, fetchAIReports } = useDashboard();
  const [loading, setLoading] = useState({
    sprint: false,
    commits: false,
    bottlenecks: false,
    prioritize: false
  });
  const [error, setError] = useState(null);

  const runSprintSummary = async () => {
    if (!selectedRepo) return;
    setLoading(prev => ({ ...prev, sprint: true }));
    setError(null);
    try {
      const data = await aiApi.generateSprintSummary(selectedRepo._id);
      await fetchAIReports(selectedRepo._id);
      return data;
    } catch (err) {
      console.error('[USE AI HOOK] Sprint summary failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to generate AI sprint report';
      setError(errMsg);
      throw errMsg;
    } finally {
      setLoading(prev => ({ ...prev, sprint: false }));
    }
  };

  const runCommitInsights = async () => {
    if (!selectedRepo) return;
    setLoading(prev => ({ ...prev, commits: true }));
    setError(null);
    try {
      const data = await aiApi.generateCommitInsights(selectedRepo._id);
      await fetchAIReports(selectedRepo._id);
      return data;
    } catch (err) {
      console.error('[USE AI HOOK] Commit insights failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to analyze commits quality';
      setError(errMsg);
      throw errMsg;
    } finally {
      setLoading(prev => ({ ...prev, commits: false }));
    }
  };

  const runBottlenecks = async () => {
    if (!selectedRepo) return;
    setLoading(prev => ({ ...prev, bottlenecks: true }));
    setError(null);
    try {
      const data = await aiApi.generateBottlenecks(selectedRepo._id);
      await fetchAIReports(selectedRepo._id);
      return data;
    } catch (err) {
      console.error('[USE AI HOOK] Bottlenecks detection failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to analyze stale PRs and hotspots';
      setError(errMsg);
      throw errMsg;
    } finally {
      setLoading(prev => ({ ...prev, bottlenecks: false }));
    }
  };

  const runPrioritization = async () => {
    if (!selectedRepo) return;
    setLoading(prev => ({ ...prev, prioritize: true }));
    setError(null);
    try {
      const data = await aiApi.generatePrioritization(selectedRepo._id);
      await fetchAIReports(selectedRepo._id);
      return data;
    } catch (err) {
      console.error('[USE AI HOOK] Backlog prioritization failed:', err);
      const errMsg = err.response?.data?.error || 'Failed to prioritize backlog tasks';
      setError(errMsg);
      throw errMsg;
    } finally {
      setLoading(prev => ({ ...prev, prioritize: false }));
    }
  };

  return {
    reports: aiReports,
    loading,
    error,
    generateSprintSummary: runSprintSummary,
    generateCommitInsights: runCommitInsights,
    generateBottlenecks: runBottlenecks,
    generatePrioritization: runPrioritization
  };
};

export default useAIInsights;
