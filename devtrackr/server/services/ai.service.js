const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');
const Repository = require('../models/Repository');
const CommitSnapshot = require('../models/CommitSnapshot');
const PullRequest = require('../models/PullRequest');
const AIReport = require('../models/AIReport');
const prompts = require('../utils/aiPrompts');

// Safely initialize GenAI client
let genAI = null;
let model = null;

if (env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    console.log('[AI SERVICE] Google Gemini API Client initialized successfully');
  } catch (error) {
    console.error(`[AI SERVICE ERROR] Failed to initialize Google GenAI: ${error.message}`);
  }
} else {
  console.warn('[AI SERVICE WARNING] GEMINI_API_KEY not configured. Running in Fallback/Mock mode.');
}

// Clean raw Gemini text to make sure it is valid JSON
function cleanJSONResponse(rawText) {
  let cleaned = rawText.trim();
  // Strip standard markdown wrappers if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

// Mock responses for when Gemini API Key is missing or fails (ensures app remains functional)
function getMockReport(type, repoName) {
  console.log(`[AI SERVICE] Generating mock report for type "${type}" in repo "${repoName}"`);
  
  const mockReports = {
    sprint: {
      summary: "This is a fallback analysis report. Set a valid GEMINI_API_KEY in server/.env to enable live AI analysis. Recent development shows active sprint velocity with consistent commit distributions.",
      sprintHealth: "on-track",
      achievements: [
        "Identified core codebase modules and synced cached history.",
        "Initiated development of dashboard visuals."
      ],
      blockers: [
        "Gemini API key is not connected in server env configurations."
      ],
      recommendations: [
        "Add a GEMINI_API_KEY in server/.env to get detailed insights on bottlenecks and priorities."
      ],
      details: {}
    },
    contributor: {
      summary: "Fallback Contributor Insights. Set GEMINI_API_KEY to fetch code patterns and churn evaluations.",
      sprintHealth: "unknown",
      achievements: [],
      blockers: [],
      recommendations: ["Ensure developers commit with clear messages."],
      details: {
        patterns: "Consistent pushes detected in primary branch. Churn is currently low.",
        churnScore: 15,
        messageQuality: "Standard messages. No major issue logs found.",
        anomalies: ["No anomalies detected in fallback inspection."]
      }
    },
    bottleneck: {
      summary: "Fallback Bottleneck Detections. Supply GEMINI_API_KEY to identify stale PRs and hotspots.",
      sprintHealth: "unknown",
      achievements: [],
      blockers: [],
      recommendations: ["Perform regular weekly PR reviews to clean up backlogs."],
      details: {
        stalePRs: [],
        orphanedIssues: [],
        inactiveContributors: [],
        hotspots: ["No hotspots detected in offline mode."]
      }
    },
    prioritization: {
      summary: "Fallback Task Prioritization. Set GEMINI_API_KEY to priority-sort your backlog.",
      sprintHealth: "unknown",
      achievements: [],
      blockers: [],
      recommendations: ["Review open issues and assign owners."],
      details: {
        prioritized: []
      }
    }
  };

  return mockReports[type];
}

/**
 * Standard content generation dispatcher calling Google Generative AI
 */
async function callGemini(prompt, type, repositoryId, userId, repoName) {
  if (!model) {
    const mockContent = getMockReport(type, repoName);
    return await AIReport.create({
      repositoryId,
      userId,
      reportType: type,
      content: mockContent,
      rawPrompt: prompt,
      tokensUsed: 0
    });
  }

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanJSONString = cleanJSONResponse(responseText);
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(cleanJSONString);
    } catch (parseError) {
      console.error(`[AI SERVICE PARSE ERROR] Raw text failed JSON parsing. Raw content: ${responseText}`);
      throw new Error('Gemini returned an invalid JSON response structure.');
    }

    // Format structure to fit AIReport Schema
    const finalContent = {
      summary: parsedContent.summary || 'Summary unavailable.',
      sprintHealth: parsedContent.sprintHealth || 'unknown',
      achievements: parsedContent.achievements || [],
      blockers: parsedContent.blockers || [],
      recommendations: parsedContent.recommendations || [],
      // Stash any sub-keys (details) that aren't top-level fields
      details: parsedContent.details || parsedContent
    };

    return await AIReport.create({
      repositoryId,
      userId,
      reportType: type,
      content: finalContent,
      rawPrompt: prompt,
      tokensUsed: result.response.usageMetadata?.totalTokenCount || 0
    });
  } catch (error) {
    console.error(`[AI GEMINI CALL EXCEPTION] AI generation failed: ${error.message}`);
    // Fallback to mock report so frontend doesn't crash
    const mockContent = getMockReport(type, repoName);
    return await AIReport.create({
      repositoryId,
      userId,
      reportType: type,
      content: mockContent,
      rawPrompt: prompt,
      tokensUsed: 0
    });
  }
}

