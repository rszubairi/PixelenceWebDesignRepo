import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

const anyInsert = (table: string) =>
  internalMutation({
    args: { v: v.any() },
    handler: async (ctx, { v: data }) => (ctx.db as any).insert(table, data),
  });

export const insertDocument = anyInsert("qms_documents");
export const insertCapa = anyInsert("qms_capas");
export const insertCapaAction = anyInsert("qms_capa_action_items");
export const insertRisk = anyInsert("qms_risks");
export const insertAudit = anyInsert("qms_audits");
export const insertAuditFinding = anyInsert("qms_audit_findings");
export const insertSupplier = anyInsert("qms_suppliers");
export const insertChangeRequest = anyInsert("qms_change_requests");
export const insertComplaint = anyInsert("qms_complaints");
export const insertTrainingProgram = anyInsert("qms_training_programs");
export const insertTrainingRecord = anyInsert("qms_training_records");
export const insertDhfItem = anyInsert("qms_dhf_items");
export const insertAuditLog = anyInsert("qms_audit_logs");
