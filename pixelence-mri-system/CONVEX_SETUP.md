# Convex Database Setup Guide for Pixelence MRI System

This guide will help you complete the Convex database setup and start using it in your application.

## What Has Been Configured

✅ Convex package installed
✅ Database schema created (`convex/schema.js`)
✅ Query and mutation functions created for:
  - Patients (`convex/patients.js`)
  - Imaging Jobs (`convex/jobs.js`)
  - Appointments (`convex/appointments.js`)
✅ ConvexProvider integrated in `_app.js`
✅ Environment configuration files created

## Next Steps to Complete Setup

### 1. Authenticate with Convex

Run the following command in the `pixelence-mri-system` directory:

```bash
cd pixelence-mri-system
npx convex dev
```

This will:
- Prompt you to log in to your Convex account (or create one if you don't have it)
- Create or connect to your "Pixelence Web" project
- Generate your deployment URL
- Start the Convex development server

### 2. Update Environment Variables

After running `npx convex dev`, you'll receive a deployment URL that looks like:
```
https://your-project-name.convex.cloud
```

Update the `.env.local` file with this URL:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-actual-deployment-url.convex.cloud
```

### 3. Start Your Development Server

In a new terminal, start your Next.js application:

```bash
npm run dev
```

Keep the `npx convex dev` running in another terminal - this syncs your schema and functions with Convex.

## Database Schema

The following tables have been created:

### Patients
- Patient demographic information
- Medical history
- Contact details

### Appointments
- Patient appointments
- Doctor assignments
- Appointment status and types

### Jobs
- MRI imaging jobs
- DICOM file references
- Job status and priority
- Radiographer/Radiologist assignments

### Reports
- Radiology reports
- Findings and impressions
- Report status workflow

### Users
- System users
- Role-based access (doctor, radiologist, radiographer, finance-user, it-admin)

### Billing
- Patient invoices
- Payment tracking

### Settings
- System configuration
- License management

## Using Convex in Your Components

### Example: Querying Data

```javascript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function PatientList() {
  const patients = useQuery(api.patients.getAllPatients);
  
  if (patients === undefined) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {patients.map((patient) => (
        <div key={patient._id}>
          {patient.firstName} {patient.lastName}
        </div>
      ))}
    </div>
  );
}
```

### Example: Creating Data

```javascript
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

function CreatePatient() {
  const createPatient = useMutation(api.patients.createPatient);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createPatient({
      patientId: "P001",
      firstName: "John",
      lastName: "Doe",
      dateOfBirth: "1990-01-01",
      gender: "Male",
      email: "john.doe@example.com",
      phone: "+1234567890",
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit">Create Patient</button>
    </form>
  );
}
```

### Example: Querying with Parameters

```javascript
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function JobsByStatus({ status }) {
  const jobs = useQuery(api.jobs.getJobsByStatus, { status });
  
  return (
    <div>
      {jobs?.map((job) => (
        <div key={job._id}>{job.jobId} - {job.studyType}</div>
      ))}
    </div>
  );
}
```

## Available Functions

### Patients (`api.patients.*`)
- `getAllPatients()` - Get all patients
- `getPatientById({ patientId })` - Get specific patient
- `createPatient({ ...data })` - Create new patient
- `updatePatient({ id, ...data })` - Update patient
- `deletePatient({ id })` - Delete patient

### Jobs (`api.jobs.*`)
- `getAllJobs()` - Get all imaging jobs
- `getJobById({ jobId })` - Get specific job
- `getJobsByPatient({ patientId })` - Get jobs for a patient
- `getJobsByStatus({ status })` - Get jobs by status
- `getRecentJobs({ limit? })` - Get recent jobs (default: 10)
- `createJob({ ...data })` - Create new job
- `updateJob({ id, ...data })` - Update job
- `deleteJob({ id })` - Delete job

### Appointments (`api.appointments.*`)
- `getAllAppointments()` - Get all appointments
- `getAppointmentsByPatient({ patientId })` - Get patient appointments
- `getAppointmentsByDoctor({ doctorId })` - Get doctor appointments
- `getAppointmentsByStatus({ status })` - Get appointments by status
- `createAppointment({ ...data })` - Create new appointment
- `updateAppointment({ id, ...data })` - Update appointment
- `deleteAppointment({ id })` - Delete appointment

## Adding More Functions

To add new queries or mutations:

1. Create a new file in the `convex/` directory (e.g., `convex/reports.js`)
2. Import required utilities:
   ```javascript
   import { query, mutation } from "./_generated/server";
   import { v } from "convex/values";
   ```
3. Define your functions:
   ```javascript
   export const myQuery = query({
     args: { /* validation schema */ },
     handler: async (ctx, args) => {
       // query logic
     },
   });
   ```
4. The Convex dev server will automatically sync the new functions

## Authentication Integration (Future)

For production, you'll want to add authentication. Convex supports:
- Clerk
- Auth0
- Custom authentication

See: https://docs.convex.dev/auth

## Best Practices

1. **Always validate inputs** using Convex validators (`v.string()`, `v.number()`, etc.)
2. **Use indexes** for frequently queried fields (already defined in schema)
3. **Keep mutations atomic** - each mutation should be a single logical operation
4. **Use optimistic updates** for better UX
5. **Handle loading and error states** in your components

## Troubleshooting

### "ConvexProvider client is undefined"
- Make sure `.env.local` has the correct `NEXT_PUBLIC_CONVEX_URL`
- Restart your Next.js dev server after updating `.env.local`

### "Failed to fetch"
- Ensure `npx convex dev` is running
- Check that your deployment URL is correct

### Schema changes not reflected
- The Convex dev server should auto-sync
- Try restarting `npx convex dev`

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex React Quickstart](https://docs.convex.dev/quickstart/react)
- [Convex Dashboard](https://dashboard.convex.dev)

## Project-Specific Notes

This database is configured for the "Pixelence Web" project and includes specialized tables for:
- Medical imaging workflows
- DICOM file management
- Multi-role user access
- Billing and reporting

You can extend the schema in `convex/schema.js` as your requirements evolve.
