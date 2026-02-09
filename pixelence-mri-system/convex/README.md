# Convex Functions - Quick Reference

This directory contains all your Convex backend functions and schema.

## Files Overview

### `schema.js`
Defines the database structure for your MRI system, including tables for:
- **patients**: Patient demographic and medical information
- **appointments**: Scheduling and appointment management
- **jobs**: MRI imaging jobs and DICOM file tracking
- **reports**: Radiology reports and findings
- **users**: System users with role-based access
- **billing**: Invoice and payment tracking
- **settings**: System configuration

### `patients.js`
Functions for patient management:
- Query all patients or by ID
- Create, update, and delete patient records

### `jobs.js`
Functions for imaging job management:
- Query jobs by ID, patient, or status
- Create and update imaging jobs
- Track DICOM files and assignments

### `appointments.js`
Functions for appointment management:
- Query appointments by patient, doctor, or status
- Create and update appointments
- Manage appointment workflow

## Usage in Components

```javascript
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Query data
const patients = useQuery(api.patients.getAllPatients);

// Mutate data
const createPatient = useMutation(api.patients.createPatient);
await createPatient({ /* patient data */ });
```

## Adding New Functions

1. Create a new `.js` file in this directory
2. Use `query` for reading data, `mutation` for writing
3. Always validate arguments with `v` validators
4. The Convex dev server will auto-sync your functions

See `CONVEX_SETUP.md` in the parent directory for complete setup instructions.
