const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Repository = require('../models/Repository');
const githubService = require('../services/github.service');
const syncService = require('../services/sync.service');

/**
 * @desc    Get GitHub OAuth Connect Authorization URL
 * @route   GET /api/github/connect
 * @access  Private (but accessible via URL redirect with state token)
 */
exports.connect = async (req, res, next) => {
  try {
    // Generate a secure state token using the user's JWT to authenticate them in the callback
    const stateToken = jwt.sign({ userId: req.user._id }, env.JWT_SECRET, { expiresIn: '15m' });
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_REDIRECT_URI)}&scope=repo,read:user,read:org&state=${stateToken}`;
    
    res.json({ url: githubAuthUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    GitHub OAuth callback - exchange code for token
 * @route   GET /api/github/callback
 * @access  Public (GitHub redirect)
 */
exports.callback = async (req, res, next) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('GitHub OAuth Error: No code parameter provided.');
  }

  try {
    // 1. Authenticate user from state token
    let userId;
    try {
      const decoded = jwt.verify(state, env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
      return res.status(401).send('GitHub OAuth Error: Invalid or expired state token.');
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('GitHub OAuth Error: Associated user account not found.');
    }

    // 2. Exchange authorization code for GitHub access token
    console.log('[GITHUB OAUTH] Exchanging authorization code...');
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_REDIRECT_URI
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    const accessToken = data.access_token;

    // 3. Retrieve GitHub user profile
    console.log('[GITHUB OAUTH] Retrieving user profile details...');
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': 'DevTrackr-Analytics-Engine'
      }
    });

    const profile = await profileResponse.json();
    if (!profileResponse.ok) {
      throw new Error(`Profile retrieval failed: ${profile.message || profileResponse.statusText}`);
    }

    // 4. Save credentials to the User document
    user.githubAccessToken = accessToken;
    user.githubUsername = profile.login;
    user.githubId = profile.id.toString();
    user.connectedAt = new Date();
    await user.save();

    console.log(`[GITHUB OAUTH SUCCESS] Successfully linked GitHub username: ${profile.login} to user ID ${user._id}`);

    // 5. Redirect back to frontend dashboard
    res.redirect(`http://localhost:5173/settings?github_connected=true`);
  } catch (error) {
    console.error(`[GITHUB OAUTH ERROR] Callback exchange failed: ${error.message}`);
    res.redirect(`http://localhost:5173/settings?github_error=${encodeURIComponent(error.message)}`);
  }
};

/**
 * @desc    Get user's GitHub repositories (fetches from live GitHub API, upserts DB, returns list)
 * @route   GET /api/github/repos
 * @access  Private (JWT protected)
 */
exports.repos = async (req, res, next) => {
  const user = req.user;
  if (!user.githubAccessToken) {
    return res.status(400).json({ error: 'GitHub account not linked. Please link your account first.' });
  }

  try {
    console.log(`[GITHUB REPOS] Querying live repositories for ${user.githubUsername}...`);
    const liveRepos = await githubService.fetchUserRepos(user.githubAccessToken);

    const savedRepos = [];
    for (const r of liveRepos) {
      // Upsert repository into database caching layer
      const repo = await Repository.findOneAndUpdate(
        { userId: user._id, githubRepoId: r.id },
        {
          fullName: r.full_name,
          name: r.name,
          description: r.description || '',
          language: r.language || 'Unknown',
          isPrivate: r.private
        },
        { upsert: true, new: true }
      );
      savedRepos.push(repo);
    }

    // Return the cached/upserted repository array
    res.json(savedRepos);
  } catch (error) {
    console.error(`[GITHUB REPOS ERROR] Fetch failed: ${error.message}`);
    // If external call fails, attempt to return already cached repositories
    try {
      const cachedRepos = await Repository.find({ userId: user._id });
      res.json(cachedRepos);
    } catch (dbError) {
      console.error(`[GITHUB REPOS DB FALLBACK ERROR] Failed to fetch cached repos: ${dbError.message}`);
      res.status(503).json({ error: 'Network offline. Failed to retrieve cached repositories.' });
    }
  }
};

/**
 * @desc    Trigger non-blocking asynchronous sync of commits, PRs, issues, contributors
 * @route   POST /api/github/sync/:repoId
 * @access  Private (JWT protected)
 */
exports.sync = async (req, res, next) => {
  const { repoId } = req.params;
  const user = req.user;

  if (!user.githubAccessToken) {
    return res.status(400).json({ error: 'GitHub account not linked.' });
  }

  try {
    const repo = await Repository.findOne({ _id: repoId, userId: user._id });
    if (!repo) {
      return res.status(404).json({ error: 'Repository not found or access denied.' });
    }

    // Trigger sync pipeline asynchronously
    syncService.triggerBackgroundSync(repo._id, user.githubAccessToken);

    // Immediately return 202 Accepted status
    res.status(202).json({
      message: 'Sync started in the background.',
      repository: {
        _id: repo._id,
        fullName: repo.fullName,
        syncStatus: 'syncing',
        lastSyncedAt: repo.lastSyncedAt
      }
    });
  } catch (error) {
    next(error);
  }
};
