/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as appointments from "../appointments.js";
import type * as auth from "../auth.js";
import type * as hospitals from "../hospitals.js";
import type * as jobs from "../jobs.js";
import type * as licenses from "../licenses.js";
import type * as notifications from "../notifications.js";
import type * as reports from "../reports.js";
import type * as users from "../users.js";
import type * as qms_ai from "../qms/ai.js";
import type * as qms_audit from "../qms/audit.js";
import type * as qms_auditTrail from "../qms/auditTrail.js";
import type * as qms_capa from "../qms/capa.js";
import type * as qms_changeRequests from "../qms/changeRequests.js";
import type * as qms_dhf from "../qms/dhf.js";
import type * as qms_documents from "../qms/documents.js";
import type * as qms_pms from "../qms/pms.js";
import type * as qms_reporting from "../qms/reporting.js";
import type * as qms_risk from "../qms/risk.js";
import type * as qms_scheduler from "../qms/scheduler.js";
import type * as qms_signatures from "../qms/signatures.js";
import type * as qms_suppliers from "../qms/suppliers.js";
import type * as qms_traceability from "../qms/traceability.js";
import type * as qms_training from "../qms/training.js";
import type * as qms_trainingGate from "../qms/trainingGate.js";
import type * as qms_seed from "../qms/seed.js";
import type * as qms_seedInternal from "../qms/seedInternal.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  appointments: typeof appointments;
  auth: typeof auth;
  hospitals: typeof hospitals;
  jobs: typeof jobs;
  licenses: typeof licenses;
  notifications: typeof notifications;
  reports: typeof reports;
  users: typeof users;
  "qms/ai": typeof qms_ai;
  "qms/audit": typeof qms_audit;
  "qms/auditTrail": typeof qms_auditTrail;
  "qms/capa": typeof qms_capa;
  "qms/changeRequests": typeof qms_changeRequests;
  "qms/dhf": typeof qms_dhf;
  "qms/documents": typeof qms_documents;
  "qms/pms": typeof qms_pms;
  "qms/reporting": typeof qms_reporting;
  "qms/risk": typeof qms_risk;
  "qms/scheduler": typeof qms_scheduler;
  "qms/signatures": typeof qms_signatures;
  "qms/suppliers": typeof qms_suppliers;
  "qms/traceability": typeof qms_traceability;
  "qms/training": typeof qms_training;
  "qms/trainingGate": typeof qms_trainingGate;
  "qms/seed": typeof qms_seed;
  "qms/seedInternal": typeof qms_seedInternal;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
