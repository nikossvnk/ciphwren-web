# The Ciphwren Web as a local app

Runs the Ciphwren Web (contacts, calendars and tasks) on your own computer, at
`http://localhost:8091`, with an entry in the applications menu and a shortcut on the desktop.

Why locally instead of on a server: the app's code then comes from your own computer, built from
this repository (the one this directory is in), so the server only ever sees encrypted data, like
with the apps on a phone. A web app served by the server could be changed to capture the password
if the server was taken over. It's only reachable from this computer.

It goes well with [Ciphwren Notes](https://github.com/nikossvnk/ciphwren-notes)' local web app, which
uses port 8090 (they don't share a login, as the browser keeps them apart by port).

## Installing (and updating)

Needs Python 3, systemd and Node.js 20.19 or newer (e.g. `sudo dnf install python3 nodejs` on
Fedora, or Node.js through nvm). With a clone of the repository, run the script, from any directory:

```
local-web/install.sh                                     # e.g. from the root of the repository
SERVER=https://etebase.example.com local-web/install.sh  # with your server as the default one
```

It builds the repository it's in (the directory above it, so it has to stay in `local-web/`), with a
note when it has uncommitted changes. To update later:

```
git pull
local-web/install.sh
```

The packages needed to build (`node_modules`, a few hundred MB) are reused when the repository has
them, e.g. because it's also used for development. When it doesn't, they are installed for the build
and removed again afterwards, so the next update installs them again.

Options (environment variables):

| Variable | Default | |
|---|---|---|
| `SERVER` | the one of the last install, otherwise none | The server the login page uses, unless another one is entered under "Advanced settings". Without one, the login page asks for it. It's kept for later updates |
| `PORT` | `8091` | The port on localhost |
| `BROWSER` | the first one found of Chromium, Chrome, Brave, Edge, Firefox | The browser the shortcut opens. Chromium-based browsers open it in an app window, Firefox in a new window |
| `LOW_MEMORY` | `1` | Chromium-based browsers get flags that make them use a bit less memory (no spare page process, at most two, no background downloads, updates or sync); `0` leaves them out |

Then open "Ciphwren Web" from the applications menu or the desktop and log in. Without `SERVER`, enter
your server's URL in the "Server" field. With an account that has no calendar, address book and
task list yet, the app offers to create them.

## What the script sets up

Everything is in your home directory, nothing needs root:

| What | Where |
|---|---|
| The app | `~/.local/share/ciphwren-web/site` |
| The server (`serve.py` from this directory), on 127.0.0.1 only | `~/.local/share/ciphwren-web/serve.py` |
| The service, started when you log in | `~/.config/systemd/user/ciphwren-web.service` |
| The menu entry and the desktop shortcut | `~/.local/share/applications/ciphwren-web.desktop`, `~/Desktop/ciphwren-web.desktop` |

An install made before the app was renamed (in `~/.local/share/etesync-web`, with the service
`etesync-web`) is moved to these names the next time `install.sh` runs, with its default server.

To do the same by hand:

1. In the root of the repository: `npm ci` (if `node_modules` isn't there), then
2. `REACT_APP_DEFAULT_API_PATH=https://your.server/ npx vite build --outDir ~/.local/share/ciphwren-web/site --emptyOutDir`
   (without `REACT_APP_DEFAULT_API_PATH` the login page asks for the server), and remove the `*.map` files in it if you like
3. Copy `serve.py` to `~/.local/share/ciphwren-web/`, and create
   `~/.config/systemd/user/ciphwren-web.service`:

   ```
   [Unit]
   Description=Ciphwren Web, served on http://localhost:8091 (this computer only)

   [Service]
   ExecStart=/usr/bin/python3 %h/.local/share/ciphwren-web/serve.py --port 8091 --dir %h/.local/share/ciphwren-web/site
   Restart=on-failure

   [Install]
   WantedBy=default.target
   ```

   then `systemctl --user daemon-reload && systemctl --user enable --now ciphwren-web`
4. Create `~/.local/share/applications/ciphwren-web.desktop` (and a copy on the desktop, made
   executable):

   ```
   [Desktop Entry]
   Type=Application
   Name=Ciphwren Web
   Exec=chromium --app=http://localhost:8091
   Icon=/home/<you>/.local/share/ciphwren-web/icon.svg
   Categories=Office;Calendar;ContactManagement;
   ```

   (with Firefox: `Exec=firefox --new-window http://localhost:8091`, the icon is `src/images/logo.svg` of the repository)

## Good to know

- The login is kept in the browser's storage for `http://localhost:8091`. Anyone who can use your
  browser profile can use the account, so only use it on your own computer.
- The browser needs the service running to load the app. It syncs with the server every few minutes
  while it's open, and with the refresh button at the top.
- Changing `PORT` later means a new origin for the browser, so you have to log in again.
- To use the calendars and contacts in other apps (Thunderbird, GNOME Calendar, ...) rather than in
  the browser, there's [Ciphwren DAV](https://github.com/nikossvnk/ciphwren-dav).

## Removing it

```
systemctl --user disable --now ciphwren-web
rm -rf ~/.local/share/ciphwren-web ~/.config/systemd/user/ciphwren-web.service \
       ~/.local/share/applications/ciphwren-web.desktop ~/Desktop/ciphwren-web.desktop
systemctl --user daemon-reload
```
