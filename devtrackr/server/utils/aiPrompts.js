/**
 * Gemini prompts templates utility.
 * Guarantees standard structured JSON responses from the LLM model.
 */

function sprintSummaryPrompt(repoName, commits, prs, issues) {
  return `You are an expert developer productivity analyzer. Analyze the following GitHub activity for the repository "${repoName}" over the past sprint and provide a structured summary.
  
Commits data:
${JSON.stringify(commits.slice(0, 50), null, 2)}

Pull Requests:
${JSON.stringify(prs.slice(0, 30), null, 2)}

Issues:
${JSON.stringify(issues.slice(0, 30), null, 2)}

RESPONSE FORMAT INSTRUCTIONS:
Return a valid, pure JSON object exactly matching the schema below. DO NOT wrap the response in markdown code blocks like \`\`\`json. Return only the raw JSON string.

Schema:
{
  "summary": "High-level summary of the sprint achievements, velocity, and focus area.",
  "sprintHealth": "on-track" | "at-risk" | "blocked",
  "achievements": [
    "achievement 1",
    "achievement 2"
  ],
  "blockers": [
    "blocker or warning 1",
    "blocker or warning 2"
  ],
  "recommendations": [
    "actionable recommendation 1",
    "actionable recommendation 2"
  ]
}`;
}

function commitInsightsPrompt(commits) {
  return `You are an expert software architect. Analyze these recent commits for developer activity patterns, code churn, code quality, and anomalies.

Commits data:
${JSON.stringify(commits.slice(0, 60), null, 2)}

RESPONSE FORMAT INSTRUCTIONS:
Return a valid, pure JSON object exactly matching the schema below. DO NOT wrap the response in markdown code blocks. Return only raw JSON.

Schema:
{
  "summary": "Overview of code modifications and contribution style.",
  "patterns": "Observed coding patterns (e.g., small frequent commits vs massive batch PRs, focus areas, refactoring versus feature work).",
  "churnScore": 0-100 value representing how volatile the codebase changes are,
  "messageQuality": "Brief analysis of commit message clarity and description hygiene.",
  "anomalies": [
    "any identified anomalies like massive file deletions, potential password leaks, or uncharacteristic pushes"
  ],
  "recommendations": [
    "actionable code layout advice based on commits"
  ]
}`;
}

function bottleneckPrompt(prs, issues, contributors) {
  return `You are a senior technical manager. Detect workflow bottlenecks, stale PRs, orphaned issues, inactive contributors, and code hot spots.

Pull Requests:
${JSON.stringify(prs.slice(0, 40), null, 2)}

Issues:
${JSON.stringify(issues.slice(0, 40), null, 2)}

Contributors & Last Active details:
${JSON.stringify(contributors, null, 2)}

RESPONSE FORMAT INSTRUCTIONS:
Return a valid, pure JSON object exactly matching the schema below. DO NOT wrap the response in markdown code blocks. Return only raw JSON.

Schema:
{
  "summary": "Overall workflow bottleneck summary.",
  "stalePRs": [
    { "number": 12, "title": "PR Title", "assignee": "username", "daysOpen": 14, "reason": "why it's bottlenecked" }
  ],
  "orphanedIssues": [
    { "number": 45, "title": "Issue Title", "daysOpen": 30, "reason": "unassigned or stagnant" }
  ],
  "inactiveContributors": [
    { "login": "username", "daysSinceLastCommit": 18 }
  ],
  "hotspots": [
    "Files or areas showing excessive volatility, churn, or review delays"
  ],
  "recommendations": [
    "Actionable workflow improvement steps"
  ]
}`;
}

function taskPrioritizationPrompt(issues, prs) {
  return `You are a product owner. Analyze this backlog of open issues and pending pull requests, and prioritize them using impact, effort, and blocker analysis.

Open Issues:
${JSON.stringify(issues.filter(i => i.state === 'open').slice(0, 30), null, 2)}

Pending Pull Requests:
${JSON.stringify(prs.filter(p => p.state === 'open').slice(0, 30), null, 2)}

RESPONSE FORMAT INSTRUCTIONS:
Return a valid, pure JSON object exactly matching the schema below. DO NOT wrap the response in markdown code blocks. Return only raw JSON.

Schema:
{
  "summary": "Strategic overview of backlog focus.",
  "prioritized": [
    {
      "id": "Issue # number or PR # number",
      "title": "Title of work",
      "type": "issue" | "pr",
      "priority": "critical" | "high" | "medium" | "low",
      "reasoning": "Clear strategic explanation for this specific priority level."
    }
  ],
  "recommendations": [
    "High level backlog health improvement suggestion"
  ]
}`;
}

module.exports = {
  sprintSummaryPrompt,
  commitInsightsPrompt,
  bottleneckPrompt,
  taskPrioritizationPrompt
};
