import { ConvexHttpClient } from 'convex/browser';
import { anyApi } from 'convex/server';

const CONVEX_URL = process.env.EXPO_PUBLIC_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || '';

const client = new ConvexHttpClient(CONVEX_URL, { logger: false });

export const api = {
    auth: {
        login: async (email: string, password: string) => {
            return await client.action(anyApi.auth.login, { email, password });
        },
        initializeDefaultAdmin: async () => {
            return await client.action(anyApi.auth.initializeDefaultAdmin, {});
        },
        initializeSampleUsers: async () => {
            return await client.action(anyApi.auth.initializeSampleUsers, {});
        },
    },
    users: {
        getCurrent: async () => {
            return await client.query(anyApi.users.getCurrent, {});
        },
        getById: async (args: { userId: string }) => {
            return await client.query(anyApi.users.getById, args);
        },
        listByHospital: async (args: { hospitalId: string }) => {
            return await client.query(anyApi.users.listByHospital, args);
        },
        listAll: async () => {
            return await client.query(anyApi.users.listAll, {});
        },
        create: async (args: {
            email: string;
            password: string;
            firstName: string;
            lastName: string;
            role: string;
            hospitalId: string;
            phone?: string;
            department?: string;
        }) => {
            return await client.action(anyApi.users.create, args);
        },
        update: async (args: {
            userId: string;
            firstName?: string;
            lastName?: string;
            phone?: string;
            department?: string;
            isActive?: boolean;
        }) => {
            return await client.mutation(anyApi.users.update, args);
        },
        deactivate: async (args: { userId: string }) => {
            return await client.mutation(anyApi.users.deactivate, args);
        },
    },
    hospitals: {
        create: async (args: {
            name: string;
            address: string;
            contactEmail: string;
            contactPhone: string;
        }) => {
            return await client.mutation(anyApi.hospitals.create, args);
        },
        list: async () => {
            return await client.query(anyApi.hospitals.list, {});
        },
        getById: async (args: { hospitalId: string }) => {
            return await client.query(anyApi.hospitals.getById, args);
        },
        update: async (args: {
            hospitalId: string;
            name?: string;
            address?: string;
            contactEmail?: string;
            contactPhone?: string;
        }) => {
            return await client.mutation(anyApi.hospitals.update, args);
        },
        suspend: async (args: { hospitalId: string }) => {
            return await client.mutation(anyApi.hospitals.suspend, args);
        },
        activate: async (args: { hospitalId: string }) => {
            return await client.mutation(anyApi.hospitals.activate, args);
        },
        getStats: async () => {
            return await client.query(anyApi.hospitals.getStats, {});
        },
    },
    licenses: {
        generate: async (args: {
            hospitalId: string;
            billingType: 'per-scan' | 'monthly-fixed';
            perScanRate?: number;
            monthlyRate?: number;
            minimumScans?: number;
            startDate: string;
            expiryDate: string;
        }) => {
            return await client.mutation(anyApi.licenses.generate, args);
        },
        getByHospital: async (args: { hospitalId: string }) => {
            return await client.query(anyApi.licenses.getByHospital, args);
        },
        getAllByHospital: async (args: { hospitalId: string }) => {
            return await client.query(anyApi.licenses.getAllByHospital, args);
        },
        checkActive: async (args: { hospitalId: string }) => {
            return await client.query(anyApi.licenses.checkActive, args);
        },
        revoke: async (args: { licenseId: string }) => {
            return await client.mutation(anyApi.licenses.revoke, args);
        },
        renew: async (args: {
            licenseId: string;
            expiryDate: string;
            billingType?: 'per-scan' | 'monthly-fixed';
            perScanRate?: number;
            monthlyRate?: number;
            minimumScans?: number;
        }) => {
            return await client.mutation(anyApi.licenses.renew, args);
        },
        getExpiringLicenses: async (args: { daysAhead: number }) => {
            return await client.query(anyApi.licenses.getExpiringLicenses, args);
        },
    },
    notifications: {
        create: async (args: {
            userId: string;
            type: string;
            title: string;
            message: string;
            referenceId?: string;
            referenceType?: string;
        }) => {
            return await client.mutation(anyApi.notifications.create, args);
        },
        getForUser: async (args: { userId: string; limit?: number }) => {
            return await client.query(anyApi.notifications.getForUser, args);
        },
        getUnreadCount: async (args: { userId: string }) => {
            return await client.query(anyApi.notifications.getUnreadCount, args);
        },
        markRead: async (args: { notificationId: string }) => {
            return await client.mutation(anyApi.notifications.markRead, args);
        },
        markAllRead: async (args: { userId: string }) => {
            return await client.mutation(anyApi.notifications.markAllRead, args);
        },
    },
    appointments: {
        list: async (args?: { hospitalId?: string }) => {
            return await client.query(anyApi.appointments.list, args || {});
        },
        get: async (id: string) => {
            return await client.query(anyApi.appointments.get, { id });
        },
        getAllAppointments: async () => {
            return await client.query(anyApi.appointments.getAllAppointments, {});
        },
        getAppointmentById: async (args: { id: string }) => {
            return await client.query(anyApi.appointments.getAppointmentById, args);
        },
        create: async (args: {
            patientName: string;
            patientId?: string;
            age: number;
            gender: string;
            complaint: string;
            medicalHistory?: string;
            causeOfReferral?: string;
            referringPhysician: string;
            scheduledDateTime: string;
            hospitalId: string;
            radiographerId?: string;
            radiologistId?: string;
            doctorId?: string;
        }) => {
            return await client.mutation(anyApi.appointments.create, args);
        },
    },
    reports: {
        list: async (args?: { hospitalId?: string }) => {
            return await client.query(anyApi.reports.list, args || {});
        },
        get: async (id: string) => {
            return await client.query(anyApi.reports.get, { id });
        },
        getAllReports: async () => {
            return await client.query(anyApi.reports.getAllReports, {});
        },
        getReportById: async (args: { reportId: string }) => {
            return await client.query(anyApi.reports.getReportById, args);
        },
        getByJob: async (args: { jobId: string }) => {
            return await client.query(anyApi.reports.getByJob, args);
        },
        submitReport: async (args: {
            reportId: string;
            radiologistId: string;
            radiologistComments: string;
            approved: boolean;
        }) => {
            return await client.mutation(anyApi.reports.submitReport, args);
        },
        addDoctorComment: async (args: {
            reportId: string;
            doctorId: string;
            doctorComments: string;
        }) => {
            return await client.mutation(anyApi.reports.addDoctorComment, args);
        },
    },
    jobs: {
        getRecentJobs: async (args?: { limit?: number; hospitalId?: string }) => {
            const jobs = await client.query(anyApi.jobs.getRecentJobs, args || {});
            const jobsArray = (Array.isArray(jobs) ? jobs : (jobs as any)?.jobs) || [];
            return (args?.limit ? jobsArray.slice(0, args.limit) : jobsArray) as unknown[];
        },
        getJobById: async (args: { jobId: string }) => {
            return await client.query(anyApi.jobs.getJobById, args);
        },
        getByAppointment: async (args: { appointmentId: string }) => {
            return await client.query(anyApi.jobs.getByAppointment, args);
        },
        completeUpload: async (args: {
            jobId: string;
            dicomFiles: string[];
            imageCount: number;
            studyType?: string;
        }) => {
            return await client.mutation(anyApi.jobs.completeUpload, args);
        },
        saveEnhancedMri: async (args: { jobId: string; enhancedMriPath: string }) => {
            return await client.mutation(anyApi.jobs.saveEnhancedMri, args);
        },
        getByRadiologist: async (args: { radiologistId: string }) => {
            return await client.query(anyApi.jobs.getByRadiologist, args);
        },
    },
};

export default api;
