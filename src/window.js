// Main window + tray icon. Closing the window hides it; quit via tray.
const path = require('path');
const { app, BrowserWindow, Tray, Menu, nativeImage } = require('electron');

let win, tray, quitting = false;

function create() {
  win = new BrowserWindow({
    width: 960, height: 680, minWidth: 560, minHeight: 420,
    backgroundColor: '#14191b', autoHideMenuBar: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }, // local page only
  });
  win.loadFile(path.join(__dirname, '..', 'ui', 'index.html'));
  win.on('close', (e) => { if (!quitting) { e.preventDefault(); win.hide(); } });

  const px = Buffer.alloc(16 * 16 * 4);
  for (let i = 0; i < px.length; i += 4) px.set([160, 140, 30, 255], i); // BGRA solid teal
  tray = new Tray(nativeImage.createFromBitmap(px, { width: 16, height: 16 }));
  tray.setToolTip('GitGuard');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Öffnen', click: () => win.show() },
    { label: 'Beenden', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', () => win.show());
  return win;
}

module.exports = { create, get: () => win, show: () => win?.show() };
