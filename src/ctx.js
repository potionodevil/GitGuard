// Shared context handed to features: config, status reporting, notifications, per-repo lock.
// Features only need `require('../ctx')` – nothing else from the core.
const fs = require('fs');
const path = require('path');
const { app, Notification } = require('electron');
const EventEmitter = require('events');

const file = path.join(app.getPath('userData'), 'config.json');
const cfg = { settings: {}, repos: [] };
try { Object.assign(cfg, JSON.parse(fs.readFileSync(file, 'utf8'))); } catch {}
const save = () => fs.writeFileSync(file, JSON.stringify(cfg, null, 1));

const bus = new EventEmitter();      // 'change' -> UI should re-render
const status = {};                   // repo path -> { text, kind: 'ok' | 'error', time }
const setStatus = (p, text, kind = 'ok') => { status[p] = { text, kind, time: Date.now() }; bus.emit('change'); };
const notify = (body) => new Notification({ title: 'GitGuard', body }).show();

const busy = new Set();
// Run fn exclusively per repo; errors become status + notification instead of crashes.
async function guarded(p, fn) {
  if (busy.has(p)) return;
  busy.add(p);
  try { await fn(); } catch (e) {
    const m = e.message.split('\n')[0];
    setStatus(p, m, 'error'); notify(`${path.basename(p)}: ${m}`);
  } finally { busy.delete(p); }
}

module.exports = { cfg, save, bus, status, setStatus, notify, guarded };
