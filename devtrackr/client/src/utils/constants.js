export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const HEALTH_COLOR_MAP = {
  'on-track': 'bg-secondary-container/20 text-secondary border border-secondary/20',
  'at-risk': 'bg-tertiary-container/20 text-tertiary border border-tertiary/20',
  'blocked': 'bg-error-container/20 text-error border border-error/20',
  'unknown': 'bg-surface-container-highest text-on-surface-variant'
};

export const HEALTH_LABEL_MAP = {
  'on-track': 'On Track',
  'at-risk': 'At Risk',
  'blocked': 'Blocked',
  'unknown': 'Analyzing'
};
