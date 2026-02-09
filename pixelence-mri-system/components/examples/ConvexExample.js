import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Example Component: Using Convex for Patient Management
 * 
 * This component demonstrates how to:
 * - Query data from Convex
 * - Create new records with mutations
 * - Handle loading states
 */

export default function ConvexExample() {
  // Query all patients
  const patients = useQuery(api.patients.getAllPatients);
  
  // Query recent jobs
  const recentJobs = useQuery(api.jobs.getRecentJobs, { limit: 5 });
  
  // Mutation to create a new patient
  const createPatient = useMutation(api.patients.createPatient);
  
  // Handle form submission
  const handleCreatePatient = async () => {
    try {
      await createPatient({
        patientId: `P${Date.now()}`,
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        email: "john.doe@example.com",
        phone: "+1234567890",
      });
      alert("Patient created successfully!");
    } catch (error) {
      console.error("Error creating patient:", error);
      alert("Failed to create patient");
    }
  };

  // Loading state
  if (patients === undefined) {
    return (
      <div className="p-6">
        <p>Loading patients...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Convex Database Example</h1>
      
      {/* Create Patient Button */}
      <div>
        <button
          onClick={handleCreatePatient}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Test Patient
        </button>
      </div>

      {/* Display Patients */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Patients ({patients.length})</h2>
        <div className="grid gap-3">
          {patients.length === 0 ? (
            <p className="text-gray-500">No patients found. Create one to get started!</p>
          ) : (
            patients.slice(0, 5).map((patient) => (
              <div key={patient._id} className="border p-4 rounded">
                <p className="font-medium">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-sm text-gray-600">ID: {patient.patientId}</p>
                <p className="text-sm text-gray-600">DOB: {patient.dateOfBirth}</p>
                {patient.email && (
                  <p className="text-sm text-gray-600">Email: {patient.email}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Display Recent Jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Recent Jobs</h2>
        {recentJobs === undefined ? (
          <p>Loading jobs...</p>
        ) : recentJobs.length === 0 ? (
          <p className="text-gray-500">No jobs found</p>
        ) : (
          <div className="grid gap-3">
            {recentJobs.map((job) => (
              <div key={job._id} className="border p-4 rounded">
                <p className="font-medium">{job.jobId} - {job.studyType}</p>
                <p className="text-sm text-gray-600">Status: {job.status}</p>
                <p className="text-sm text-gray-600">Priority: {job.priority}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
