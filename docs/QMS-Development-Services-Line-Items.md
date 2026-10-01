# Pixelence QMS: Development Services Line Items

Derived from `QMS-Functional-Specifications.md` (v1.2) and `Pixelence_QMS_Software_Development_Specification_v0.1.docx`.

**Hours are planning estimates, not quotes.** No rates were provided, so the rate and cost columns are left for you to fill in. Estimates assume a small team and reuse of the existing `pixelence-qms/` and `convex/qms/` code. Where code exists, effort may be lower.


## 1. Project Foundation & Architecture

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 1 | Discovery, requirements baseline & project plan | Spec §1, §9 | 40 |
| 2 | Monorepo setup (Turborepo), isolated Next.js QMS app (port 3002), CI/CD pipeline | §2, §9 Ph.1 | 40 |
| 3 | Convex schema: 18 tables, indexes, validators, migrations | §7 | 48 |
| 4 | Authentication, RBAC (super-admin, manager, director, auditor, staff), IdP/SSO and MFA | §3; FR-001 | 64 |
| 5 | QMS portal shell: layout, navigation, responsive design system | NFR | 40 |
| 6 | Express API gateway extensions (PDF, email, e-sign verify endpoints) | §2.1 | 48 |
| | **Subtotal** | | **280** |

## 2. Compliance Core (21 CFR Part 11 / Annex 11)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 7 | Electronic signature engine (re-auth, bcrypt verify, HMAC-SHA256, signature records) | §5.1; FR-002 | 56 |
| 8 | ESignatureModal UI with signature meaning and metadata display | §5.1 | 24 |
| 9 | Immutable audit trail: writeAuditLog helper, wrapping all write mutations, append-only enforcement | §5.2; FR-003 | 40 |
| 10 | Audit trail viewer UI (search, filter, export) | §5.2 | 24 |
| 11 | Notification service (SMTP/SendGrid email, in-app alerts) | §8 | 40 |
| 12 | Convex Scheduler workflows (review reminders, CAPA timers, escalations) | §6; Ph.3 | 48 |
| | **Subtotal** | | **232** |

## 3. Document & Change Control (DCC)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 13 | Document lifecycle backend (draft, in-review, awaiting approval, effective, archived, obsolete) and versioning | §4.1; FR-004 | 64 |
| 14 | Change request module linked to risks, requirements and releases | FR-005 | 40 |
| 15 | Controlled PDF rendition (watermark, version stamp, signature block) and file storage | §4.1 | 40 |
| 16 | Document UI: list, detail, review/approval flow, version history | §4.1 | 56 |
| 17 | Periodic review tracking and reminders | §4.1, §4.11 | 16 |
| | **Subtotal** | | **216** |

## 4. Training Management (TM)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 18 | Training programs and role-based curricula | §4.2 | 32 |
| 19 | Quiz/assessment engine with configurable passing score | §4.2 | 40 |
| 20 | Training records, status state machine, auto-retraining on new SOP version | §4.2 | 32 |
| 21 | Clinical portal gating (block critical actions on lapsed training) | §4.2, §9 Ph.3 | 40 |
| | **Subtotal** | | **144** |

## 5. Requirements & Traceability (RT)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 22 | Requirements registry and hierarchy (PRD, SRS, specs, tests) | §4.3 | 40 |
| 23 | Bi-directional trace links, traceability matrix and orphan detection | §4.3 | 56 |
| 24 | GitHub/GitLab integration (commit/PR linking) | §4.3, §8 | 56 |
| 25 | Traceability matrix/graph UI | §9 Ph.4 | 48 |
| | **Subtotal** | | **200** |

## 6. Risk Management (ISO 14971)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 26 | Hazard register and FMEA scoring (S/P/D, RPN) | §4.4; FR-006 | 48 |
| 27 | Mitigation linkage to SRS and tests; residual risk computation | §4.4 | 32 |
| 28 | Risk UI with FMEA calculator and risk matrix | §9 Ph.4 | 32 |
| | **Subtotal** | | **112** |

## 7. Design & Development Control (Digital DHF)

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 29 | DHF projects and phase management (planning to design transfer) | §4.5; FR-007 | 48 |
| 30 | DHF items (inputs, outputs, V&V) with linkage and status | §4.5 | 40 |
| 31 | Design review multi-user sign-offs and phase locking | §4.5 | 40 |
| 32 | DHF UI and package export | §4.5 | 48 |
| | **Subtotal** | | **176** |

