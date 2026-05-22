/**
 * Helper to parse repository owner and repository name from the "owner/repo" full name
 */
function parseRepoFullName(fullName) {
  if (!fullName || !fullName.includes('/')) {
    throw new Error('Invalid repository full name format. Expected "owner/repo"');
  }
  const parts = fullName.split('/');
  return {
    owner: parts[0],
    name: parts[1]
  };
}

module.exports = {
  parseRepoFullName
};
