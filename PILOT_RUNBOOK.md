# RepairX Private Pilot Runbook

## 1. Workshop does not respond

- Check workshop status and onboarding state
- Verify whether a claim or invitation is still pending
- Trigger an operational alert with next action
- If no response is received within configured thresholds, pause case routing to that workshop and escalate to admin

## 2. Technician disagrees with AI

- Preserve both AI assessment and technician verification in the case record
- Require human review before changing the repair path
- Log the disagreement in the audit trail
- Escalate to admin if the disagreement affects safety, cost, or workshop direction

## 3. Customer rejects quote

- Keep the quote as evidence
- Reconfirm the issue and scope with the customer
- Offer a limited review or part recheck if the database supports it
- Do not reissue the same quote without a fresh state update

## 4. Part becomes unavailable

- Mark the repair state as paused or waiting on part availability
- Update the case timeline and operational alert
- Notify the customer with plain-language status
- Re-attempt sourcing only after controlled review

## 5. Repair fails

- Record the failure cause and technician notes
- Create an operational alert if the issue affects customer trust or safety
- Require approval before additional repair activity continues
- Preserve evidence for post-case review

## 6. Customer disputes repair

- Open a dispute record with the customer and workshop context
- Capture the evidence trail and final quote state
- Escalate to admin for approval or resolution
- Prevent further blind action until the dispute is reviewed

## 7. Delivery fails

- Update the job status to the last confirmed state
- Log the delivery failure and the reason provided
- Notify the customer and workshop
- Re-schedule only after the case is re-reviewed

## 8. External API fails

- SerpAPI unavailable: continue with local device and workshop data only
- AI unavailable: keep the device and case in a degraded assessment path
- Do not invent fake outputs to hide outages
- Record the failure in structured logs and operational metrics

## 9. Standard operator checklist

- Verify /health and /ready
- Check open pilot issues
- Review stale cases against configured thresholds
- Review AI and SerpAPI failure events
- Check open escalations and disputes
- Confirm workshop and customer invitation status
- Inspect the latest case timeline before making admin decisions
