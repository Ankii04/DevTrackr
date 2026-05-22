import axiosInstance from './axiosInstance';

export const getConnectUrl = async () => {
  const response = await axiosInstance.get('/github/connect');
  return response.data;
};

export const getRepos = async () => {
  const response = await axiosInstance.get('/github/repos');
  return response.data;
};

export const syncRepo = async (repoId) => {
  const response = await axiosInstance.post(`/github/sync/${repoId}`);
  return response.data;
};
