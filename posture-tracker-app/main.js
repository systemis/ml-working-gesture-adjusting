const {
  BrowserWindow,
  Tray,
  Notification,
  app,
  ipcMain,
  ipcRenderer,
} = require('electron')

const path = require('path')

// Define variables.
let tray = undefined
let window = undefined

// Don't show the app in the doc
app.dock.hide()
app.on('ready', () => {
  createTray()
  createWindow()
})
app.on('window-all-closed', () => {
  app.quit()
})

const createTray = () => {
  tray = new Tray(path.join(path.join(__dirname, 'assets'), 'icontemplate.jpg'))
  tray.on('right-click', toggleWindow)
  tray.on('double-click', toggleWindow)
  tray.on('click', function (event) {
    toggleWindow()

    // Show devtools when command clicked
    if (window.isVisible() && process.defaultApp && event.metaKey) {
      window.openDevTools({ mode: 'detach' })
    }
  })
}

const getWindowPosition = () => {
  const windowBounds = window.getBounds()
  const trayBounds = tray.getBounds()

  return {
    x: Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2)),
    y: Math.round(trayBounds.y + trayBounds.height + 4)
  }
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 400,
    height: 300,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      backgroundThrottling: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Open debug terminal.
  window.webContents.openDevTools()

  console.log("Notification supported: ", Notification.isSupported());

  ipcMain.on('message', (event, data) => {
    if (Notification.isSupported()) {
      if (data !== null && typeof data === "number" && data >= 0 && data <= 0.25) {
        new Notification({
          title: "Working Gesture Tracker",
          body: "Your're having a bad posture, please adjust your posture to keep healthy.",
        }).show();
      }
    } else {
      console.warn('Notifications are not supported.');
    }
  });

  // Load window interface
  window.loadURL(`file://${path.join(__dirname, 'index.html')}`)
}


const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide()
  } else {
    showWindow()
  }
}

const showWindow = () => {
  const position = getWindowPosition()
  window.setPosition(position.x, position.y, false)
  window.show()
  window.focus()
}


// ipcMain.on('show-notification', (event, data) => {
//   if (Notification.isSupported()) {
//     new Notification(data.title, {
//       body: data.body,
//     }).show();
//   } else {
//     console.warn('Notifications are not supported.');
//   }
// });

// ipcMain.on('open-devtools', (event) => {
//   console.log('recive mesage from client', event);
// })