# Touwers - Tower Defense Game

A modular tower defense game built with Node.js and HTML5 Canvas.

## Setup

```bash
npm install
npm start
```

Visit `http://localhost:3000`

## Deploy to Render

1. Push code to GitHub
2. Connect repository to Render
3. Render will auto-detect `render.yaml`

## Project Structure

- `/public/js/towers/` - Add new tower types here
- `/public/js/enemies/` - Add new enemy types here
- `/public/js/Level.js` - Modify or add levels

## Expanding

### Add New Tower
Create new file in `towers/` extending base tower pattern, register in `TowerManager.js`

### Add New Enemy
Create new file in `enemies/` extending base enemy pattern, use in `EnemyManager.js`

## Mobile/APK Conversion
Use Cordova or Capacitor to wrap the web app into an APK.
