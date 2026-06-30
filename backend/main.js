const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Sunucuyu başlat
require('./server');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 720,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'build/icon.png')
    });

    // Ana menüyü gizle (Tasarımın aynısı olması için tarayıcı sekmesi gibi görünmesin)
    Menu.setApplicationMenu(null);

    // Ana pencereyi localhost'a yönlendir (server.js üzerinden)
    const port = process.env.PORT || 3000;
    mainWindow.loadURL(`http://localhost:${port}`);

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
