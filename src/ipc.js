// IPC handlers (renderer -> main) and state push (main -> renderer).
const { ipcMain, dialog } = require('electron');
const ctx = require('./ctx');
const repos = require('./repos');

const snapshot = () => ({ cfg: ctx.cfg, status: ctx.status, schema: repos.schema() });

function setup(getWindow) {
  ctx.bus.on('change', () => {
    const w = getWindow();
    if (w && !w.isDestroyed()) w.webContents.send('state', snapshot());
  });
  ipcMain.handle('state', snapshot);
  ipcMain.handle('add', async () => {
    const d = await dialog.showOpenDialog(getWindow(), { properties: ['openDirectory'] });
    if (!d.canceled) repos.add(d.filePaths[0]);
  });
  ipcMain.handle('update', (_, p, patch) => repos.update(p, patch));
  ipcMain.handle('remove', (_, p) => repos.remove(p));
  ipcMain.handle('settings', (_, patch) => repos.settings(patch));
  ipcMain.handle('check', (_, p) => repos.check(p));
}

module.exports = { setup };
