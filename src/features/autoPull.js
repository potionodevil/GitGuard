// Feature: periodically fetch and fast-forward pull.
const ctx = require('../ctx');
const { pull } = require('../git');

const pullRepo = (r) => ctx.guarded(r.path, async () => {
  if (r.pull) ctx.setStatus(r.path, await pull(r.path));
});
let timer;
const schedule = () => {
  clearInterval(timer);
  timer = setInterval(() => ctx.cfg.repos.forEach(pullRepo), Math.max(1, ctx.cfg.settings.pullMin) * 60000);
};

module.exports = {
  id: 'autoPull',
  repoDefaults: { pull: true },
  globalDefaults: { pullMin: 60 },
  repoFields: [{ key: 'pull', type: 'toggle', label: 'Auto-Pull' }],
  globalFields: [{ key: 'pullMin', type: 'number', label: 'Pull alle', unit: 'min', min: 1 }],

  start() { ctx.cfg.repos.forEach(pullRepo); schedule(); },
  repoAdded: pullRepo,
  settingsChanged: schedule,
  check: pullRepo,
};
