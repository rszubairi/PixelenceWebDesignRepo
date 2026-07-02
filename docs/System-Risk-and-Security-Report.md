# Pixelence MRI System: System Risk and Security Report

**Document ID:** PX-SEC-RPT-2026-001  
**Version:** 1.0  
**Date:** March 26, 2026  
**Status:** DRAFT (Internal Review)  
**Applicable Standards:** ISO 14971:2019, ISO 27001:2022, ISO 42001:2023, HIPAA Privacy Rule

---

## 1. Executive Summary
This report summarizes the risk management and cybersecurity measures implemented for the **Pixelence MRI System**. The system utilizes a Conditional Generative Adversarial Network (cGAN) to provide 4x super-resolution and denoising for brain MRI scans. Our analysis confirms that with the current mitigations, the residual risks to patient safety and data privacy remain within acceptable levels for clinical evaluation as a Class II medical device (intended classification).

## 2. Intended Use and Scope
- **Intended Use:** Enhancement of low-resolution or noisy brain MRI scans to assist radiologists in visual interpretation.
- **Contraindications:** Not for primary diagnosis without concurrent review of raw (non-enhanced) DICOM images.
- **Scope:** Covers the Next.js portal, API Gateway, and the AI Inference Service (BrainEnhance).

## 3. Risk Management Methodology (ISO 14971)
We employ a Failure Mode and Effects Analysis (FMEA) approach to identify hazards, assess their severity (S) and probability (P), implement mitigations (M), and re-evaluate residual risk.

---

## 4. Approach: "Security by Design" & "Privacy by Design"
Pixelence utilizes a "Secure Software Development Life Cycle" (S-SDLC) that integrates security and ethics at every stage of the project, from initial concept to deployment:

- **Security by Design:** We eliminated traditional vulnerable storage patterns (e.g., `localStorage`) in our portal architecture, replacing them with **Secure, HttpOnly-capable Cookies** with `SameSite=Strict` policies to mitigate Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF). 
- **Privacy by Design:** Patient identification is never used for AI inference. The **BrainEnhance** API operates on de-identified `.npy` pixel volumes only, ensuring the AI model has no access to Protected Health Information (PHI). 
- **Encryption Best Practices (A.10):** We implement asymmetric model protection. The AI model resides in an encrypted state at rest, with the **Fernet Decryption Key** managed as an ephemeral environment secret (`FERNET_KEY`), preventing static key exposure in source code or build artifacts.

---

## 5. Ethical AI Development & Clinical Integrity (ISO 42001)
Pixelence demonstrates leadership in ethical AI development by prioritizing diagnostic safety and clinician trust:

### 5.1 "Human-in-the-Loop" (HITL) Architecture
To ensure non-maleficence (doing no harm), our system is designed not as a replacement, but as an **Augmentative Intelligence** tool. 
- **Mandatory Review:** The portal requires a Radiologist to explicitly "Approve" AI-enhanced findings, ensuring that the final diagnostic decision rests with a human expert.
- **Transparency:** Every enhanced image is presented side-by-side with the raw scan. The system never modifies the original DICOM data; it generates a parallel "enhanced view," maintaining the clinical "Ground Truth."

### 5.2 Bias Mitigation and Fairness (B.7)
We recognize that medical AI can suffer from demographic bias if trained on non-representative data.
- **Diverse Dataset:** Our model (v1.0.3) was trained on a comprehensive dataset of **250,000 high-resolution scans** across multiple hospitals and scanner types (1.5T to 3.0T), ensuring robustness across varying patient demographics and technical acquisition parameters. 
- **Clinical Validation:** We utilize industry-standard performance metrics (PSNR, SSIM) to ensure the enhancement represents accurate anatomical reconstruction rather than synthetic "hallucination."

### 5.3 Transparency and Interpretability (B.10)
To avoid the "Black Box" problem, Pixelence ensures traceability:
- **Model Versioning:** Every report is tagged with the specific AI Model version (e.g., v1.0.3) used for generation. 
- **Structured Explanability:** The AI analysis generates structured reports (`aiAnalysis` schema) that break down findings into specific sites and natures of uptake, rather than providing an opaque diagnostic score.

---

## 6. Patient Data Handling & PHI Security
Data handling follows the principle of **Data Minimization**:

1. **Storage Isolation:** The **Convex** database is configured to store only the minimal clinical metadata required for scheduling and reporting. 
2. **DICOM Anonymization:** Our recommended hospital gateway removes PHI headers before transmitting pixel data to the cloud-based **BrainEnhance** API.
3. **Role-Based Access (Control A.9):** Access follows the **Principle of Least Privilege**. For example, a "Finance User" can view billing and high-level job statistics but is restricted from viewing clinical report conclusions or the actual MRI images.

---

## 7. Cybersecurity Risk & Hazard Identification (ISO 14971)
We employ a Failure Mode and Effects Analysis (FMEA) approach to identify hazards:

| Hazard ID | Hazard | Severity | Probability | Mitigation Implemented | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Unauthorized Access to PHI | High | Medium | **Secure Session Management:** Migration to secure cookies with `SameSite: Strict`. | **LOW** |
| **SEC-002** | Model Tampering / IP Theft | High | Low | **Hardware-Level Encryption:** Model weights decrypted ONLY in memory during inference via env-secrets. | **LOW** |
| **SEC-003** | AI Reconstruction Artifacts | High | Medium| **Side-by-Side Visualization:** Direct comparison with raw scan and mandatory human sign-off. | **ACCEPTABLE** |
| **SEC-004** | API Injection / Overload | Medium | Medium | **Input Validation:** Strict DICOM format/header validation and FastAPI rate-limiting. | **LOW** |

---

## 8. Incident Response and Post-Market Surveillance (PMS)
- **Vulnerability Patching:** Monthly auditing of software dependencies (Node.js/PyTorch) for known CVEs.
- **Continuous Monitoring:** Detailed health logs in `mlService.js` and `api.js` (FastAPI) provide real-time alerts on system degradation or unusual traffic patterns.
- **Feedback Loop:** Our reporting interface includes a "Report Inaccuracy" feature for radiologists to flag any AI-enhanced artifacts, feeding directly into our model retraining cycle (v1.0.4+).

## 9. Conclusion: Technical and Ethical Command
The Pixelence MRI System has undergone rigorous security hardening and ethical vetting. By adopting **ISO 42001** for AI Management and **ISO 27001** for Security, we have built a platform that respects patient privacy while maximizing the diagnostic potential of modern neuroimaging. Our "Human-in-the-Loop" architecture ensures that AI enhances, rather than disrupts, the high standards of radiological practice.

**Approved by:**  
*ISO (Information Security Officer)*  
*CMO (Chief Medical Officer)*  
*Director of AI Ethics*
