const git = require('./run');
const { commitMessage } = require('./message');

// Fetch; fast-forward pull if the remote has new commits. Returns a status string.
async function pull(repo) {
  const branch = await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD');
  try { await git(repo, 'rev-parse', '@{u}'); } catch { return 'kein Upstream'; }
  await git(repo, 'fetch');
  const behind = +(await git(repo, 'rev-list', '--count', 'HEAD..@{u}'));
  if (!behind) return `aktuell (${branch})`;
  await git(repo, 'pull', '--ff-only');
  return `${behind} neue Commit(s) gepullt`;
}

// Commit all changes (if any) with a generated message and push. Returns the message or null.
// opts: { branch: target branch or '', feature: create feature/auto-* branch }
async function commitAndPush(repo, opts = {}) {
  if (!(await git(repo, 'status', '--porcelain'))) return null;
  const cur = await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD');
  if (opts.feature) {
    if (!cur.startsWith('feature/auto-')) {
      const t = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
      await git(repo, 'switch', '-c', `feature/auto-${t}`);
    }
  } else if (opts.branch && opts.branch !== cur) {
    try { await git(repo, 'switch', opts.branch); } catch { await git(repo, 'switch', '-c', opts.branch); }
  }
  await git(repo, 'add', '-A');
  const ns = await git(repo, 'diff', '--cached', '--name-status', '-M');
  if (!ns) return null;
  const msg = commitMessage(ns, await git(repo, 'diff', '--cached', '--numstat', '-M'));
  await git(repo, 'commit', '-m', msg);
  try { await git(repo, 'push', '-u', 'origin', 'HEAD'); }
  catch { // remote moved on: rebase our commit on top, then retry once
    await git(repo, 'pull', '--rebase', 'origin', await git(repo, 'rev-parse', '--abbrev-ref', 'HEAD'));
    await git(repo, 'push', '-u', 'origin', 'HEAD');
  }
  return msg;
}

module.exports = { pull, commitAndPush };
