// Repo registry: add / update / remove, dispatching to features.
const ctx = require('./ctx');
const features = require('./features');
const { findRepos } = require('./git');

const hook = (name, ...a) => features.forEach(f => f[name]?.(...a));
const find = (p) => ctx.cfg.repos.find(r => r.path === p);
const defaults = (key) => Object.assign({}, ...features.map(f => f[key]));

function init() {
  ctx.cfg.settings = { ...defaults('globalDefaults'), ...ctx.cfg.settings };
  ctx.cfg.repos = ctx.cfg.repos.map(r => ({ ...defaults('repoDefaults'), ...r }));
  hook('start');
}

function add(dir) {
  for (const p of findRepos(dir)) {
    if (find(p)) continue;
    const r = { path: p, ...defaults('repoDefaults') };
    ctx.cfg.repos.push(r);
    hook('repoAdded', r);
  }
  ctx.save(); ctx.bus.emit('change');
}

function update(p, patch) {
  const r = find(p); if (!r) return;
  Object.assign(r, patch);
  hook('repoUpdated', r);
  ctx.save(); ctx.bus.emit('change');
}

function remove(p) {
  const r = find(p); if (!r) return;
  hook('repoRemoved', r);
  ctx.cfg.repos = ctx.cfg.repos.filter(x => x !== r);
  delete ctx.status[p];
  ctx.save(); ctx.bus.emit('change');
}

function settings(patch) {
  Object.assign(ctx.cfg.settings, patch);
  hook('settingsChanged');
  ctx.save(); ctx.bus.emit('change');
}

async function check(p) {
  const r = find(p); if (!r) return;
  for (const f of features) await f.check?.(r);   // sequential: features share the repo lock
}

// What the UI needs to render feature options without knowing any feature.
const schema = () => ({
  repo: features.flatMap(f => f.repoFields || []),
  global: features.flatMap(f => f.globalFields || []),
});

module.exports = { init, add, update, remove, settings, check, schema };
