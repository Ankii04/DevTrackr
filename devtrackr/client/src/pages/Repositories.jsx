import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGitHub from '../hooks/useGitHub';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Loader from '../components/ui/Loader';
import { formatDate, timeAgo } from '../utils/dateHelpers';

const Repositories = () => {
  const { 
    repos, 
    syncing, 
    loading, 
    fetchRepos, 
    selectRepo, 
    syncRepo, 
    connectGitHub 
  } = useGitHub();

  const navigate = useNavigate();
  const [localSyncId, setLocalSyncId] = useState(null);

  useEffect(() => {
    fetchRepos();
  }, []);

  const handleSyncClick = async (e, repoId) => {
    e.stopPropagation(); // Avoid card selection trigger
    setLocalSyncId(repoId);
    try {
      await syncRepo(repoId);
    } catch (err) {
      alert(`Sync failed: ${err}`);
    } finally {
      setLocalSyncId(null);
    }
  };

  const handleSyncAllClick = async () => {
    const reposToSync = repos.filter(repo => repo.syncStatus !== 'syncing');
    if (reposToSync.length === 0) return;

    try {
      await Promise.all(reposToSync.map(repo => syncRepo(repo._id)));
    } catch (err) {
      console.error('[REPOSITORIES PAGE] Sync all failed:', err);
      alert('One or more repository synchronizations failed to start. Please check your GitHub connection.');
    }
  };

  const handleCardClick = (repo) => {
    selectRepo(repo);
    navigate('/dashboard'); // Switch repo and redirect to dashboard
  };

  return (
    <Layout title="Repositories">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Repository Manager
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Connect and synchronize repository branches to evaluate development speeds.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {repos.length > 0 && (
            <Button
              onClick={handleSyncAllClick}
              disabled={syncing}
              className="flex items-center gap-1.5 text-[12px] bg-secondary-container text-on-secondary-container hover:bg-secondary-container/85"
            >
              <span className={`material-symbols-outlined text-[18px] ${syncing ? 'animate-spin' : ''}`}>
                sync
              </span>
              <span>Sync All Repositories</span>
            </Button>
          )}
          <Button
            onClick={connectGitHub}
            loading={loading}
            className="flex items-center gap-2 text-[12px] bg-primary-container text-on-primary-container"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
            </svg>
            <span>Link New GitHub Repo</span>
          </Button>
        </div>
      </div>

      {/* Main Grid display */}
      {repos.length === 0 ? (
        <div className="glass-card p-12 border border-white/5 text-center space-y-6 max-w-lg mx-auto mt-8 select-none">
          <div className="p-4 bg-primary-container/10 text-primary w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-primary/20">
            <span className="material-symbols-outlined text-[32px]">folder_git</span>
          </div>
          <div className="space-y-2">
            <h3 className="font-outfit text-headline-sm font-bold text-on-surface">No repositories synchronized</h3>
            <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
              We did not find any linked repositories in your account. Connect your developer GitHub profile to load and analyze repository activity.
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={connectGitHub} loading={loading} className="bg-primary text-on-primary font-bold py-3 px-6 rounded-lg">
              Connect GitHub Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {repos.map((repo) => {
            const isRepoSyncing = repo.syncStatus === 'syncing' || (localSyncId === repo._id && syncing);
            
            return (
              <div
                key={repo._id}
                onClick={() => handleCardClick(repo)}
                className="glass-card glass-card-hover border border-white/5 hover:border-white/12 p-6 flex flex-col justify-between h-72 cursor-pointer relative group"
              >
                {/* Top Section */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start">
                    <Badge variant={repo.language !== 'Unknown' ? 'info' : 'neutral'}>
                      {repo.language}
                    </Badge>
                    <span className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      repo.syncStatus === 'completed' ? 'bg-secondary/15 text-secondary' : 
                      repo.syncStatus === 'syncing' ? 'bg-primary/15 text-primary animate-pulse' :
                      repo.syncStatus === 'failed' ? 'bg-error/15 text-error' :
                      'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {repo.syncStatus}
                    </span>
                  </div>

                  <h3 className="font-outfit text-body-lg font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                    {repo.name}
                  </h3>
                  <p className="font-mono text-[11px] text-on-surface-variant truncate">
                    @{repo.fullName}
                  </p>
                  <p className="font-outfit text-[12px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {repo.description || 'No description supplied.'}
                  </p>
                </div>

                {/* Bottom stats and action indicators */}
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-center text-on-surface-variant">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Commits</p>
                      <p className="text-[13px] font-bold text-on-surface mt-0.5">{repo.stats?.totalCommits || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">PRs</p>
                      <p className="text-[13px] font-bold text-primary mt-0.5">{(repo.stats?.openPRs || 0) + (repo.stats?.closedPRs || 0)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">Contribs</p>
                      <p className="text-[13px] font-bold text-secondary mt-0.5">{repo.stats?.contributorsCount || 0}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                    <span>Synced {repo.lastSyncedAt ? timeAgo(repo.lastSyncedAt) : 'Never'}</span>
                    <Button
                      variant="outline"
                      onClick={(e) => handleSyncClick(e, repo._id)}
                      disabled={isRepoSyncing}
                      className="!py-1 !px-2.5 flex items-center gap-1 hover:border-primary/30 hover:text-primary transition-colors text-[10px]"
                    >
                      <span className={`material-symbols-outlined text-[15px] ${isRepoSyncing ? 'animate-spin text-primary' : ''}`}>
                        sync
                      </span>
                      <span>{isRepoSyncing ? 'Syncing...' : 'Sync'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
};

export default Repositories;
