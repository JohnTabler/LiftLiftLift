// github.jsx — GitHub API read/write helper
// Exposes: window.GH.readFile(path), window.GH.writeFile(path, data)

window.GH = (() => {
  const getConfig = () => ({
    token: localStorage.getItem('gh_token'),
    owner: localStorage.getItem('gh_owner'),
    repo:  localStorage.getItem('gh_repo'),
    branch: localStorage.getItem('gh_branch') || 'main',
  });

  const headers = (token) => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    Accept: 'application/vnd.github+json',
  });

  const base = (owner, repo) =>
    `https://api.github.com/repos/${owner}/${repo}/contents`;

  function getActiveProfile() {
    return localStorage.getItem('gh_profile') || 'John';
  }

  async function readFile(filePath) {
    const { token, owner, repo, branch } = getConfig();
    if (!token) throw new Error('No GitHub token configured');
    var profile = getActiveProfile();
    var profiledPath = filePath.startsWith('data/') ? 'data/' + profile + '/' + filePath.slice(5) : filePath;
    const res = await fetch(
      `${base(owner, repo)}/${profiledPath}?ref=${branch}`,
      { headers: headers(token) }
    );
    if (res.status === 404) return null; // file doesn't exist yet
    if (!res.ok) throw new Error(`GitHub read error: ${res.status}`);
    const json = await res.json();
    return {
      data: JSON.parse(atob(json.content.replace(/\n/g, ''))),
      sha: json.sha,
    };
  }

  async function writeFile(filePath, data, commitMsg) {
    const { token, owner, repo, branch } = getConfig();
    if (!token) throw new Error('No GitHub token configured');

    // Get current SHA if file exists (needed for update)
    let sha;
    try {
      const existing = await readFile(filePath);
      if (existing) sha = existing.sha;
    } catch (_) {}

    var profile = getActiveProfile();
    var profiledPath = filePath.startsWith('data/') ? 'data/' + profile + '/' + filePath.slice(5) : filePath;
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const body = {
      message: commitMsg || `Update ${profiledPath}`,
      content,
      branch,
      ...(sha ? { sha } : {}),
    };

    const res = await fetch(`${base(owner, repo)}/${profiledPath}`, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || `GitHub write error: ${res.status}`);
    }
    return res.json();
  }

  async function isConfigured() {
    const { token, owner, repo } = getConfig();
    return !!(token && owner && repo);
  }

  return { readFile, writeFile, isConfigured, getConfig, getActiveProfile };
})();
