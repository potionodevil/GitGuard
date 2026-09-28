// Feature: watch files, then commit (generated message) and push after a quiet period.
const fs = require('fs');
const ctx = require('../ctx');
const { commitAndPush } = require('../git');

const watchers = {}, timers = {};

const commitRepo = (r) => ctx.guarded(r.path, async () => {
  const m = await commitAndPush(r.path, r);
  if (m) ctx.setStatus(r.path, `Committed: ${m}`);
});

function watch(r) {
  if (watchers[r.path] || !r.commit) return;
  // ponytail: recursive fs.watch (Windows + Linux Node>=20); chokidar if events get flaky
  watchers[r.path] = fs.watch(r.path, { recursive: true }, (_, f) => {
    if (!f || /(^|[\\/])(\.git|node_modules)([\\/]|$)/.test(f)) return;
    clearTimeout(timers[r.path]);
    timers[r.path] = setTimeout(() => commitRepo(r), ctx.cfg.settings.debounceSec * 1000);
  });
}
function unwatch(r) {
  watchers[r.path]?.close(); delete watchers[r.path]; clearTimeout(timers[r.path]);
}

module.exports = {
  id: 'autoCommit',
  repoDefaults: { commit: false, feature: false, branch: '' },
  globalDefaults: { debounceSec: 30 },
  repoFields: [
    { key: 'commit', type: 'toggle', label: 'Auto-Commit & Push' },
    { key: 'feature', type: 'toggle', label: 'Feature-Branch' },
    { key: 'branch', type: 'text', label: 'Ziel-Branch', placeholder: 'aktueller' },
  ],
  globalFields: [{ key: 'debounceSec', type: 'number', label: 'Commit nach', unit: 's Ruhe', min: 5 }],

  start() { ctx.cfg.repos.forEach(watch); },
  repoUpdated: (r) => (r.commit ? watch(r) : unwatch(r)),
  repoRemoved: unwatch,
  check: (r) => r.commit && commitRepo(r),
};
