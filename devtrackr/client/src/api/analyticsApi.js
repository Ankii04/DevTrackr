import axiosInstance from './axiosInstance';

export const getCommits = async (repoId, days = 30) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/commits?days=${days}`);
  return response.data;
};

export const getContributors = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/contributors`);
  return response.data;
};

export const getPRs = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/prs`);
  return response.data;
};

export const getIssues = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/issues`);
  return response.data;
};

export const getVelocity = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/velocity`);
  return response.data;
};

export const getRawCommits = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/raw-commits`);
  return response.data;
};

export const getRawPRs = async (repoId) => {
  const response = await axiosInstance.get(`/analytics/${repoId}/raw-prs`);
  return response.data;
};
