# RepairX changelog

## 2026-09-20

### Fixed
- Restricted investigation and device access to the owning customer.
- Enforced ownership checks on repair-request and repair-job creation and retrieval.
- Prevented unauthorized quote access and quote mutation by non-owner/admin roles.
- Tightened repair request workflow and job creation flow to prevent cross-account access.
- Hardened the repair timeline and post-repair report routes to use authentic DB-backed records.
- Cleaned up the zero-warning lint state by removing anonymous default exports in service modules.

### Security / data integrity
- Added server-side authorization checks around customer records and workshop-owned operations.
- Prevented direct unauthenticated access to sensitive repair and investigation records.
- Kept workflow transitions tied to persisted business state instead of trusting frontend input.

### Deployment / operational notes
- Added environment template for required variables.
- Full end-to-end live MongoDB / multi-user validation still requires a real database and auth session in a non-local dev environment.

### Known external dependency
- Live workshop and parts discovery remain dependent on a valid `SERPAPI_API_KEY` and a reachable MongoDB instance.
- Without those external dependencies, the app will degrade gracefully and show empty/live-unavailable states rather than fake business data.
