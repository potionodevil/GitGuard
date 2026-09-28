const { execFile } = require('child_process');

// Run `git <args>` in cwd; resolves trimmed stdout, rejects with git's stderr.
module.exports = (cwd, ...args) => new Promise((res, rej) =>
  execFile('git', args, { cwd, maxBuffer: 1e7 }, (e, out, err) =>
    e ? rej(new Error((err || e.message).trim())) : res(out.trim())));
