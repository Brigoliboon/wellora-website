# WellOra Backend — Requirements

## 1. Purpose

Define the backend API requirements for WellOra: ordering, kit activation, sample return and transport tracking, lab processing, reporting, AI-assisted result interpretation, and admin monitoring. No UI or client-specific design is covered — any client (mobile app, future clinic/lab/admin tools) is expected to consume this API.

---

## 2. Kit Status Model

A kit moves through four statuses. All transitions are automatic except one.

1. **Not Activated** — default state after purchase.
2. **Activated** — set when the patient completes activation (see §4).
3. **Transporting** — set when the sample leaves the patient's hands, whether by clinic drop-off confirmation or pickup collection. Both return paths use this same shared status.
4. **Testing in Progress** — set automatically when the sample arrives at the lab assigned at order time.
5. **Results Ready** — the **only manual transition** in the system. Triggered when the lab attaches a report to the kit ID.

Both return paths converge on the same statuses:
- **Drop-off:** patient delivers to any partner clinic → clinic confirms receipt → Transporting → clinic forwards to the assigned lab → Testing in Progress.
- **Pickup:** sample collected directly from the patient, no clinic involved → Transporting → delivered to the assigned lab → Testing in Progress.

---

## 3. Project Requirements (Non-Functional)

- **Security & data privacy:** All health-data-bearing endpoints (reports, activation info, results) require authenticated, role-scoped access. Reports and results are restricted to the patient, the processing lab, and WellOra admin (aggregate/anonymized only) — clinics get order/handoff metadata only, never result data. Patient consent at activation must be stored and auditable. Data encrypted at rest and in transit. Must account for the Philippines Data Privacy Act of 2012 (RA 10173); recommend legal review before launch.
- **Idempotency:** QR-triggered actions (activation, report attachment, status transitions) must be safe to retry without creating duplicate state.
- **Auditability:** Every automatic status transition is logged with timestamp and triggering event.
- **Performance:** QR scan → kit lookup resolves near-instantly, since a patient or lab tech is waiting in person. Nearest-clinic and nearest-lab geo queries return fast enough to feel responsive at order time.
- **Scalability:** Multi-tenant from the start — multiple clinics and labs onboarding over time, not a fixed small set. Lab quota and assignment logic scales to many concurrent labs without hardcoded assumptions.
- **Versioning:** API versioned from the start (e.g. `/v1/...`), since client releases won't always align with backend deploys.

---

## 4. Feature Requirements

### 4.1 Auth & Patient Identity
- Register/login via mobile number
- OTP generation and verification
- Session/token issuance and refresh
- Device fingerprinting (see §4.4)

### 4.2 Clinics
- List partner clinics
- Nearest-clinic lookup (geo query)

### 4.3 Catalog & Ordering
- List kit types (urinalysis, fecalysis, oral) with individual and bulk pricing
- Create order (individual or bulk quantity)
- Lab assignment at order time (see §4.6) — automatic (nearest, under quota) or manual (user-selected, quota-validated)
- Kit delivery method: pickup or shipped-to-patient (delivery fee applies)
- Payment initiation

### 4.4 QR Resolution & Kit Activation
- Resolve scanned QR payload to a kit ID
- **Status check first:** if the kit is already Activated, return a redirect/next-action to tracking. Nothing else runs.
- **If not activated:**
  1. Check kit expiry — reject if expired.
  2. Check device fingerprint against the patient's currently trusted device.
     - **Known device:** skip OTP, proceed directly to consent + basic info.
     - **Unknown device:** trigger OTP to the patient's mobile number. On successful verification, this device **replaces** the previously trusted device (single-device trust, not a multi-device list).
  3. Collect consent + basic info.
  4. Mark kit Activated.
- Response should be a structured "next action" result (not an HTTP redirect itself), since no frontend exists yet to define redirect targets.

### 4.5 Device Fingerprint Trust Model
- One trusted device per patient account at any time.
- Binding happens only via successful OTP verification during activation.
- Binding a new device overwrites the previous one — no multi-device trust, no manual device management.
- Example: patient activates Kit A on Phone 1 (Phone 1 trusted) → later activates Kit B on Phone 2 (Phone 2 becomes trusted, replacing Phone 1) → any future activation from Phone 1 now requires OTP again.

### 4.6 Lab Assignment & Quota
- Assignment happens **at order time**, before the patient has the physical kit.
- User chooses the assignment mode per order:
  - **Automatic:** system assigns the nearest partner lab currently under its daily quota.
  - **Manual:** user selects a specific lab; validated against that lab's current quota before the order is confirmed.
- Each lab has an **optional** daily quota (a sample count) that resets daily. A lab with no quota configured is unlimited.
- Quota is checked at order-time assignment for both modes.

### 4.7 Sample Return & Transport Tracking
- Patient selects return method: drop-off (any partner clinic) or pickup.
- **Drop-off:** clinic receipt-confirmation endpoint → status: Transporting.
- **Pickup:** collection-confirmation event → status: Transporting.
- Lab arrival event → status: Testing in Progress.
- Tracking-status read endpoint, keyed by kit ID / QR.

### 4.8 Lab Reporting
- Lab resolves QR → kit ID.
- Lab attaches report (scanned image upload or soft-copy file upload), keyed to kit ID.
- This is the one manual trigger → status: Results Ready.

### 4.9 AI Summary & Chatbot
- Generate AI summary of a completed report.
- Chatbot conversation endpoint for result interpretation.
- Tool-call trigger: when the patient asks for a diagnosis, or the result is abnormal, surface a "book a consultation" action — a handoff point to an external/future consultation service, not that service's own implementation.

### 4.10 Ratings
- Submit a lab rating tied to a completed kit.
- Retrieve aggregate lab ratings.

### 4.11 Admin / Monitoring
- Kit distribution stats (purchased, activated, in progress, completed).
- Clinic sales volume.
- Lab processed volume.
- Lab ratings aggregate.
- Read-only reporting endpoints.

---

## 5. Assumptions

- Mobile app is the first and primary API consumer; clinic, lab, and admin clients come later but should be supported by the same API without rework.
- Payment gateway is not yet chosen — requirements assume an abstracted "payment initiation" step.
- Consultation booking integrates with an external/future service; this API only needs to expose the handoff trigger.

---

## 6. Open Questions

1. **Quota reservation timing:** does assigning a lab at order time immediately consume one unit of that day's quota, or is quota only checked/consumed when the sample physically arrives at the lab (which could be days later)? Affects whether a lab can be overbooked relative to its same-day quota.
2. **Pickup collection event:** who/what triggers the "collected" event that moves a pickup-path kit to Transporting — a rider's app action, a scan, something else?
3. **Lab arrival event:** what triggers Transporting → Testing in Progress — automatic based on expected transit time, or an explicit signal (rider app, lab system)?
4. **Rejected/unusable sample:** needs a defined endpoint/state for the lab to flag a sample instead of attaching a report.
5. **Delivery fee and pickup fee logic:** not yet defined at a rules level (flat fee, distance-based, etc.).
