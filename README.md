# Pomodoro Timer (React + PWA)

Minimal Pomodoro timer built with React, TypeScript, and Vite. The app is installable as a PWA and optimized for desktop, tablet, and mobile layouts.

## Features

- Focus / short break / long break cycle
- Configurable session durations
- End-of-phase sound and vibration
- Browser notifications
- Installable PWA with offline app shell caching

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build for production

```bash
npm run build
npm run preview
```

## PWA notes

- Service worker and manifest are generated through `vite-plugin-pwa`.
- In Chromium browsers, install using the browser install button.
- On iOS, use “Add to Home Screen” from Safari.

## Notifications and vibration

- Click **Enable notifications** in the app to allow browser alerts.
- Vibration support depends on browser/device capabilities.
- If notifications are denied, sound/vibration still run when possible.
