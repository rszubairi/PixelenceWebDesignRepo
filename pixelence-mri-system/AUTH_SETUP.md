# Authentication System Documentation

## Overview

The Pixelence MRI System now includes a secure authentication system with:
- **Bcrypt password hashing** (one-way encryption)
- **Role-based access control**
- **Default admin user**
- **Protected routes**
- **Session management**

## Security Features

### Password Encryption
- **Algorithm**: Bcrypt with 10 salt rounds
- **Method**: One-way hashing (passwords cannot be decrypted)
- **Storage**: Only password hashes are stored in the database
- **Verification**: Passwords are compared using bcrypt.compare()

### Authentication Flow
1. User enters email and password
2. System finds user by email
3. Password is verified against stored hash using bcrypt
4. If valid, user data (without password) is returned
5. User data is stored in localStorage
6. User is redirected to role-specific dashboard

## Default Admin User

### Credentials
- **Email**: admin@pixelenceai.com
- **Password**: Click123*
- **Role**: it-admin
- **Name**: System Administrator

### Initialization

Before you can log in, you need to initialize the default admin user:

#### Option 1: Using Convex Dashboard
1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to "Functions" tab
4. Find and run `auth:initializeDefaultAdmin`

#### Option 2: Using Code
Add this to any component (run once):
```javascript
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

function InitAdmin() {
  const initAdmin = useMutation(api.auth.initializeDefaultAdmin);
  
  const handleInit = async () => {
    const result = await initAdmin();
    console.log(result);
  };
  
  return <button onClick={handleInit}>Initialize Admin</button>;
}
```

## User Roles

The system supports the following roles:
- `doctor` - Medical doctors
- `radiologist` - Radiologists
- `radiographer` - Radiographers/Technicians
- `finance-user` - Finance staff
- `it-admin` - IT administrators

Each role has a dedicated dashboard:
- `/dashboard/doctor`
- `/dashboard/radiologist`
- `/dashboard/radiographer`
- `/dashboard/finance-user`
- `/dashboard/it-admin`

## Using Authentication

### Login Page

Access the login page at `/login`. The page includes:
- Email and password fields
- Error handling
- Loading states
- Default credentials display

### Authentication Hook

Use the `useAuth` hook to access authentication state:

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <p>Welcome, {user.firstName} {user.lastName}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

Wrap pages with the `ProtectedRoute` component:

```javascript
import ProtectedRoute from '../components/ProtectedRoute';

export default function DoctorDashboard() {
  return (
    <ProtectedRoute allowedRoles={['doctor']}>
      <div>
        <h1>Doctor Dashboard</h1>
        {/* Your dashboard content */}
      </div>
    </ProtectedRoute>
  );
}
```

#### Protect all authenticated pages:
```javascript
<ProtectedRoute>
  {/* Content only for logged-in users */}
</ProtectedRoute>
```

#### Protect specific roles:
```javascript
<ProtectedRoute allowedRoles={['it-admin', 'doctor']}>
  {/* Content only for admins and doctors */}
</ProtectedRoute>
```

## Available Auth Functions

### Login
```javascript
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';

const login = useMutation(api.auth.login);
const user = await login({ 
  email: 'admin@pixelenceai.com', 
  password: 'Click123*' 
});
```

### Register New User
```javascript
const register = useMutation(api.auth.register);
await register({
  email: 'doctor@example.com',
  password: 'SecurePassword123',
  firstName: 'John',
  lastName: 'Doe',
  role: 'doctor',
  phone: '+1234567890',
  department: 'Radiology'
});
```

### Change Password
```javascript
const changePassword = useMutation(api.auth.changePassword);
await changePassword({
  userId: user.userId,
  currentPassword: 'OldPassword123',
  newPassword: 'NewPassword123'
});
```

### Get Current User
```javascript
const getCurrentUser = useQuery(api.auth.getCurrentUser, { 
  userId: user.userId 
});
```

## Example: Protected Dashboard

```javascript
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

export default function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <ProtectedRoute>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-600">
              Welcome, {user.firstName} {user.lastName}
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
        {/* Dashboard content */}
      </div>
    </ProtectedRoute>
  );
}
```

## Security Best Practices

### ✅ What We've Implemented
1. **One-way password hashing** - Passwords cannot be decrypted
2. **Bcrypt with salt** - Industry-standard hashing algorithm
3. **Password never exposed** - API returns user data without password
4. **Client-side auth state** - Using React Context
5. **Protected routes** - Automatic redirection for unauthorized access
6. **Role-based access control** - Users can only access allowed pages

### 🔒 Additional Recommendations
1. **HTTPS** - Always use HTTPS in production
2. **Password requirements** - Enforce strong passwords when registering
3. **Rate limiting** - Add rate limiting to login attempts
4. **Session timeout** - Implement auto-logout after inactivity
5. **Multi-factor auth** - Consider adding MFA for sensitive roles
6. **Password reset** - Add forgot password functionality
7. **Audit logging** - Log authentication events

## Password Requirements (Recommended)

When implementing user registration UI, enforce:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Example validation:
```javascript
function validatePassword(password) {
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);
  
  return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
}
```

## Troubleshooting

### "Invalid email or password"
- Check that the default admin user has been initialized
- Verify email and password are correct
- Check that the user's `isActive` field is `true`

### "User account not properly configured"
- The user exists but has no password hash
- Re-create the user with a password

### Can't access protected page
- Ensure you're logged in
- Check that your role is in the `allowedRoles` array
- Clear localStorage and log in again

### Logout doesn't work
- Check browser console for errors
- Verify `useAuth` hook is properly imported
- Clear browser cache and cookies

## Migration from No Auth

If you had existing pages, wrap them with `ProtectedRoute`:

```javascript
// Before
export default function SomePage() {
  return <div>Content</div>;
}

// After
import ProtectedRoute from '../components/ProtectedRoute';

export default function SomePage() {
  return (
    <ProtectedRoute>
      <div>Content</div>
    </ProtectedRoute>
  );
}
```

## Next Steps

1. **Initialize the default admin user**
2. **Test login with default credentials**
3. **Wrap existing pages with ProtectedRoute**
4. **Create user management interface** (for admins to add users)
5. **Add password change functionality to user settings**
6. **Implement password reset via email**
7. **Add audit logging for security events**

## Resources

- [Bcrypt Documentation](https://www.npmjs.com/package/bcryptjs)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)
- [Convex Auth Guide](https://docs.convex.dev/auth)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)