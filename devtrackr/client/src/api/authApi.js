import axiosInstance from './axiosInstance';

export const login = async (email, password) => {
  const response = await axiosInstance.post('/auth/login', { email, password });
  return response.data;
};

export const signup = async (username, email, password) => {
  const response = await axiosInstance.post('/auth/signup', { username, email, password });
  return response.data;
};

export const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

export const disconnectGithub = async () => {
  const response = await axiosInstance.post('/auth/disconnect-github');
  return response.data;
};
