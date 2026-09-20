# RepairX Private Pilot Launch Checklist

## APPLICATION
- READY: Core application routes, auth, and admin flows are present.
- PARTIAL: Pilot access is enforced for private beta signup.
- NOT_READY: Additional customer-facing pilot promos and public sign-up flows have not been added.

## AUTH
- READY: Session-based auth and role checks are in place.
- PARTIAL: Pilot access requires an invitation, but admin approval workflow should be confirmed in the target environment.

## DATABASE
- READY: Mongo-backed data model is active for core repair, workshop, and user state.
- PARTIAL: Production data retention and backup confirmation remain operational requirements.

## CUSTOMERS
- READY: Customer device and case lifecycle can be created from real records.
- PARTIAL: Full consent and support-contact wiring should be confirmed in the live pilot environment.

## WORKSHOPS
- READY: Workshop claims, profile ownership, and verification flows exist.
- PARTIAL: Pilot activation must be explicitly confirmed by admin for each participating workshop.

## TECHNICIANS
- READY: Technician assignment and workshop membership checks are in place.
- PARTIAL: Technician activation and credentialing require real pilot coordination.

## AI
- READY: Preliminary assessment pipeline exists.
- NOT_READY: Real AI provider configuration remains required for production-grade execution.

## SEARCH
- READY: Search service exists for internal flows.
- NOT_READY: SerpAPI or equivalent search configuration is not assumed to be present by default.

## PAYMENTS
- READY: Payment abstraction and webhook flow exist.
- NOT_READY: Live payment provider configuration is still required before real account settlement.

## PICKUP
- READY: Manual or configured pickup states exist.
- PARTIAL: External logistics providers remain optional configuration.

## REPAIR
- READY: Repair request, repair job, quality check, and completion workflows exist.
- PARTIAL: Full physical repair operations need real workshop and technician onboarding.

## QUALITY
- READY: Quality checks and completion gates are represented in the state machine.
- PARTIAL: Actual physical quality verification remains dependent on pilot operations.

## DELIVERY
- READY: Delivery request flow exists.
- PARTIAL: Real logistics provider configuration is optional and must be business-approved.

## NOTIFICATIONS
- READY: Notifications are represented in the app data model and services.
- PARTIAL: Real email/SMS/WhatsApp provider setup remains a deployment step.

## SECURITY
- READY: Private beta signup is invitation-gated and the app keeps server-side ownership checks.
- PARTIAL: Full incident handling and abuse monitoring must be validated in the operational environment.

## OBSERVABILITY
- READY: Health, readiness, and admin health checks exist.
- PARTIAL: External provider-specific alerting is still a deployment-level operation task.

## BACKUPS
- NOT_READY: Formal database and restore process documentation has not been confirmed in the live infrastructure.

## SUPPORT
- PARTIAL: Internal admin and dispute flows exist, but live pilot support routing must be confirmed in the target environment.
