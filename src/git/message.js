const path = require('path');

// Short commit message from `git diff --cached --name-status` + `--numstat` output.
function commitMessage(nameStatus, numstat = '') {
  const verbs = { A: 'add', M: 'update', D: 'remove', R: 'rename', C: 'add', T: 'update' };
  const files = nameStatus.split('\n').filter(Boolean).map(l => {
    const [s, ...p] = l.split('\t');
    return { verb: verbs[s[0]] || 'update', file: p[p.length - 1] };
  });
  if (!files.length) return '';
  let add = 0, del = 0;
  for (const l of numstat.split('\n').filter(Boolean)) {
    const [a, d] = l.split('\t');
    add += +a || 0; del += +d || 0;
  }
  const stat = ` (+${add}/-${del})`;
  let msg;
  if (files.length <= 3) {
    const by = {};
    for (const f of files) (by[f.verb] ||= []).push(path.posix.basename(f.file));
    msg = Object.entries(by).map(([v, n]) => `${v} ${n.join(', ')}`).join('; ');
    msg = msg[0].toUpperCase() + msg.slice(1);
  } else {
    const dirs = [...new Set(files.map(f => path.posix.dirname(f.file)))].slice(0, 3);
    const c = {};
    for (const f of files) c[f.verb] = (c[f.verb] || 0) + 1;
    const kinds = Object.entries(c).map(([v, n]) => `${n} ${v}`).join(', ');
    msg = `Update ${files.length} files (${kinds}) in ${dirs.join(', ')}`;
  }
  const max = 72 - stat.length;
  if (msg.length > max) msg = msg.slice(0, max - 1) + '…';
  return msg + stat;
}

module.exports = { commitMessage };
