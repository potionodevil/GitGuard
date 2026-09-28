// Self-check: commitMessage() unit cases + end-to-end pull/commit/push against a local bare remote.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { git, findRepos, commitMessage, pull, commitAndPush } = require('../src/git');

// --- commitMessage ---
assert.strictEqual(commitMessage('M\tsrc/app.js', '12\t3\tsrc/app.js'), 'Update app.js (+12/-3)');
assert.strictEqual(commitMessage('A\ta.js\nM\tb.js\nD\tc.js', '5\t0\ta.js\n1\t1\tb.js\n0\t4\tc.js'),
  'Add a.js; update b.js; remove c.js (+6/-5)');
assert.strictEqual(commitMessage('R100\told.js\tnew.js', '0\t0\told.js => new.js'), 'Rename new.js (+0/-0)');
const many = 'M\tsrc/a\nM\tsrc/b\nA\tdocs/c\nM\tsrc/d\nM\tsrc/e';
assert.match(commitMessage(many, ''), /^Update 5 files \(4 update, 1 add\) in src, docs/);
assert.ok(commitMessage('M\t' + 'x'.repeat(200), '').length <= 72);
assert.strictEqual(commitMessage(''), '');

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gg-'));
  const w = (repo, f, c) => fs.writeFileSync(path.join(repo, f), c);
  const init = async (d) => { fs.mkdirSync(d); await git(d, 'init', '-b', 'main'); await git(d, 'config', 'user.email', 't@t'); await git(d, 'config', 'user.name', 't'); };
  const bare = path.join(tmp, 'remote.git'); fs.mkdirSync(bare); await git(bare, 'init', '--bare', '-b', 'main');
  const A = path.join(tmp, 'A'), B = path.join(tmp, 'B');
  await init(A); w(A, 'x.txt', '1'); await git(A, 'add', '-A'); await git(A, 'commit', '-m', 'init');
  await git(A, 'remote', 'add', 'origin', bare); await git(A, 'push', '-u', 'origin', 'main');
  await git(tmp, 'clone', bare, B); await git(B, 'config', 'user.email', 't@t'); await git(B, 'config', 'user.name', 't');

  assert.deepStrictEqual(findRepos(tmp).sort(), [A, B].sort());

  // pull: A pushes, B pulls
  assert.match(await pull(B), /aktuell/);
  w(A, 'y.txt', '2'); assert.ok(await commitAndPush(A));
  assert.match(await pull(B), /1 neue Commit/);
  assert.ok(fs.existsSync(path.join(B, 'y.txt')));

  // nothing to commit
  assert.strictEqual(await commitAndPush(B), null);

  // auto-commit + push on current branch
  w(B, 'z.txt', '3');
  assert.strictEqual(await commitAndPush(B), 'Add z.txt (+1/-0)');
  assert.match(await git(bare, 'log', '-1', '--format=%s', 'main'), /Add z.txt/);

  // target branch
  w(B, 'z.txt', '33');
  await commitAndPush(B, { branch: 'dev' });
  assert.strictEqual(await git(B, 'rev-parse', '--abbrev-ref', 'HEAD'), 'dev');
  assert.match(await git(bare, 'branch', '--list', 'dev'), /dev/);

  // feature branch: main stays untouched
  await git(B, 'switch', 'main'); const before = await git(bare, 'rev-parse', 'main');
  w(B, 'f.txt', 'f');
  await commitAndPush(B, { feature: true });
  assert.match(await git(B, 'rev-parse', '--abbrev-ref', 'HEAD'), /^feature\/auto-/);
  assert.strictEqual(await git(bare, 'rev-parse', 'main'), before);

  // dirty tree + diverging remote file -> pull surfaces an error, no data loss
  await git(B, 'switch', 'main'); await git(A, 'pull'); w(A, 'y.txt', 'remote'); await commitAndPush(A);
  w(B, 'y.txt', 'local-uncommitted');
  await assert.rejects(pull(B));
  assert.strictEqual(fs.readFileSync(path.join(B, 'y.txt'), 'utf8'), 'local-uncommitted');

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('all tests passed');
})().catch(e => { console.error(e); process.exit(1); });
