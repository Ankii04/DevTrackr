const mongoose = require('mongoose');
const CommitSnapshot = require('../models/CommitSnapshot');
const PullRequest = require('../models/PullRequest');
const Repository = require('../models/Repository');

/**
 * Get commit frequency aggregated by day over the last 'days'
 */
async function getCommitFrequency(repositoryId, days = null) {
  let startDate = new Date();

  if (days && days !== 30) {
    startDate.setDate(startDate.getDate() - days);
  } else {
    // Find the earliest commit for this repository
    const earliestCommit = await CommitSnapshot.findOne({
      repositoryId: new mongoose.Types.ObjectId(repositoryId)
    }).sort({ date: 1 });

    if (earliestCommit && earliestCommit.date) {
      startDate = new Date(earliestCommit.date);
      startDate.setHours(0, 0, 0, 0);

      // Ensure a minimum visual window of 30 days so the chart remains aesthetically spacious
      const diffTime = Math.abs(new Date() - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 30) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
    } else {
      startDate.setDate(startDate.getDate() - 30); // Default to last 30 days if no commits
    }
  }

  const stats = await CommitSnapshot.aggregate([
    {
      $match: {
        repositoryId: new mongoose.Types.ObjectId(repositoryId),
        date: { $gte: startDate }
      }
    },
    {
      $project: {
        day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
      }
    },
    {
      $group: {
        _id: "$day",
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  // Fill in empty days with 0 commits to make the line chart continuous
  const result = [];
  const curr = new Date(startDate);
  const end = new Date();
  
  const statsMap = new Map(stats.map(s => [s._id, s.count]));

  while (curr <= end) {
    const formatted = curr.toISOString().split('T')[0];
    result.push({
      date: formatted,
      commits: statsMap.get(formatted) || 0
    });
    curr.setDate(curr.getDate() + 1);
  }

  return result;
}

/**
 * Get top contributors with commits, additions, and deletions
 */
async function getContributorStats(repositoryId) {
  return await CommitSnapshot.aggregate([
    {
      $match: {
        repositoryId: new mongoose.Types.ObjectId(repositoryId)
      }
    },
    {
      $group: {
        _id: "$author.login",
        name: { $first: "$author.name" },
        avatarUrl: { $first: "$author.avatarUrl" },
        commits: { $sum: 1 },
        additions: { $sum: "$additions" },
        deletions: { $sum: "$deletions" },
        lastCommitDate: { $max: "$date" }
      }
    },
    {
      $sort: { commits: -1 }
    }
  ]);
}

/**
 * Get inactive contributors who have not committed in thresholdDays
 */
async function getInactiveContributors(repositoryId, thresholdDays = 14) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

  const contributors = await CommitSnapshot.aggregate([
    {
      $match: {
        repositoryId: new mongoose.Types.ObjectId(repositoryId)
      }
    },
    {
      $group: {
        _id: "$author.login",
        name: { $first: "$author.name" },
        avatarUrl: { $first: "$author.avatarUrl" },
        lastCommitDate: { $max: "$date" }
      }
    }
  ]);

  return contributors.filter(c => c.lastCommitDate < cutoffDate);
}

/**
 * Get PR statistics and average cycle time
 */
async function getPRStats(repositoryId) {
  const prList = await PullRequest.find({ repositoryId });
  
  let openCount = 0;
  let closedCount = 0;
  let mergedCount = 0;
  let totalCycleTimeHours = 0;
  let closedWithCycleTimeCount = 0;

  prList.forEach(pr => {
    if (pr.state === 'open') {
      openCount++;
    } else if (pr.state === 'merged') {
      mergedCount++;
    } else {
      closedCount++;
    }

    if (pr.cycleTimeHours !== null) {
      totalCycleTimeHours += pr.cycleTimeHours;
      closedWithCycleTimeCount++;
    }
  });

  const avgCycleTimeHours = closedWithCycleTimeCount > 0 
    ? parseFloat((totalCycleTimeHours / closedWithCycleTimeCount).toFixed(2)) 
    : 0;

  return {
    open: openCount,
    closed: closedCount,
    merged: mergedCount,
    total: prList.length,
    avgCycleTimeHours
  };
}

/**
 * Get sprint velocity (weekly commits for the last 4 weeks)
 */
async function getSprintVelocity(repositoryId) {
  const velocity = [];
  const now = new Date();

  for (let i = 3; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - (i + 1) * 7);
    const end = new Date(now);
    end.setDate(now.getDate() - i * 7);

    const count = await CommitSnapshot.countDocuments({
      repositoryId,
      date: { $gte: start, $lt: end }
    });

    velocity.push({
      week: `Week ${4 - i}`,
      commits: count,
      range: `${start.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} - ${end.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`
    });
  }

  return velocity;
}

module.exports = {
  getCommitFrequency,
  getContributorStats,
  getInactiveContributors,
  getPRStats,
  getSprintVelocity
};
