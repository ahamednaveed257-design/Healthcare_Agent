# Healthcare Agent Web

This folder is the deployable web version of the Healthcare Agent.

It is an installable static PWA:

- `index.html` contains the application shell.
- `app.css` contains the responsive care workspace UI.
- `app.js` contains local routing, retrieval, memory, and safety logic.
- `manifest.webmanifest` contains install metadata for iOS, Android, Windows, and macOS browsers.
- `service-worker.js` caches the app shell and local data for offline-capable use.
- `icons/` contains the app logo and install icons.
- `data/medical_faqs.json` contains the medical knowledge base.
- `data/drugs.json` contains medication lookup data.

## Deploy

Use this folder as the publish directory on any static host.

Good options:

- Netlify: publish directory `web`
- Vercel: project root `web`
- Static hosting: publish this folder's contents
- Azure Static Web Apps: app location `web`, output location blank

No build command is required.

## Local Preview

From the project root, run:

```powershell
.\launch_app.cmd
```

The launcher opens the app automatically. `start_local_server.cmd` does the same in a hidden server window.

If port `8501` is busy, the launcher uses the next available port and opens that address.

When served from `localhost`, the app uses the local server store at `.localhost_store/` for patient conversations, profile memory, and access state. Hosted deployments fall back to browser storage.

## Safety

This is a demo assistant for education and triage-style support. It does not diagnose, prescribe, or replace medical care.
