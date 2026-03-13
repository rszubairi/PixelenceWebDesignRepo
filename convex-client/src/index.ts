import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || '';

const client = new ConvexHttpClient(CONVEX_URL, { logger: false });

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            return await client.action(anyApi.auth.login, { email, password });
        }
    },
    users: {
        getCurrent: async () => {
            return await client.query(anyApi.users.getCurrent, {});
        }
    },
    appointments: {
        list: async () => {
            return await client.query(anyApi.appointments.list, {});
        },
        get: async (id: string) => {
            return await client.query(anyApi.appointments.get, { id });
        },
        getAllAppointments: async () => {
            return await client.query(anyApi.appointments.getAllAppointments, {});
        },
        getAppointmentById: async (args: { id: string }) => {
            return await client.query(anyApi.appointments.getAppointmentById, args);
        }
    },
    reports: {
        list: async () => {
            return await client.query(anyApi.reports.list, {});
        },
        get: async (id: string) => {
            return await client.query(anyApi.reports.get, { id });
        },
        getAllReports: async () => {
            return await client.query(anyApi.reports.getAllReports, {});
        },
        getReportById: async (args: { reportId: string }) => {
            return await client.query(anyApi.reports.getReportById, args);
        }
    },
    jobs: {
        getRecentJobs: async (args?: { limit?: number }) => {
            const jobs = await client.query(anyApi.jobs.getRecentJobs, args || {});
            const jobsArray = (Array.isArray(jobs) ? jobs : (jobs as any)?.jobs) || [];
            return (args?.limit ? jobsArray.slice(0, args.limit) : jobsArray) as unknown[];
        },
        getJobById: async (args: { jobId: string }) => {
            return await client.query(anyApi.jobs.getJobById, args);
        }
    }
};

export default api;
