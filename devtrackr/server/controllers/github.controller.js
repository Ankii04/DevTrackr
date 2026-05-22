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
    const clientUrl = req.headers.referer || req.headers.origin || env.CLIENT_URL;
    let cleanClientUrl = env.CLIENT_URL;
    try {
      cleanClientUrl = new URL(clientUrl).origin;
    } catch (e) {}
    
    const stateToken = jwt.sign(
      { userId: req.user._id, clientUrl: cleanClientUrl },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_REDIRECT_URI)}&scope=repo,read:user,read:org&state=${stateToken}`;
    
    res.json({ url: githubAuthUrl });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get GitHub OAuth Login Authorization URL and Redirect
 * @route   GET /api/github/login
 * @access  Public
 */
exports.loginRedirect = async (req, res, next) => {
  try {
    // Generate a secure state token for direct login
    const clientUrl = req.query.client_url || req.headers.referer || env.CLIENT_URL;
    let cleanClientUrl = env.CLIENT_URL;
    try {
      cleanClientUrl = new URL(clientUrl).origin;
    } catch (e) {}
    
    const stateToken = jwt.sign(
      { login: true, clientUrl: cleanClientUrl },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_REDIRECT_URI)}&scope=repo,read:user,read:org&state=${stateToken}`;
    
    res.redirect(githubAuthUrl);
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

  // Determine client URL dynamically from the state JWT token first to prevent localhost redirect issues
  let redirectUrl = env.CLIENT_URL;
  let userId = null;
  let isLoginFlow = false;

  try {
    const decoded = jwt.verify(state, env.JWT_SECRET);
    if (decoded.clientUrl) {
      redirectUrl = decoded.clientUrl.replace(/\/$/, '');
    }
    if (decoded.userId) {
      userId = decoded.userId;
    } else if (decoded.login) {
      isLoginFlow = true;
    }
  } catch (err) {
    // Fallback if the token is invalid but matches string containing "login" for legacy compatibility
    if (state && state.includes('login')) {
      isLoginFlow = true;
    } else {
      return res.status(401).send('GitHub OAuth Error: Invalid or expired state token.');
    }
  }

  try {
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

    if (isLoginFlow) {
      // 4a. Find or create user based on GitHub credentials
      let user = await User.findOne({ githubId: profile.id.toString() });
      
      if (!user && profile.email) {
        user = await User.findOne({ email: profile.email.toLowerCase() });
      }

      if (!user) {
        console.log(`[GITHUB OAUTH LOGIN] Creating new user for GitHub login: ${profile.login}`);
        const bcrypt = require('bcryptjs');
        const crypto = require('crypto');
        
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        const email = profile.email 
          ? profile.email.toLowerCase() 
          : `${profile.login.toLowerCase()}@github.devtrackr.local`;

        user = new User({
          username: profile.name || profile.login,
          email,
          passwordHash,
          githubAccessToken: accessToken,
          githubUsername: profile.login,
          githubId: profile.id.toString(),
          connectedAt: new Date()
        });
      } else {
        console.log(`[GITHUB OAUTH LOGIN] Existing user found: ${user.email}. Updating access token.`);
        user.githubAccessToken = accessToken;
        user.githubUsername = profile.login;
        user.githubId = profile.id.toString();
        user.connectedAt = new Date();
      }

      await user.save();

      // Generate JWT Auth Token
      const token = jwt.sign({ userId: user._id }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN || '24h'
      });

      console.log(`[GITHUB OAUTH LOGIN SUCCESS] Successfully logged in user: ${user.email}`);
      return res.redirect(`${redirectUrl}/login?token=${token}`);
    }

    // 4b. Linking flow (original logic)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('GitHub OAuth Error: Associated user account not found.');
    }

    user.githubAccessToken = accessToken;
    user.githubUsername = profile.login;
    user.githubId = profile.id.toString();
    user.connectedAt = new Date();
    await user.save();

    console.log(`[GITHUB OAUTH SUCCESS] Successfully linked GitHub username: ${profile.login} to user ID ${user._id}`);

    // Redirect back to settings page
    res.redirect(`${redirectUrl}/settings?github_connected=true`);
  } catch (error) {
    console.error(`[GITHUB OAUTH ERROR] Callback exchange failed: ${error.message}`);
    if (state && (state.includes('login') || !state.includes('userId'))) {
      res.redirect(`${redirectUrl}/login?error=${encodeURIComponent(error.message)}`);
    } else {
      res.redirect(`${redirectUrl}/settings?github_error=${encodeURIComponent(error.message)}`);
    }
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

    // Speed up database upserts by running them in parallel
    const upsertPromises = liveRepos.map(r => {
      return Repository.findOneAndUpdate(
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
    });

    const savedRepos = await Promise.all(upsertPromises);

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
