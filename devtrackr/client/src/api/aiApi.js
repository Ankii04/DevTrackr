import axiosInstance from './axiosInstance';

export const generateSprintSummary = async (repoId) => {
  const response = await axiosInstance.post(`/ai/${repoId}/sprint-summary`);
  return response.data;
};

export const generateCommitInsights = async (repoId) => {
  const response = await axiosInstance.post(`/ai/${repoId}/commit-insights`);
  return response.data;
};

export const generateBottlenecks = async (repoId) => {
  const response = await axiosInstance.post(`/ai/${repoId}/bottlenecks`);
  return response.data;
};

export const generatePrioritization = async (repoId) => {
  const response = await axiosInstance.post(`/ai/${repoId}/prioritize`);
  return response.data;
};

export const getAIReports = async (repoId) => {
  const response = await axiosInstance.get(`/ai/${repoId}/reports`);
  return response.data;
};