## 8. CAPA & Nonconformance

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 33 | Nonconformance capture and containment | §4.6 | 32 |
| 34 | CAPA workflow with action items (initiation to closure) | §4.6; FR-008 | 48 |
| 35 | Root cause tooling (5 Whys, Ishikawa diagram) | §4.6 | 40 |
| 36 | Effectiveness verification via scheduler (e.g. 60 days) and sign-off | §6.2 | 24 |
| 37 | CAPA UI | §9 Ph.4 | 40 |
| | **Subtotal** | | **184** |

## 9. Supplier Quality Management

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 38 | Supplier registry, criticality and Approved Supplier List | §4.7; FR-009 | 32 |
| 39 | SCAR workflow with vendor-facing upload portal | §4.7 | 56 |
| 40 | Periodic supplier review, scoring and certificate expiry alerts | FR-009 | 24 |
| | **Subtotal** | | **112** |

## 10. Complaint Handling & PMS

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 41 | Complaint intake and 'Report Inaccuracy' loop from clinical portal | §4.8; FR-010 | 40 |
| 42 | MDR/Vigilance decision tree with 15/30-day deadline tracking | §4.8 | 40 |
| 43 | PMS trend analysis and complaint-to-CAPA linkage | §4.8 | 40 |
| | **Subtotal** | | **120** |

## 11. Audits & Management Review

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 44 | Audit scheduling, checklists and auditor assignment | §4.9 | 40 |
| 45 | Findings registry with auto-CAPA for major findings | §4.9; FR-011 | 24 |
| 46 | Management review: agenda, minutes, follow-up actions | §4.9 | 40 |
| | **Subtotal** | | **104** |

## 12. AI Copilot

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 47 | LLM gateway (Vertex AI/OpenAI), prompt guardrails, usage logging | §4.10; ISO 42001 | 32 |
| 48 | SOP draft generator | §4.10; FR-013 | 40 |
| 49 | Risk assessment helper (hazard suggestions) | §4.10 | 40 |
| 50 | Traceability auditor (gap analysis) | §4.10 | 32 |
| | **Subtotal** | | **144** |

## 13. Reporting, Dashboard & Administration

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 51 | CAPA dashboard | §4.11 | 32 |
| 52 | Document matrix | §4.11 | 16 |
| 53 | Executive review dashboard (KPIs, training compliance, audits, complaints) | §4.11; FR-012 | 40 |
| 54 | Home dashboard | Spec §4 | 24 |
| 55 | Administration (users, roles, configuration) | Spec §4 | 40 |
| | **Subtotal** | | **152** |

## 14. Verification, Validation & Release

| # | Line item | Spec ref | Est. hours |
|---|---|---|---:|
| 56 | Automated testing (unit, integration, E2E) per module | Spec §10 | 160 |
| 57 | Computer system validation documentation (IQ/OQ/PQ, IEC 62304 and Part 11 evidence) | §1.1 | 120 |
| 58 | Security and penetration testing, encryption review | NFR | 40 |
| 59 | Data seeding and migration of existing quality records | - | 24 |
| 60 | UAT support and defect remediation | UAT-Test-Plan.md | 40 |
| 61 | Production deployment, monitoring, hardening | NFR 99.9% | 40 |
| 62 | User documentation and training | - | 32 |
| | **Subtotal** | | **456** |

## Summary

| | Hours |
|---|---:|
| Development subtotal | 2632 |
| Project management & QA oversight (10%) | 263 |
| **Total** | **2895** |

Total cost = hours × your blended rate.

## Notes

- The two source documents disagree on architecture. The .docx (v0.1) lists NestJS, PostgreSQL, MinIO and Temporal. The Markdown spec (v1.2, newer) specifies Convex, Convex Scheduler and an Express gateway. These line items follow v1.2. A NestJS/Postgres/Temporal build would add roughly 150 to 250 hours of backend infrastructure.
- The roadmap phases (Core QMS, Design Control, Risk & CAPA, PMS & Audits, AI Automation) map to sections 1-5, 7, 6 and 8, 9-11, and 12 above.
- Excluded: hosting and LLM usage costs, third-party licences, regulatory consulting, and external audit or notified-body fees.
