# Quick Start Guide - Login Setup

## Issues Fixed ✓

1. ✅ **Missing Admin User** - Created initialization page to set up default admin
2. ✅ **Missing Logo** - Added Pixelence logo to login page

## How to Initialize the System

### Step 1: Navigate to Initialization Page
Open your browser and go to:
```
http://localhost:3000/initialize
```

### Step 2: Click "Initialize Default Admin User"
- Click the blue button on the page
- This will create the admin user in your Convex database
- You'll see a success message when complete

### Step 3: Go to Login Page
After successful initialization, click "Go to Login Page" or navigate to:
```
http://localhost:3000/login
```

### Step 4: Log In
Use the default credentials:
- **Email:** admin@pixelenceai.com
- **Password:** Click123*

## What Changed

### 1. New Initialization Page (`/initialize`)
- Simple one-click setup for the default admin user
- Creates user with bcrypt-encrypted password
- Shows success/error messages
- Links back to login page

### 2. Updated Login Page
- ✅ Added Pixelence logo at the top
- ✅ Improved layout and design
- ✅ Added link to initialization page
- ✅ All authentication functionality intact

## File Structure

```
pages/
├── login.js          # Updated with logo and improved design
├── initialize.js     # NEW - One-click admin user setup
└── index.js          # Redirects to login or dashboard
```

## Screenshots of Changes

### Login Page Now Includes:
- Pixelence logo (black version)
- Clean, professional layout
- Link to initialization page
- Error messages when login fails

### Initialization Page Features:
- One-click admin creation
- Success/error feedback
- Clear instructions
- Link back to login

## Troubleshooting

### "Invalid email or password"
- Make sure you've run the initialization page first
- Check that you're using the correct credentials
- Email: admin@pixelenceai.com
- Password: Click123* (case-sensitive, includes asterisk)

### Initialization button doesn't work
- Make sure `npx convex dev` is running
- Check browser console for errors
- Verify Convex connection in .env.local

### Logo not showing
- Check that `/public/images/Logo-Black.png` exists
- Clear browser cache and reload
- Check browser console for 404 errors

## Next Steps

After logging in successfully:
1. You'll be redirected to the IT Admin dashboard
2. You can create additional users through the system
3. Explore the various features and pages

## Security Notes

- Default password should be changed after first login
- Password is encrypted using bcrypt with 10 salt rounds
- Session data stored in localStorage
- Consider implementing password change feature for production

## Need Help?

If you encounter issues:
1. Check that `npx convex dev` is running
2. Check browser console for errors
3. Verify .env.local has correct Convex URL
4. Review CONVEX_QUICKSTART.md for detailed setup