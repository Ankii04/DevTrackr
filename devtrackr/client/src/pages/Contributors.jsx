import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import Layout from '../components/layout/Layout';
import Loader from '../components/ui/Loader';
import ContributorCard from '../components/cards/ContributorCard';
import { formatDate } from '../utils/dateHelpers';

const Contributors = () => {
  const { selectedRepo, analyticsData, analyticsLoading } = useDashboard();

  if (!selectedRepo) {
    return (
      <Layout title="Contributors">
        <div className="glass-card p-8 text-center text-on-surface-variant max-w-md mx-auto mt-12">
          Select a repository from the header dropdown to view contributor activity.
        </div>
      </Layout>
    );
  }

  const { active = [], inactive = [] } = analyticsData.contributors;

  return (
    <Layout title="Contributors">
      <div className="space-y-gutter">
        {/* Page Description */}
        <div>
          <h1 className="font-outfit text-headline-md text-on-surface font-extrabold tracking-tight">
            Developer Contributor Leaderboard
          </h1>
          <p className="font-outfit text-body-md text-on-surface-variant">
            Performance analytics detailing commits, line changes volume, and push frequencies for <span className="font-mono text-primary font-medium">@{selectedRepo.fullName}</span>.
          </p>
        </div>

        {analyticsLoading ? (
          <div className="space-y-6">
            <Loader variant="table" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter items-start">
            
            {/* Left: Active Leaderboard Table (2/3 width) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-card p-6 border border-white/5 space-y-4">
                <h3 className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">
                  Active Contributors ({active.length})
                </h3>
                
                {active.length === 0 ? (
                  <p className="font-outfit text-body-md text-on-surface-variant text-center py-8">
                    No active contributors cached yet. Trigger a sync to update details.
                  </p>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse font-outfit text-body-md">
                      <thead>
                        <tr className="border-b border-white/5 font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">
                          <th className="pb-3 pl-4">Developer</th>
                          <th className="pb-3 text-center">Commits</th>
                          <th className="pb-3 text-right">Additions</th>
                          <th className="pb-3 text-right">Deletions</th>
                          <th className="pb-3 pr-4 text-right">Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {active.map((contrib, idx) => (
                          <tr 
                            key={contrib._id} 
                            className="border-b border-white/5 hover:bg-surface-variant/20 transition-all font-outfit text-[14px]"
                          >
                            <td className="py-4 pl-4 flex items-center gap-3">
                              <span className="font-mono text-[12px] text-on-surface-variant w-4">
                                #{idx + 1}
                              </span>
                              {contrib.avatarUrl ? (
                                <img src={contrib.avatarUrl} alt={contrib._id} className="w-8 h-8 rounded-full border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold border border-primary/10">
                                  {contrib._id.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-on-surface leading-tight">{contrib.name || contrib._id}</p>
                                <p className="font-mono text-[10px] text-on-surface-variant">@{contrib._id}</p>
                              </div>
                            </td>
                            <td className="py-4 text-center font-mono text-on-surface font-semibold">
                              {contrib.commits}
                            </td>
                            <td className="py-4 text-right font-mono text-secondary font-semibold">
                              +{contrib.additions.toLocaleString()}
                            </td>
                            <td className="py-4 text-right font-mono text-error font-semibold">
                              -{contrib.deletions.toLocaleString()}
                            </td>
                            <td className="py-4 pr-4 text-right font-mono text-[12px] text-on-surface-variant">
                              {formatDate(contrib.lastCommitDate)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Inactive Alert Panel (1/3 width) */}
            <div className="space-y-gutter">
              <div className="glass-card p-6 border border-tertiary/20 bg-tertiary-container/5 rounded-xl space-y-4">
                <div className="flex items-center gap-2 text-tertiary">
                  <span className="material-symbols-outlined text-[24px]">warning_amber</span>
                  <h3 className="font-label-caps text-label-caps uppercase tracking-widest font-bold">
                    Inactive Developers ({inactive.length})
                  </h3>
                </div>
                <p className="font-outfit text-body-md text-on-surface-variant leading-relaxed">
                  The following contributors have not committed code to <span className="font-mono text-[12px] text-primary">main</span> in over 14 days. Suggest follow-ups to verify blockages.
                </p>

                {inactive.length === 0 ? (
                  <div className="p-4 border border-white/5 bg-surface-container/40 rounded-lg text-center text-secondary font-outfit text-body-md">
                    🎉 Excellent! All contributors are active within 14 days.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {inactive.map((contrib) => {
                      const days = Math.floor((new Date() - new Date(contrib.lastCommitDate)) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <div 
                          key={contrib._id} 
                          className="flex items-center justify-between p-3 border border-white/5 bg-surface-container/30 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {contrib.avatarUrl ? (
                              <img src={contrib.avatarUrl} alt={contrib._id} className="w-8 h-8 rounded-full border border-white/10" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-bold font-mono">
                                {contrib._id.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-outfit text-body-md font-semibold text-on-surface">@{contrib._id}</p>
                              <p className="text-[11px] text-on-surface-variant">Last commit: {formatDate(contrib.lastCommitDate)}</p>
                            </div>
                          </div>
                          <span className="font-mono text-[12px] font-bold text-tertiary bg-tertiary-container/10 px-2 py-0.5 rounded border border-tertiary/20">
                            {days}d inactive
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </Layout>
  );
};

export default Contributors;