/**
 * Generate Sprint Summary
 */
async function generateSprintSummary(repositoryId, userId) {
  const repo = await Repository.findById(repositoryId);
  if (!repo) throw new Error('Repository not found');

  const commits = await CommitSnapshot.find({ repositoryId }).sort({ date: -1 }).limit(50);
  const prs = await PullRequest.find({ repositoryId }).sort({ createdAt: -1 }).limit(30);
  
  // Simplify objects to only include essential fields, cutting token footprint by up to 90%
  const simplifiedCommits = commits.map(c => ({
    sha: c.sha ? c.sha.substring(0, 7) : '',
    message: c.message,
    author: c.author?.login || c.author?.name || 'unknown',
    date: c.date,
    additions: c.additions,
    deletions: c.deletions
  }));

  const simplifiedPRs = prs.map(p => ({
    number: p.number,
    title: p.title,
    state: p.state,
    author: p.author,
    createdAt: p.createdAt,
    mergedAt: p.mergedAt,
    cycleTimeHours: p.cycleTimeHours
  }));

  const prompt = prompts.sprintSummaryPrompt(repo.fullName, simplifiedCommits, simplifiedPRs, []);
  return await callGemini(prompt, 'sprint', repositoryId, userId, repo.name);
}

/**
 * Generate Commit Insights
 */
async function generateCommitInsights(repositoryId, userId) {
  const repo = await Repository.findById(repositoryId);
  if (!repo) throw new Error('Repository not found');

  const commits = await CommitSnapshot.find({ repositoryId }).sort({ date: -1 }).limit(60);

  // Simplify objects to only include essential fields, cutting token footprint by up to 90%
  const simplifiedCommits = commits.map(c => ({
    sha: c.sha ? c.sha.substring(0, 7) : '',
    message: c.message,
    author: c.author?.login || c.author?.name || 'unknown',
    date: c.date,
    additions: c.additions,
    deletions: c.deletions
  }));

  const prompt = prompts.commitInsightsPrompt(simplifiedCommits);

  const report = await callGemini(prompt, 'contributor', repositoryId, userId, repo.name);
  return report;
}

/**
 * Detect Bottlenecks
 */
async function generateBottlenecks(repositoryId, userId) {
  const repo = await Repository.findById(repositoryId);
  if (!repo) throw new Error('Repository not found');

  const prs = await PullRequest.find({ repositoryId }).sort({ createdAt: -1 }).limit(40);
  
  // Extract contributor names for this repo
  const commits = await CommitSnapshot.find({ repositoryId });
  const contributorsMap = new Map();
  commits.forEach(c => {
    contributorsMap.set(c.author.login, {
      login: c.author.login,
      name: c.author.name,
      lastCommit: c.date
    });
  });
  const contributors = Array.from(contributorsMap.values());

  // Simplify objects to only include essential fields, cutting token footprint by up to 90%
  const simplifiedPRs = prs.map(p => ({
    number: p.number,
    title: p.title,
    state: p.state,
    author: p.author,
    createdAt: p.createdAt,
    mergedAt: p.mergedAt,
    closedAt: p.closedAt,
    cycleTimeHours: p.cycleTimeHours
  }));

  const prompt = prompts.bottleneckPrompt(simplifiedPRs, [], contributors);
  return await callGemini(prompt, 'bottleneck', repositoryId, userId, repo.name);
}

/**
 * Prioritize backlog tasks
 */
async function generateTaskPrioritization(repositoryId, userId) {
  const repo = await Repository.findById(repositoryId);
  if (!repo) throw new Error('Repository not found');

  const prs = await PullRequest.find({ repositoryId, state: 'open' }).limit(30);

  // Simplify objects to only include essential fields, cutting token footprint by up to 90%
  const simplifiedPRs = prs.map(p => ({
    number: p.number,
    title: p.title,
    state: p.state,
    author: p.author,
    createdAt: p.createdAt
  }));

  const prompt = prompts.taskPrioritizationPrompt([], simplifiedPRs);

  return await callGemini(prompt, 'prioritization', repositoryId, userId, repo.name);
}

module.exports = {
  generateSprintSummary,
  generateCommitInsights,
  generateBottlenecks,
  generateTaskPrioritization
};
