import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/mongodb";
import Workshop from "@/models/Workshop";
import WorkshopClaim from "@/models/WorkshopClaim";
import WorkshopMembership from "@/models/WorkshopMembership";
import AuditEvent from "@/models/AuditEvent";
import Notification from "@/models/Notification";
import { requireAuth, requireRole } from "@/services/authService";

export async function PATCH(request, { params }) {
  try {
    const user = requireRole(await requireAuth(), ["ADMIN"]);
    const payload = await request.json();
    const { action, reason } = payload || {};
    if (!action || !["APPROVE", "REJECT", "REQUEST_MORE_INFO"].includes(action)) {
      return NextResponse.json({ error: "A valid action is required." }, { status: 400 });
    }

    await connectMongo();
    if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });

    const claim = await WorkshopClaim.findById(params.claimId);
    if (!claim) return NextResponse.json({ error: "Workshop claim not found." }, { status: 404 });
    if (String(claim.workshopId) !== String(params.id)) {
      return NextResponse.json({ error: "Claim does not belong to this workshop." }, { status: 400 });
    }

    const workshop = await Workshop.findById(params.id);
    if (!workshop) return NextResponse.json({ error: "Workshop not found." }, { status: 404 });

    if (action === "APPROVE") {
      claim.status = "APPROVED";
      claim.reviewedAt = new Date();
      claim.reviewedBy = user._id;
      await claim.save();

      workshop.verificationStatus = "VERIFIED";
      workshop.verificationSource = "OWNER_SUBMITTED";
      workshop.ownerUserId = claim.userId;
      workshop.isNetworkWorkshop = true;
      if (!workshop.businessType) workshop.businessType = "UNKNOWN";
      await workshop.save();

      const membership = await WorkshopMembership.findOneAndUpdate(
        { workshopId: workshop._id, userId: claim.userId },
        { $set: { role: "OWNER", status: "ACTIVE" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await Notification.create({
        userId: claim.userId,
        type: "REQUEST_ACCEPTED",
        entityType: "WorkshopClaim",
        entityId: claim._id,
        title: "Workshop claim approved",
        body: "Your workshop profile has been verified and is now part of the RepairX network."
      });

      await AuditEvent.create({
        entityType: "WorkshopClaim",
        entityId: claim._id,
        workshopId: workshop._id,
        claimId: claim._id,
        action: "WORKSHOP_VERIFIED",
        eventType: "WORKSHOP_VERIFIED",
        actorId: user._id,
        actorRole: user.role,
        metadata: { membershipId: membership?._id || null, reason: reason || null }
      });

      return NextResponse.json({ data: { claim, workshop } });
    }

    if (action === "REJECT") {
      claim.status = "REJECTED";
      claim.reviewedAt = new Date();
      claim.reviewedBy = user._id;
      await claim.save();
      workshop.verificationStatus = "REJECTED";
      await workshop.save();
      await AuditEvent.create({
        entityType: "WorkshopClaim",
        entityId: claim._id,
        workshopId: workshop._id,
        claimId: claim._id,
        action: "WORKSHOP_REJECTED",
        eventType: "WORKSHOP_REJECTED",
        actorId: user._id,
        actorRole: user.role,
        metadata: { reason: reason || null }
      });
      return NextResponse.json({ data: { claim, workshop } });
    }

    claim.status = "PENDING";
    claim.reviewedAt = new Date();
    claim.reviewedBy = user._id;
    await claim.save();
    workshop.verificationStatus = "UNDER_REVIEW";
    await workshop.save();
    await AuditEvent.create({
      entityType: "WorkshopClaim",
      entityId: claim._id,
      workshopId: workshop._id,
      claimId: claim._id,
      action: "WORKSHOP_CLAIM_REQUESTED_MORE_INFO",
      eventType: "WORKSHOP_CLAIM_REQUESTED_MORE_INFO",
      actorId: user._id,
      actorRole: user.role,
      metadata: { reason: reason || null }
    });
    return NextResponse.json({ data: { claim, workshop } });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to review workshop claim." }, { status: error.code === "FORBIDDEN" ? 403 : 401 });
  }
}
