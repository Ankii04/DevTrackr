import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useGitHub from '../hooks/useGitHub';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { disconnectGithub, getMe } from '../api/authApi';
import { formatDate } from '../utils/dateHelpers';

const Settings = () => {
  const { user, setUser } = useAuth();
  const { connectGitHub, loading: gitLoading } = useGitHub();
  const [searchParams, setSearchParams] = useSearchParams();
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle URL redirect query parameters from GitHub callback
  useEffect(() => {
    const checkCallbackStatus = async () => {
      const connected = searchParams.get('github_connected');
      const oauthError = searchParams.get('github_error');

      if (connected === 'true') {
        setSuccess('GitHub account connected successfully!');
        setError('');
        // Clean URL parameters
        setSearchParams({});
        
        // Refresh User state from backend
        try {
          const freshData = await getMe();
          setUser(freshData.user);
        } catch (err) {
          console.error('Failed refreshing user settings context:', err);
        }
      } else if (oauthError) {
        setError(`GitHub link failed: ${decodeURIComponent(oauthError)}`);
        setSuccess('');
        setSearchParams({});
      }
    };

    checkCallbackStatus();
  }, [searchParams]);

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect your GitHub profile? This will hide all synchronized repositories.')) {
      return;
    }
    setDisconnecting(true);
    setError('');
    setSuccess('');
    try {
      const data = await disconnectGithub();
      setUser(data.user);
      setSuccess('GitHub account disconnected successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unlink account.');
    } finally {
      setDisconnecting(false);
    }
  };

  if (!user) {
    return (
      <Layout title="Settings">
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  const isGitHubConnected = !!user.githubAccessToken && !!user.githubUsername;

  return (
    <Layout title="Settings">
      <div className="max-w-3xl mx-auto space-y-gutter animate-in fade-in duration-300 font-outfit">
        
        {/* Page Title */}
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Account Settings
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Manage your personal credentials and integrate external VCS (GitHub) pipelines.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-error-container/10 border border-error/25 text-error px-4 py-3 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-secondary/10 border border-secondary/25 text-secondary px-4 py-3 rounded-xl flex items-center gap-2 animate-pulse">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>{success}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="glass-card p-6 border border-white/5 space-y-6">
          <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold border-b border-white/5 pb-3">
            Developer Profile Credentials
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Username</label>
              <p className="text-body-lg font-bold text-on-surface">{user.username}</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Email Address</label>
              <p className="text-body-lg font-bold text-on-surface">{user.email}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Joined Platform</label>
              <p className="text-body-md text-on-surface-variant font-mono">{formatDate(user.createdAt)}</p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant">Account Security Status</label>
              <div>
                <Badge variant="success">Active Session</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* GitHub Integration Panel */}
        <div className="glass-card p-6 border border-white/5 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest font-bold">
              GitHub VCS Integration
            </h3>
            <Badge variant={isGitHubConnected ? 'success' : 'neutral'}>
              {isGitHubConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 fill-current text-on-surface" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
                </svg>
                <h4 className="font-bold text-[15px] text-on-surface">GitHub REST API v3 Integration</h4>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed max-w-xl">
                By connecting your GitHub profile, DevTrackr will gain authorized access to pull commit distributions, code addition/deletion statistics, pull request registries, and cycle time rates.
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              {isGitHubConnected ? (
                <Button
                  onClick={handleDisconnect}
                  loading={disconnecting}
                  disabled={disconnecting}
                  className="w-full bg-error-container/20 border border-error/30 text-error hover:bg-error-container/30 text-[12px] font-bold"
                >
                  Disconnect Profile
                </Button>
              ) : (
                <Button
                  onClick={connectGitHub}
                  loading={gitLoading}
                  disabled={gitLoading}
                  className="w-full bg-primary-container text-on-primary-container text-[12px] font-bold"
                >
                  Link GitHub Account
                </Button>
              )}
            </div>
          </div>

          {/* Connected profile details */}
          {isGitHubConnected && (
            <div className="bg-surface-container-low border border-white/5 p-4 rounded-xl flex items-center gap-4 font-outfit mt-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-surface-container-highest flex items-center justify-center font-bold text-[20px] text-primary shrink-0">
                {user.githubUsername.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-on-surface truncate">Linked Profile: @{user.githubUsername}</p>
                <p className="text-[12px] text-on-surface-variant truncate">
                  Account connected on {user.connectedAt ? formatDate(user.connectedAt) : 'Recent session'}
                </p>
              </div>
              <div className="hidden sm:block shrink-0">
                <Badge variant="success">API Operational</Badge>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
};

export default Settings;
