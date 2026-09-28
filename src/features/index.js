// Feature registry. To add a feature: create a file here and list it below.
//
// A feature is a plain object; every member is optional:
//   id              unique name
//   repoDefaults    default per-repo options (merged into a newly added repo)
//   globalDefaults  default global settings
//   repoFields      UI fields per repo     [{ key, type: 'toggle'|'text'|'number', label, placeholder?, unit?, min? }]
//   globalFields    UI fields for settings (same shape)
//   start()                 app started (cfg is loaded)
//   repoAdded(repo)         a repo was added
//   repoUpdated(repo)       a repo option changed
//   repoRemoved(repo)       a repo was removed
//   settingsChanged()       a global setting changed
//   check(repo)             user pressed "Jetzt prüfen" (may be async)
// Use `require('../ctx')` for config, setStatus, notify and guarded.
module.exports = [
  require('./autoPull'),
  require('./autoCommit'),
];
