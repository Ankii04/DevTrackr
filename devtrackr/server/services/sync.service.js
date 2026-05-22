const Repository = require('../models/Repository');
const CommitSnapshot = require('../models/CommitSnapshot');
const PullRequest = require('../models/PullRequest');
const githubService = require('./github.service');
const { parseRepoFullName } = require('../utils/githubHelpers');

// Helper to partition an array into chunks
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Triggers the sync pipeline in the background.
 * DOES NOT block the caller.
 */
function triggerBackgroundSync(repositoryId, token) {
  // Execute async immediately without returning the promise
  runSyncPipeline(repositoryId, token)
    .then(() => {
      console.log(`[SYNC SUCCESS] Finished background sync for repository ${repositoryId}`);
    })
    .catch((error) => {
      console.error(`[SYNC FAILURE] Failed background sync for repository ${repositoryId}: ${error.message}`);
    });
}

/**
 * Main Sync Pipeline
 */
async function runSyncPipeline(repositoryId, token) {
  let repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new Error('Repository not found in database');
  }

  // Update status to syncing
  repo.syncStatus = 'syncing';
  repo.syncError = null;
  await repo.save();

  try {
    const { owner, name } = parseRepoFullName(repo.fullName);

    // 1. Fetch Repository Metadata
    console.log(`[SYNC] Fetching metadata for ${repo.fullName}...`);
    const metadata = await githubService.fetchRepoStats(token, owner, name);
    repo.description = metadata.description || '';
    repo.language = metadata.language || 'Unknown';
    repo.isPrivate = metadata.private || false;

    // 2. Fetch Pull Requests (All - open and closed)
    console.log(`[SYNC] Syncing Pull Requests for ${repo.fullName}...`);
    const prs = await githubService.fetchPullRequests(token, owner, name, 'all');
    
    let openPRs = 0;
    let closedPRs = 0;

    for (const pr of prs) {
      const isMerged = pr.merged_at !== null;
      const state = isMerged ? 'merged' : pr.state; // 'open', 'closed', 'merged'
      
      if (state === 'open') openPRs++;
      else closedPRs++;

      let cycleTimeHours = null;
      if (pr.closed_at) {
        const created = new Date(pr.created_at);
        const closed = new Date(pr.closed_at);
        cycleTimeHours = Math.max(0, (closed - created) / (1000 * 60 * 60)); // diff in hours
      }

      await PullRequest.findOneAndUpdate(
        { repositoryId, githubPrId: pr.id },
        {
          number: pr.number,
          title: pr.title,
          state,
          author: pr.user?.login || 'unknown',
          createdAt: pr.created_at,
          closedAt: pr.closed_at,
          mergedAt: pr.merged_at,
          cycleTimeHours
        },
        { upsert: true, new: true }
      );
    }

    // 3. Fetch Issues (excluding PRs)
    console.log(`[SYNC] Syncing Issues for ${repo.fullName}...`);
    const rawIssues = await githubService.fetchIssues(token, owner, name, 'all');
    let openIssues = 0;
    let closedIssues = 0;

    // Filter out PRs since GitHub Issues endpoint aggregates both
    const issues = rawIssues.filter(item => !item.pull_request);
    for (const issue of issues) {
      if (issue.state === 'open') openIssues++;
      else closedIssues++;
    }

    // 4. Fetch Contributors
    console.log(`[SYNC] Syncing Contributors for ${repo.fullName}...`);
    const contributors = await githubService.fetchContributors(token, owner, name);
    const contributorsCount = contributors.length;

    // 5. Fetch Commits (Last 100 commits)
    console.log(`[SYNC] Syncing last 100 commits for ${repo.fullName}...`);
    const rawCommits = await githubService.fetchCommits(token, owner, name);
    
    // We only pull detail for commits we don't have yet to speed it up!
    const shasToSync = [];
    for (const c of rawCommits) {
      const exists = await CommitSnapshot.exists({ repositoryId, sha: c.sha });
      if (!exists) {
        shasToSync.push(c);
      }
    }

    console.log(`[SYNC] Found ${shasToSync.length} new commits out of ${rawCommits.length} returned. Fetching details...`);

    // Fetch commit details in parallel batches of 5 to avoid overloading rate limits
    const commitChunks = chunkArray(shasToSync, 5);
    for (const chunk of commitChunks) {
      await Promise.all(chunk.map(async (c) => {
        try {
          const detail = await githubService.fetchCommitDetail(token, owner, name, c.sha);
          
          await CommitSnapshot.create({
            repositoryId,
            sha: c.sha,
            message: c.commit.message,
            author: {
              name: c.commit.author?.name || 'Unknown',
              email: c.commit.author?.email || '',
              login: c.author?.login || 'unknown',
              avatarUrl: c.author?.avatar_url || ''
            },
            date: c.commit.author?.date || new Date(),
            additions: detail.stats?.additions || 0,
            deletions: detail.stats?.deletions || 0,
            filesChanged: detail.files?.length || 0
          });
        } catch (err) {
          console.error(`[SYNC COMMIT ERROR] Failed details for sha ${c.sha}: ${err.message}`);
          // Create with zeroed additions if details fetch fails
          await CommitSnapshot.create({
            repositoryId,
            sha: c.sha,
            message: c.commit.message,
            author: {
              name: c.commit.author?.name || 'Unknown',
              email: c.commit.author?.email || '',
              login: c.author?.login || 'unknown',
              avatarUrl: c.author?.avatar_url || ''
            },
            date: c.commit.author?.date || new Date(),
            additions: 0,
            deletions: 0,
            filesChanged: 0
          });
        }
      }));
    }

    // Recalculate total commits in our DB for accuracy
    const totalCommitsCount = await CommitSnapshot.countDocuments({ repositoryId });

    // Update Repository Stats
    repo.stats = {
      totalCommits: totalCommitsCount,
      openPRs,
      closedPRs,
      openIssues,
      closedIssues,
      contributorsCount
    };

    repo.syncStatus = 'completed';
    repo.lastSyncedAt = new Date();
    await repo.save();
    console.log(`[SYNC COMPLETE] Successfully synced repository ${repo.fullName}`);
  } catch (error) {
    console.error(`[SYNC PIPELINE ERROR] Failed during repo sync: ${error.message}`);
    repo.syncStatus = 'failed';
    repo.syncError = error.message;
    await repo.save();
    throw error;
  }
}

module.exports = {
  triggerBackgroundSync,
  runSyncPipeline
};
