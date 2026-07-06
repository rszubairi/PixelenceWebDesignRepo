"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const seedDemoData = action({
  args: { adminUserId: v.string() },
  handler: async (ctx, { adminUserId }) => {
    const now = Date.now();
    const day = 86400000;
    const i = internal.qms.demoSeedInternal;

    const ins = (mut: any, data: object) =>
      ctx.runMutation(mut, { v: data }) as Promise<string>;

    // ── 1. DOCUMENTS ────────────────────────────────────────────────────────
    const docs = [
      {
        docNumber: "SOP-QMS-001",
        title: "Software Development and Maintenance Procedure",
        type: "SOP",
        version: "3.1",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 90 * day,
        nextReviewDate: now + 275 * day,
        description:
          "Defines the lifecycle process for AI/ML model development, version control, and deployment for Pixelence MRI Enhancement software.",
        regulatoryReferences: ["IEC 62304", "FDA 21 CFR Part 11", "ISO 13485 §7.3"],
        tags: ["software", "AI", "ML", "development"],
        createdAt: now - 180 * day,
        updatedAt: now - 90 * day,
      },
      {
        docNumber: "SOP-QMS-002",
        title: "AI Model Validation and Verification Procedure",
        type: "SOP",
        version: "2.0",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 60 * day,
        nextReviewDate: now + 305 * day,
        description:
          "Establishes V&V protocols for 3D U-Net contrast enhancement models including PSNR, SSIM, and MAE acceptance criteria.",
        regulatoryReferences: ["IEC 62304 §5.7", "ISO 14971", "FDA AI/ML SaMD Guidance"],
        tags: ["validation", "AI", "verification", "PSNR", "SSIM"],
        createdAt: now - 150 * day,
        updatedAt: now - 60 * day,
      },
      {
        docNumber: "SOP-QMS-003",
        title: "Risk Management Procedure (ISO 14971)",
        type: "SOP",
        version: "1.2",
        status: "approved",
        category: "Risk",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 120 * day,
        nextReviewDate: now + 245 * day,
        description:
          "Defines risk analysis, evaluation, control, and monitoring process for Pixelence AI-assisted MRI interpretation.",
        regulatoryReferences: ["ISO 14971:2019", "IEC 80001-1"],
        tags: ["risk", "ISO 14971", "FMEA"],
        createdAt: now - 200 * day,
        updatedAt: now - 120 * day,
      },
      {
        docNumber: "WI-DEV-001",
        title: "3D U-Net Model Training Work Instruction",
        type: "Work Instruction",
        version: "1.0",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 45 * day,
        nextReviewDate: now + 320 * day,
        description:
          "Step-by-step procedure for training the UNet3D_Deep_Supervision_attention_cbam model. Covers dataset preprocessing, subject exclusion criteria (min_signal_fraction=0.1), hyperparameter configuration, checkpoint management, and TensorBoard monitoring.",
        regulatoryReferences: ["SOP-QMS-001", "SOP-QMS-002"],
        tags: ["training", "U-Net", "CBAM", "GAN"],
        createdAt: now - 100 * day,
        updatedAt: now - 45 * day,
      },
      {
        docNumber: "RPT-VAL-001",
        title: "Model Validation Report — BrainEnhance v2.0 (100-Epoch Run)",
        type: "Validation Report",
        version: "1.0",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 30 * day,
        nextReviewDate: now + 335 * day,
        description:
          "Documents training and validation performance of the BrainEnhance GAN model over 100 epochs on TCIA Yale + UCSD-PTGBM cohorts. Final val PSNR: 23.62 dB, val SSIM: 0.708, val MAE: 0.047. Acceptance criteria met.",
        regulatoryReferences: ["SOP-QMS-002", "WI-DEV-001"],
        tags: ["validation", "report", "PSNR", "SSIM", "MAE"],
        createdAt: now - 35 * day,
        updatedAt: now - 30 * day,
      },
      {
        docNumber: "SPEC-SW-001",
        title: "Software Requirements Specification — Pixelence MRI Enhancement v2",
        type: "Specification",
        version: "2.1",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 200 * day,
        nextReviewDate: now + 165 * day,
        description:
          "Defines functional and performance requirements for the AI-based MRI contrast enhancement system including input modalities (T1, T2, FLAIR), output (T1+Gd synthesis), and integration with AWS ECS Fargate REST API.",
        regulatoryReferences: ["IEC 62304 §5.2", "FDA De Novo Request"],
        tags: ["requirements", "SRS", "specification"],
        createdAt: now - 270 * day,
        updatedAt: now - 200 * day,
      },
      {
        docNumber: "FORM-QMS-001",
        title: "Model Performance Acceptance Criteria Form",
        type: "Form",
        version: "1.0",
        status: "approved",
        category: "Software",
        ownerId: adminUserId,
        reviewerId: adminUserId,
        approverId: adminUserId,
        effectiveDate: now - 55 * day,
        nextReviewDate: now + 310 * day,
        description:
          "Captures minimum acceptance thresholds: PSNR ≥ 20 dB, SSIM ≥ 0.65, MAE ≤ 0.08 on held-out validation set.",
        regulatoryReferences: ["SOP-QMS-002"],
        tags: ["form", "acceptance criteria", "metrics"],
        createdAt: now - 80 * day,
        updatedAt: now - 55 * day,
      },
    ];
    for (const d of docs) await ins(i.insertDocument, d);

    // ── 2. RISK REGISTER ────────────────────────────────────────────────────
    const risks = [
      {
        riskNumber: "RSK-001",
        title: "False negative — missed pathology in synthesized contrast image",
        hazard: "AI model fails to synthesize enhancement in region of true pathology",
        hazardousSituation: "Radiologist reads synthesized T1+Gd and misses an enhancing lesion present in actual gadolinium scan",
        harm: "Missed diagnosis; delayed treatment; patient harm",
        category: "Clinical",
        probabilityOfOccurrence: 2,
        severityOfHarm: 5,
        detectability: 2,
        rpn: 20,
        currentControls: ["Output labelled AI-synthesized only — not a substitute for true contrast", "Mandatory radiologist review", "Validation SSIM ≥ 0.65 acceptance criterion"],
        residualRisk: "Acceptable",
        status: "mitigated",
        ownerId: adminUserId,
        reviewDate: now + 90 * day,
        isoClause: "ISO 14971:2019 §4.4",
        createdAt: now - 150 * day,
        updatedAt: now - 30 * day,
      },
      {
        riskNumber: "RSK-002",
        title: "FOV mismatch — incorrect input volume alignment",
        hazard: "Input MRI volume has mismatched field-of-view between modalities",
        hazardousSituation: "Model receives mis-registered inputs, producing artefactual output image",
        harm: "Incorrect synthesis output; potential radiologist confusion",
        category: "Software",
        probabilityOfOccurrence: 3,
        severityOfHarm: 3,
        detectability: 1,
        rpn: 9,
        currentControls: ["Signal fraction check: T1+Gd fraction < 0.1 triggers rejection", "1,048 subjects excluded in training preprocessing for this criterion", "fov_mismatch_ratio threshold: 3.0"],
        residualRisk: "Acceptable",
        status: "mitigated",
        ownerId: adminUserId,
        reviewDate: now + 90 * day,
        isoClause: "ISO 14971:2019 §4.5",
        createdAt: now - 140 * day,
        updatedAt: now - 45 * day,
      },
      {
        riskNumber: "RSK-003",
        title: "Model performance degradation on out-of-distribution scanner protocols",
        hazard: "Clinical site uses scanner protocol not represented in TCIA training cohort",
        hazardousSituation: "Model produces low-quality synthesis on unseen acquisition parameters",
        harm: "Poor image quality; reduced diagnostic utility; potential misdiagnosis",
        category: "Clinical",
        probabilityOfOccurrence: 3,
        severityOfHarm: 4,
        detectability: 3,
        rpn: 36,
        currentControls: ["Site qualification checklist required before deployment", "On-site validation with local scanner protocol", "PSNR monitoring via PMS"],
        residualRisk: "ALARP — under review",
        status: "open",
        ownerId: adminUserId,
        reviewDate: now + 30 * day,
        isoClause: "ISO 14971:2019 §4.4",
        createdAt: now - 100 * day,
        updatedAt: now - 20 * day,
      },
      {
        riskNumber: "RSK-004",
        title: "AWS ECS inference timeout under high concurrency",
        hazard: "High concurrent scan volume exceeds ECS task capacity",
        hazardousSituation: "Inference request times out; clinician receives error instead of enhanced image",
        harm: "Workflow disruption; delayed reporting (no direct patient harm)",
        category: "Cybersecurity",
        probabilityOfOccurrence: 2,
        severityOfHarm: 2,
        detectability: 1,
        rpn: 4,
        currentControls: ["ECS auto-scaling configured", "CloudWatch alarms on CPU utilization > 80%", "Graceful degradation — fallback to non-enhanced workflow"],
        residualRisk: "Acceptable",
        status: "mitigated",
        ownerId: adminUserId,
        reviewDate: now + 180 * day,
        isoClause: "IEC 80001-1",
        createdAt: now - 90 * day,
        updatedAt: now - 60 * day,
      },
      {
        riskNumber: "RSK-005",
        title: "Quantized model performance regression",
        hazard: "INT8 quantization reduces model accuracy below acceptance threshold",
        hazardousSituation: "Deployed optimized model produces lower PSNR/SSIM than validated checkpoint",
        harm: "Undetected quality degradation in production; regulatory non-conformance",
        category: "Software",
        probabilityOfOccurrence: 2,
        severityOfHarm: 3,
        detectability: 2,
        rpn: 12,
        currentControls: ["Quantization benchmarked: 0.96x speedup (marginal regression noted)", "Production uses TorchScript (1.06x speedup, no accuracy loss)", "Change control required before switching to quantized model"],
        residualRisk: "Acceptable",
        status: "mitigated",
        ownerId: adminUserId,
        reviewDate: now + 120 * day,
        isoClause: "IEC 62304 §5.6",
        createdAt: now - 70 * day,
        updatedAt: now - 40 * day,
      },
    ];
    for (const r of risks) await ins(i.insertRisk, r);

    // ── 3. CAPAs ────────────────────────────────────────────────────────────
    const capa1Id = await ins(i.insertCapa, {
      capaNumber: "CAPA-2025-001",
      title: "Improve out-of-distribution generalisation for 3T vs 1.5T scanner protocols",
      type: "corrective",
      source: "Internal Audit",
      description:
        "During internal validation review, SSIM dropped to 0.61 on a 1.5T protocol subset not well-represented in the TCIA training cohort. Root cause: training dataset imbalanced towards 3T acquisitions. Corrective action: augment training data with 1.5T samples and re-validate.",
      rootCause:
        "Training dataset (Yale + UCSD-PTGBM) predominantly 3T scanners. Model under-exposed to 1.5T acquisition characteristics during training.",
      status: "in_progress",
      priority: "high",
      assignedTo: adminUserId,
      ownerId: adminUserId,
      targetDate: now + 60 * day,
      riskLevel: "high",
      regulatoryImpact: true,
      relatedDocuments: ["SOP-QMS-002", "RPT-VAL-001", "RSK-003"],
      createdAt: now - 45 * day,
      updatedAt: now - 10 * day,
    });

    await ins(i.insertCapaAction, { capaId: capa1Id, description: "Identify and procure additional 1.5T MRI brain datasets from TCIA", assignedTo: adminUserId, dueDate: now + 20 * day, status: "in_progress", completedAt: null, createdAt: now - 40 * day });
    await ins(i.insertCapaAction, { capaId: capa1Id, description: "Retrain model with augmented dataset and verify SSIM ≥ 0.65 across all scanner protocol subsets", assignedTo: adminUserId, dueDate: now + 50 * day, status: "open", completedAt: null, createdAt: now - 40 * day });
    await ins(i.insertCapaAction, { capaId: capa1Id, description: "Update RPT-VAL-001 with new validation results and obtain approval", assignedTo: adminUserId, dueDate: now + 58 * day, status: "open", completedAt: null, createdAt: now - 40 * day });

    await ins(i.insertCapa, {
      capaNumber: "CAPA-2025-002",
      title: "Implement automated signal-fraction pre-check in inference pipeline",
      type: "preventive",
      source: "Risk Review",
      description: "RSK-002 mitigation relies on signal fraction check during training preprocessing. Production inference pipeline does not yet enforce the same check. Preventive action: add signal fraction validation to FastAPI /enhance endpoint.",
      rootCause: "Signal fraction check (min_signal_fraction=0.1) implemented in training pipeline only. Not ported to production inference API.",
      status: "open",
      priority: "medium",
      assignedTo: adminUserId,
      ownerId: adminUserId,
      targetDate: now + 30 * day,
      riskLevel: "medium",
      regulatoryImpact: false,
      relatedDocuments: ["SOP-QMS-001", "RSK-002"],
      createdAt: now - 20 * day,
      updatedAt: now - 5 * day,
    });

    await ins(i.insertCapa, {
      capaNumber: "CAPA-2024-003",
      title: "Resolve batch normalisation instability at epoch 47-52",
      type: "corrective",
      source: "Internal Audit",
      description: "TensorBoard logs showed training loss spike between epochs 47-52 attributable to batch normalisation on single-sample batches. Fixed by switching to instance normalisation in decoder blocks.",
      rootCause: "BatchNorm3D with batch_size=1 produces unreliable running mean/variance estimates, causing training instability.",
      status: "closed",
      priority: "high",
      assignedTo: adminUserId,
      ownerId: adminUserId,
      targetDate: now - 100 * day,
      closedDate: now - 90 * day,
      riskLevel: "medium",
      regulatoryImpact: false,
      relatedDocuments: ["WI-DEV-001"],
      effectiveness: "Verified — training curve smooth from epoch 53 onwards. No further loss spikes observed.",
      createdAt: now - 160 * day,
      updatedAt: now - 90 * day,
    });

    // ── 4. AUDITS ───────────────────────────────────────────────────────────
    const audit1Id = await ins(i.insertAudit, {
      auditNumber: "AUD-2025-001",
      title: "Internal QMS Audit — AI Model Development & Validation",
      type: "internal",
      scope: "Software development lifecycle (IEC 62304) and AI model V&V process (SOP-QMS-001, SOP-QMS-002)",
      auditors: [adminUserId],
      auditees: [adminUserId],
      status: "completed",
      plannedDate: now - 50 * day,
      startDate: now - 48 * day,
      endDate: now - 46 * day,
      findings: 3,
      standard: "IEC 62304:2006+A1:2015, ISO 13485:2016",
      createdAt: now - 70 * day,
      updatedAt: now - 45 * day,
    });

    await ins(i.insertAuditFinding, { auditId: audit1Id, findingNumber: "AUD-2025-001-F01", type: "major_nonconformity", description: "SSIM on 1.5T scanner subset (0.61) falls below validated acceptance criterion of 0.65. No documented risk assessment or deviation approval for this out-of-spec result.", clause: "ISO 13485:2016 §7.3.7 / IEC 62304 §5.7", evidence: "RPT-VAL-001 Appendix B — per-protocol SSIM breakdown; FORM-QMS-001", status: "open", capaReference: "CAPA-2025-001", dueDate: now + 60 * day, createdAt: now - 46 * day });
    await ins(i.insertAuditFinding, { auditId: audit1Id, findingNumber: "AUD-2025-001-F02", type: "observation", description: "Signal fraction pre-check (min_signal_fraction=0.1) present in training pipeline but not enforced in production inference API. No documented risk assessment for this gap.", clause: "IEC 62304 §5.6", evidence: "Review of api.py /enhance endpoint — no input validation for signal fraction", status: "open", capaReference: "CAPA-2025-002", dueDate: now + 30 * day, createdAt: now - 46 * day });
    await ins(i.insertAuditFinding, { auditId: audit1Id, findingNumber: "AUD-2025-001-F03", type: "minor_nonconformity", description: "Training configuration (train_config.json) not formally referenced in WI-DEV-001. Version control of hyperparameter configuration files not documented.", clause: "ISO 13485:2016 §4.2.4", evidence: "WI-DEV-001 v1.0 — no reference to train_config.json", status: "closed", capaReference: null, closedDate: now - 30 * day, resolution: "WI-DEV-001 updated to reference train_config.json as a controlled document. Added to document register.", createdAt: now - 46 * day });

    await ins(i.insertAudit, {
      auditNumber: "AUD-2025-002",
      title: "Supplier Audit — TCIA Dataset Provenance & Data Governance",
      type: "supplier",
      scope: "Data provenance, patient consent, and data governance for TCIA Yale Brain MRI and UCSD-PTGBM training datasets",
      auditors: [adminUserId],
      auditees: [adminUserId],
      status: "planned",
      plannedDate: now + 30 * day,
      standard: "ISO 13485:2016 §7.4, GDPR Article 5",
      findings: 0,
      createdAt: now - 10 * day,
      updatedAt: now - 5 * day,
    });

    // ── 5. SUPPLIERS ────────────────────────────────────────────────────────
    await ins(i.insertSupplier, { name: "TCIA — Yale GBM Cohort", type: "Data Provider", category: "critical", status: "approved", contactName: "TCIA Helpdesk", contactEmail: "help@cancerimagingarchive.net", description: "Provides Yale brain MRI dataset (YG_ prefix subjects) used for training the BrainEnhance GAN. Contains T1, T2, FLAIR, and gadolinium-enhanced T1 volumes for brain tumour patients.", qualificationDate: now - 200 * day, nextReviewDate: now + 165 * day, riskLevel: "medium", notes: "1,048 subjects excluded due to FOV mismatch (signal fraction < 0.1).", createdAt: now - 210 * day, updatedAt: now - 200 * day });
    await ins(i.insertSupplier, { name: "TCIA — UCSD PTGBM Cohort", type: "Data Provider", category: "critical", status: "approved", contactName: "TCIA Helpdesk", contactEmail: "help@cancerimagingarchive.net", description: "Provides UCSD-PTGBM dataset used as secondary training cohort for the BrainEnhance model. Predominantly 3T acquisitions.", qualificationDate: now - 200 * day, nextReviewDate: now + 165 * day, riskLevel: "medium", notes: "Supplementary dataset — lower volume than Yale cohort.", createdAt: now - 210 * day, updatedAt: now - 200 * day });
    await ins(i.insertSupplier, { name: "Amazon Web Services (AWS)", type: "Cloud Infrastructure", category: "critical", status: "approved", contactName: "AWS Enterprise Support", contactEmail: "aws-enterprise@amazon.com", description: "Provides ECS Fargate (inference compute), ECR (container registry), S3 (model weights — best.pth 470MB), and CloudWatch. Hosts /enhance and /health REST API endpoints.", qualificationDate: now - 150 * day, nextReviewDate: now + 215 * day, riskLevel: "high", notes: "Cost: ~$0.04/hr on-demand. Fernet-encrypted model weights in S3.", createdAt: now - 160 * day, updatedAt: now - 150 * day });
    await ins(i.insertSupplier, { name: "PyTorch 2.7.1 (Meta AI / Linux Foundation)", type: "Software Library", category: "major", status: "approved", contactName: "PyTorch Foundation", contactEmail: "contact@pytorch.org", description: "Core deep learning framework. Model: UNet3D 5.6M params. TorchScript export used for production (317.6ms, 1.06x speedup). ONNX not tested.", qualificationDate: now - 180 * day, nextReviewDate: now + 185 * day, riskLevel: "medium", notes: "Quantized model showed 0.96x regression — not used in production.", createdAt: now - 185 * day, updatedAt: now - 180 * day });

    // ── 6. CHANGE REQUESTS ──────────────────────────────────────────────────
    await ins(i.insertChangeRequest, { crNumber: "CR-2025-001", title: "Upgrade BrainEnhance v1.0 (U-Net) → v2.0 (GAN + CBAM + Deep Supervision)", type: "major", status: "approved", description: "Replace 190MB float32 U-Net checkpoint with new 470MB GAN architecture. Changes: PatchGAN discriminator, CBAM attention, deep supervision, dilated convolutions [2,4,8]. Performance: val PSNR 19.1 → 23.62 dB, val SSIM 0.58 → 0.708.", justification: "V1.0 failed SSIM ≥ 0.65 acceptance criterion. GAN architecture improves perceptual quality and edge sharpness.", impact: "Re-validation required per SOP-QMS-002. ECS task memory may need increase from 2GB to 4GB.", requestedBy: adminUserId, reviewedBy: adminUserId, approvedBy: adminUserId, requestDate: now - 120 * day, approvalDate: now - 90 * day, implementationDate: now - 60 * day, affectedDocuments: ["SOP-QMS-001", "SOP-QMS-002", "RPT-VAL-001", "SPEC-SW-001"], createdAt: now - 125 * day, updatedAt: now - 60 * day });
    await ins(i.insertChangeRequest, { crNumber: "CR-2025-002", title: "Deploy TorchScript-optimized model for production inference", type: "minor", status: "approved", description: "Switch production inference from PyTorch eager mode to TorchScript model (21.38MB). Measured 1.06x speedup on CPU (317.6ms vs 337.8ms). Reduces ECS cold-start time significantly.", justification: "Reduce inference latency and ECS cold-start time. TorchScript has no accuracy regression.", impact: "Minor — same weights, graph optimization only. Regression test confirmed output equivalence.", requestedBy: adminUserId, reviewedBy: adminUserId, approvedBy: adminUserId, requestDate: now - 40 * day, approvalDate: now - 30 * day, implementationDate: now - 20 * day, affectedDocuments: ["SOP-QMS-001"], createdAt: now - 42 * day, updatedAt: now - 20 * day });

    // ── 7. COMPLAINTS (PMS) ─────────────────────────────────────────────────
    await ins(i.insertComplaint, { complaintNumber: "CMP-2025-001", title: "Reduced image quality on Siemens Prisma 3T with custom protocol", source: "customer_feedback", reportedBy: "Dr. Sarah Mitchell, Royal Infirmary Edinburgh", productVersion: "v2.0 (GAN, best.pth)", description: "Radiologist reports synthesized contrast images appear over-smoothed in the periventricular region on subjects scanned with a site-specific 3T Prisma protocol (TI=900ms, TE=3.1ms). SSIM estimated at 0.61 by reporting radiologist.", patientImpact: false, mdrReportable: false, adverseEvent: false, status: "under_investigation", severity: "moderate", assignedTo: adminUserId, receivedDate: now - 15 * day, targetResolutionDate: now + 45 * day, capaReference: "CAPA-2025-001", relatedRisk: "RSK-003", createdAt: now - 15 * day, updatedAt: now - 5 * day });
    await ins(i.insertComplaint, { complaintNumber: "CMP-2025-002", title: "API timeout during high-volume batch processing (12 concurrent requests)", source: "customer_feedback", reportedBy: "IT Department, St. James's Hospital Dublin", productVersion: "v2.0 (TorchScript, ECS Fargate)", description: "During overnight batch processing of 12 concurrent /enhance requests, 3 of 12 requests returned HTTP 504 Gateway Timeout. No patient data loss. ECS CPU peaked at 94% per CloudWatch.", patientImpact: false, mdrReportable: false, adverseEvent: false, status: "resolved", severity: "minor", assignedTo: adminUserId, receivedDate: now - 25 * day, resolvedDate: now - 10 * day, targetResolutionDate: now - 10 * day, resolution: "ECS auto-scaling policy updated: scale-out threshold reduced from 80% to 70% CPU. Tested with 15 concurrent requests — no timeouts observed.", capaReference: null, relatedRisk: "RSK-004", createdAt: now - 25 * day, updatedAt: now - 10 * day });

    // ── 8. TRAINING PROGRAMS & RECORDS ──────────────────────────────────────
    const prog1Id = await ins(i.insertTrainingProgram, { title: "IEC 62304 Medical Device Software Lifecycle — Awareness Training", code: "TRN-SW-001", version: "1.0", description: "Covers IEC 62304 software safety classification, lifecycle requirements (planning, requirements, architecture, unit testing, integration, system testing, release), and change management for medical device software.", duration: 240, passingScore: 80, frequency: "annual", requiredRoles: ["qms-manager", "qms-director"], documentId: null, isActive: true, createdAt: now - 180 * day, updatedAt: now - 180 * day });
    const prog2Id = await ins(i.insertTrainingProgram, { title: "ISO 14971 Risk Management for AI/ML Medical Devices", code: "TRN-RISK-001", version: "1.0", description: "Covers ISO 14971:2019 risk management process including hazard identification (clinical, software, cybersecurity), risk estimation (probability × severity), risk evaluation, and FMEA methodology applied to AI systems.", duration: 180, passingScore: 75, frequency: "annual", requiredRoles: ["qms-manager", "qms-director", "qms-auditor"], documentId: null, isActive: true, createdAt: now - 180 * day, updatedAt: now - 180 * day });
    await ins(i.insertTrainingRecord, { userId: adminUserId, programId: prog1Id, status: "completed", score: 92, completedAt: now - 90 * day, expiresAt: now + 275 * day, evidence: "Online assessment — 92/100. Certificate QMS-TRN-2025-001.", createdAt: now - 90 * day });
    await ins(i.insertTrainingRecord, { userId: adminUserId, programId: prog2Id, status: "completed", score: 88, completedAt: now - 85 * day, expiresAt: now + 280 * day, evidence: "Online assessment — 88/100. Certificate QMS-TRN-2025-002.", createdAt: now - 85 * day });

    // ── 9. DHF ITEMS ────────────────────────────────────────────────────────
    const dhfItems = [
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-001", title: "Device Description — Pixelence MRI Enhancement v2", category: "Device Description", description: "AI-based software that synthesizes gadolinium-contrast-enhanced MRI (T1+Gd) from non-contrast multimodal inputs (T1, T2, FLAIR) using a 3D GAN architecture. Intended for use as decision support — supplementary to clinical judgement.", documentRef: "SPEC-SW-001", status: "approved", version: "2.1", createdAt: now - 200 * day, updatedAt: now - 200 * day },
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-002", title: "Intended Use Statement", category: "Intended Use", description: "Provide radiologists with a synthesized gadolinium-contrast-enhanced MRI image as a visual aid to support detection and characterisation of brain lesions. Not a replacement for true gadolinium MRI. Intended user: qualified radiologist. Intended patient population: adult brain MRI patients.", documentRef: "SPEC-SW-001", status: "approved", version: "1.0", createdAt: now - 200 * day, updatedAt: now - 200 * day },
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-003", title: "Software Architecture — UNet3D GAN (5.6M params)", category: "Design Output", description: "Generator: UNet3D_Deep_Supervision_attention_cbam (5.6M params, 3 encoding levels + bottleneck + 3 decoding, CBAM reduction=8, spatial kernel=7, deep supervision lambda=0.3, dilations=[2,4,8]). Discriminator: PatchGAN. Input: 3ch (T1/T2/FLAIR), Output: 1ch (T1+Gd).", documentRef: "SPEC-SW-001", status: "approved", version: "2.0", createdAt: now - 160 * day, updatedAt: now - 90 * day },
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-004", title: "Model Training & Validation Report (100-Epoch GAN)", category: "Design Verification", description: "Training: 200-epoch GAN on TCIA Yale + UCSD-PTGBM. Results at epoch 100: PSNR 23.62 dB (criterion ≥20 ✓), SSIM 0.708 (criterion ≥0.65 ✓), MAE 0.047 (criterion ≤0.08 ✓). 1,048 subjects excluded for FOV mismatch. Acceptance criteria met per FORM-QMS-001.", documentRef: "RPT-VAL-001", status: "approved", version: "1.0", createdAt: now - 35 * day, updatedAt: now - 30 * day },
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-005", title: "Risk Management File", category: "Risk Management", description: "ISO 14971 risk file. 5 risks identified: RSK-001 (false negative, RPN 20, mitigated), RSK-002 (FOV mismatch, RPN 9, mitigated), RSK-003 (OOD protocol, RPN 36, open/ALARP), RSK-004 (API timeout, RPN 4, mitigated), RSK-005 (quantization regression, RPN 12, mitigated).", documentRef: "SOP-QMS-003", status: "in_review", version: "1.1", createdAt: now - 100 * day, updatedAt: now - 20 * day },
      { projectId: "DHF-PIXELENCE-V2", itemCode: "DHF-006", title: "Deployment Architecture — AWS ECS Fargate", category: "Design Output", description: "FastAPI REST API in Docker on ECS Fargate (2GB RAM). Endpoints: GET /health, POST /enhance. Model weights Fernet-encrypted in S3 (470MB GAN or 21MB TorchScript). CloudWatch CPU >80% alarm. Cost: ~$0.04/hr on-demand, $0.01/hr Spot.", documentRef: "SOP-QMS-001", status: "approved", version: "1.0", createdAt: now - 140 * day, updatedAt: now - 60 * day },
    ];
    for (const item of dhfItems) await ins(i.insertDhfItem, item);

    // ── 10. AUDIT TRAIL ─────────────────────────────────────────────────────
    const events = [
      { action: "document.approved", tableName: "qms_documents", details: "RPT-VAL-001 v1.0 approved", timestamp: now - 30 * day },
      { action: "capa.opened", tableName: "qms_capas", details: "CAPA-2025-001 opened following AUD-2025-001-F01", timestamp: now - 45 * day },
      { action: "risk.reviewed", tableName: "qms_risks", details: "RSK-003 reviewed — ALARP status confirmed", timestamp: now - 20 * day },
      { action: "change_request.approved", tableName: "qms_change_requests", details: "CR-2025-002 approved — TorchScript deployment", timestamp: now - 30 * day },
      { action: "audit.completed", tableName: "qms_audits", details: "AUD-2025-001 completed — 3 findings raised", timestamp: now - 46 * day },
      { action: "complaint.received", tableName: "qms_complaints", details: "CMP-2025-001 received from Royal Infirmary Edinburgh", timestamp: now - 15 * day },
      { action: "complaint.resolved", tableName: "qms_complaints", details: "CMP-2025-002 resolved — ECS auto-scaling updated", timestamp: now - 10 * day },
      { action: "supplier.qualified", tableName: "qms_suppliers", details: "AWS qualified as critical infrastructure supplier", timestamp: now - 150 * day },
      { action: "training.completed", tableName: "qms_training_records", details: "IEC 62304 training completed — score 92%", timestamp: now - 90 * day },
      { action: "document.created", tableName: "qms_documents", details: "FORM-QMS-001 model acceptance criteria form created", timestamp: now - 80 * day },
      { action: "change_request.approved", tableName: "qms_change_requests", details: "CR-2025-001 approved — GAN v2.0 upgrade authorised", timestamp: now - 90 * day },
      { action: "capa.closed", tableName: "qms_capas", details: "CAPA-2024-003 closed — BatchNorm instability resolved", timestamp: now - 90 * day },
    ];
    for (const e of events) {
      await ins(i.insertAuditLog, { action: e.action, tableName: e.tableName, recordId: "demo-seed", userId: adminUserId, timestamp: e.timestamp, details: e.details, ipAddress: "127.0.0.1" });
    }

    return {
      status: "seeded",
      counts: {
        documents: docs.length,
        risks: risks.length,
        capas: 3,
        capaActions: 3,
        audits: 2,
        auditFindings: 3,
        suppliers: 4,
        changeRequests: 2,
        complaints: 2,
        trainingPrograms: 2,
        trainingRecords: 2,
        dhfItems: dhfItems.length,
        auditTrailEntries: events.length,
      },
    };
  },
});
