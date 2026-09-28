const fs = require('fs');
const path = require('path');

// Recursively find repos (depth-limited, skips node_modules and dot-dirs).
function findRepos(dir, depth = 3) {
  if (fs.existsSync(path.join(dir, '.git'))) return [dir];
  if (depth === 0) return [];
  let out = [];
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.isDirectory() && d.name !== 'node_modules' && !d.name.startsWith('.'))
      out = out.concat(findRepos(path.join(dir, d.name), depth - 1));
  }
  return out;
}

module.exports = { findRepos };
