// Renderer. Option fields come from state.schema (see src/features), so it knows no feature by name.
const { ipcRenderer: ipc } = require('electron');
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, c => `&#${c.charCodeAt(0)};`);
const baseName = (p) => p.split(/[\\/]/).filter(Boolean).pop();
const clock = (t) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

function field(f, value) {
  const k = `data-k="${esc(f.key)}"`;
  if (f.type === 'toggle')
    return `<label class="toggle"><input type="checkbox" ${k} ${value ? 'checked' : ''}>${esc(f.label)}</label>`;
  const type = f.type === 'number' ? `type="number" min="${f.min ?? ''}"` : `type="text" placeholder="${esc(f.placeholder || '')}"`;
  return `<label class="field">${esc(f.label)} <input ${type} ${k} value="${esc(value ?? '')}">${esc(f.unit || '')}</label>`;
}

function repo(r, st, fields) {
  const kind = st?.kind || 'idle';
  return `<article class="repo" data-p="${esc(r.path)}">
    <div class="head">
      <span class="dot ${kind}"></span>
      <div class="id"><h2>${esc(baseName(r.path))}</h2><p class="path">${esc(r.path)}</p></div>
      <div class="actions">
        <button class="btn" data-a="check">Jetzt prüfen</button>
        <button class="btn quiet" data-a="remove">Entfernen</button>
      </div>
    </div>
    <p class="status ${kind}">${st ? `${clock(st.time)} · ${esc(st.text)}` : 'Noch nicht geprüft'}</p>
    <div class="opts">${fields.map(f => field(f, r[f.key])).join('')}</div>
  </article>`;
}

const EMPTY = `<div class="empty"><h2>Noch keine Projekte</h2>
  <p>Füge einen Ordner hinzu. GitGuard findet darin alle Git-Repos und hält sie automatisch aktuell.</p></div>`;

// Don't re-render a region while the user types in it.
const typingIn = (el) => el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT';

function render({ cfg, status, schema }) {
  if (!typingIn($('settings'))) $('settings').innerHTML = schema.global.map(f => field(f, cfg.settings[f.key])).join('');
  if (!typingIn($('list')))
    $('list').innerHTML = cfg.repos.map(r => repo(r, status[r.path], schema.repo)).join('') || EMPTY;
}

const value = (t) => t.type === 'checkbox' ? t.checked : t.type === 'number' ? +t.value : t.value.trim();
const pathOf = (el) => el.closest('.repo').dataset.p;

$('settings').onchange = (e) => ipc.invoke('settings', { [e.target.dataset.k]: value(e.target) });
$('list').onchange = (e) => ipc.invoke('update', pathOf(e.target), { [e.target.dataset.k]: value(e.target) });
$('list').onclick = async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  b.classList.add('busy');
  await ipc.invoke(b.dataset.a, pathOf(b));
  b.classList.remove('busy');
};
$('add').onclick = () => ipc.invoke('add');
document.addEventListener('focusout', () => setTimeout(() => ipc.invoke('state').then(render), 50));

ipc.on('state', (_, s) => render(s));
ipc.invoke('state').then(render);
