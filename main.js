// Bootstrap only. Logic lives in src/ (features in src/features).
const { app } = require('electron');
const win = require('./src/window');
const ipc = require('./src/ipc');
const repos = require('./src/repos');

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', win.show);

app.whenReady().then(() => {
  ipc.setup(win.get);
  win.create();
  repos.init();
});
