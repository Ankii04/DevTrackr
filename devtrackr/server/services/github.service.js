const env = require('../config/env');

// Helper to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Safe fetch wrapper with User-Agent, Rate-Limit checks and Auto-Retry logic
async function githubFetch(url, token, options = {}, retries = 3) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'DevTrackr-Analytics-Engine'
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    // Capture Rate Limit metrics
    const remaining = response.headers.get('x-ratelimit-remaining');
    const resetTime = response.headers.get('x-ratelimit-reset'); // Unix epoch in seconds
    
    if (remaining !== null && parseInt(remaining) === 0) {
      const waitSeconds = Math.max(1, (parseInt(resetTime) * 1000 - Date.now()) / 1000);
      console.warn(`[GITHUB RATE LIMIT] 0 requests remaining! Must wait ${waitSeconds}s until reset.`);
      
      if (retries > 0) {
        console.log(`[GITHUB RETRY] Sleeping for ${waitSeconds}s, then retrying...`);
        await delay(waitSeconds * 1000 + 500); // Add 500ms grace period
        return githubFetch(url, token, options, retries - 1);
      } else {
        throw new Error('GitHub API Rate Limit exceeded and maximum retries reached.');
      }
    }

    // Handle generic status failures
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`GitHub API Error (${response.status}): ${errorMsg || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (retries > 0 && error.message.includes('fetch failed')) {
      console.warn(`[GITHUB RETRY] Network glitch detected. Retrying in 2 seconds...`);
      await delay(2000);
      return githubFetch(url, token, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Fetch authenticated user's repositories
 */
async function fetchUserRepos(token) {
  const url = 'https://api.github.com/user/repos?per_page=100&sort=updated';
  return await githubFetch(url, token);
}

/**
 * Fetch repository stats metadata directly from GitHub
 */
async function fetchRepoStats(token, owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  return await githubFetch(url, token);
}

/**
 * Fetch last 100 commits for a repository
 */
async function fetchCommits(token, owner, repo, since = '') {
  let url = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  if (since) {
    url += `&since=${encodeURIComponent(since)}`;
  }
  return await githubFetch(url, token);
}

/**
 * Fetch detailed commit info (additions, deletions, files changed) for a specific SHA
 */
async function fetchCommitDetail(token, owner, repo, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`;
  return await githubFetch(url, token);
}

/**
 * Fetch pull requests with open, closed, or merged state
 */
async function fetchPullRequests(token, owner, repo, state = 'all') {
  // State can be: 'open', 'closed', 'all'
  const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}&per_page=100`;
  return await githubFetch(url, token);
}

/**
 * Fetch issues (including filters)
 */
async function fetchIssues(token, owner, repo, state = 'all') {
  // state: 'open', 'closed', 'all'
  // Note: GitHub issues API returns both PRs and Issues.
  // We'll fetch them and we can filter out PRs by checking the 'pull_request' field.
  const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=100`;
  return await githubFetch(url, token);
}

/**
 * Fetch contributors for a repository
 */
async function fetchContributors(token, owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=100`;
  return await githubFetch(url, token);
}

module.exports = {
  fetchUserRepos,
  fetchRepoStats,
  fetchCommits,
  fetchCommitDetail,
  fetchPullRequests,
  fetchIssues,
  fetchContributors
};
