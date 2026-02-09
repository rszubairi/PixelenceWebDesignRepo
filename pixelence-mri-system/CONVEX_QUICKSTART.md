# Convex Quick Start Guide

## Current Issue
You're seeing the error: `Module not found: Can't resolve '../convex/_generated/api'`

This is because the `_generated` folder hasn't been created yet. This folder contains auto-generated TypeScript/JavaScript API files that your code imports.

## Solution: Run Convex Dev Server

### Step 1: Open Terminal
Open a terminal in VS Code (Terminal → New Terminal)

### Step 2: Navigate to Project
```bash
cd pixelence-mri-system
```

### Step 3: Start Convex Dev
```bash
npx convex dev
```

### What Will Happen:
1. **If not logged in:** You'll be prompted to log in to your Convex account
   - It will open a browser window for authentication
   - Follow the prompts to log in

2. **Project Selection:** It should detect your existing project "pixelence-web"
   - Confirm the selection if prompted

3. **Code Generation:** Convex will:
   - Push your schema (convex/schema.js) to the cloud
   - Generate the `convex/_generated/` folder locally
   - Keep watching for changes

4. **Success!** You'll see output like:
   ```
   ✓ Convex functions ready! (XX functions in XX modules)
   ```

### Step 4: Keep It Running
- Keep the `npx convex dev` process running in your terminal
- This watches for changes to your Convex functions
- In a separate terminal, you can run your Next.js app:
  ```bash
  npm run dev
  ```

## After First Run

Once `_generated` folder is created, you can:
- Run your Next.js app: `npm run dev`
- The import errors will be resolved

## Initialize Default Admin User

After the app is running, you can initialize the default admin user:

1. Open your browser to your Next.js app (usually http://localhost:3000)
2. Open browser console (F12)
3. Run this in the console to create the admin user:
   ```javascript
   // This will create the default admin user
   // Email: admin@pixelenceai.com
   // Password: Click123*
   ```

Or you can use the Convex dashboard to run the mutation manually:
- Go to https://dashboard.convex.dev
- Select your project "pixelence-web"
- Navigate to Functions
- Find `auth:initializeDefaultAdmin`
- Click "Run" to execute it

## Troubleshooting

### "You don't have access to the selected project"
- Make sure you're logged in with the correct Convex account
- Verify you have access to the "pixelence-web" project
- Contact your team admin if you need access

### "Cannot prompt for input in non-interactive terminals"
- You must run `npx convex dev` in an interactive terminal
- Use VS Code's built-in terminal or your system terminal
- Cannot run through automated scripts

### _generated folder not appearing
- Make sure `npx convex dev` completed successfully
- Check for any error messages in the output
- Verify convex.json has correct configuration

## Current Configuration

Your project is already configured:
- **Project:** pixelence-web
- **Team:** raheel-zubairi
- **Deployment:** dev:adorable-dogfish-822
- **URL:** https://adorable-dogfish-822.eu-west-1.convex.cloud

All you need to do is run `npx convex dev` in an interactive terminal!