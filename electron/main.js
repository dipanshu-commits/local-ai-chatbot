const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const waitOn = require('wait-on')

let mainWindow
let tray
let backendProcess

function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend')
  const venvPython = path.join(backendPath, 'venv', 'Scripts', 'python.exe')

  backendProcess = spawn(venvPython, ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000'], {
    cwd: backendPath,
    windowsHide: true,
  })

  backendProcess.stdout.on('data', (data) => console.log(`Backend: ${data}`))
  backendProcess.stderr.on('data', (data) => console.log(`Backend: ${data}`))
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  })

  ipcMain.on('minimize', () => mainWindow.minimize())
  ipcMain.on('maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize()
    else mainWindow.maximize()
  })
  ipcMain.on('close', () => mainWindow.hide())

  waitOn({ resources: ['http://localhost:5173'], timeout: 30000 })
    .then(() => { mainWindow.loadURL('http://localhost:5173'); mainWindow.show() })
    .catch(() => { mainWindow.loadURL('http://localhost:5173'); mainWindow.show() })

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) { e.preventDefault(); mainWindow.hide() }
  })
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVFiF7ZdNaBNBFMd/M5uNSTRNbBuqFi2KUBEPKh48eFAvHjyIFy8eBMGLBw8ePIiHgAcPHjx48ODBi4iIiIiIBw8ePIiIiIiIiIiIiIiIiIiIiIgX7/5n3+7OzpvZ3WTjwoKQ3Ttvdt78Z97Me/MWRERERERERJoQkXuqOlXXoKpeB+aB0Qa4BZwGhoEHwElVvaeqk6p6uamgqpuBE8BJ4BUwC3QD3cBOYB9wBNgN9Lk9F3cBO4AtQAHYBuwFDgKHgb3ALmA/MAAsAfPAQr3Wrl3gC7AemAXWZX8AAAAASUVORK5CYII='
  )

  tray = new Tray(icon)
  const contextMenu = Menu.buildFromTemplate([
    { label: '🧠 Local AI', enabled: false },
    { type: 'separator' },
    { label: '✅ Open', click: () => { mainWindow.show(); mainWindow.focus() } },
    { type: 'separator' },
    { label: '❌ Quit', click: () => { app.isQuitting = true; app.quit() } },
  ])

  tray.setToolTip('Local AI — Running')
  tray.setContextMenu(contextMenu)
  tray.on('click', () => { mainWindow.show(); mainWindow.focus() })
}

app.whenReady().then(() => {
  startBackend()
  createWindow()
  createTray()
})

app.on('window-all-closed', (e) => { e.preventDefault() })
app.on('before-quit', () => { if (backendProcess) backendProcess.kill() })