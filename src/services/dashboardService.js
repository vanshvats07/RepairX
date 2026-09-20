import Device from "@/models/Device";
import Investigation from "@/models/Investigation";
import Notification from "@/models/Notification";
import RepairRequest from "@/models/RepairRequest";
import TechnicianAssignment from "@/models/TechnicianAssignment";
import WorkshopMembership from "@/models/WorkshopMembership";

const ACTIVE_CASE_STATUSES = ["REQUESTED", "AWAITING_TECHNICIAN", "WORKSHOP_ACCEPTED", "UNDER_DIAGNOSIS", "DIAGNOSIS_VERIFIED", "QUOTE_READY", "AWAITING_CUSTOMER_APPROVAL", "APPROVED", "REPAIR_IN_PROGRESS", "QUALITY_CHECK"];

export async function getDashboardSummary(user) {
  const base = { role: user.role, devices: 0, investigations: 0, activeCases: 0, unreadNotifications: 0, pendingActions: 0 };

  if (user.role === "CUSTOMER") {
    const [devices, investigations, activeCases, unreadNotifications] = await Promise.all([
      Device.countDocuments({ userId: user._id }),
      Investigation.countDocuments({ userId: user._id }),
      RepairRequest.countDocuments({ customerId: user._id, status: { $in: ACTIVE_CASE_STATUSES } }),
      Notification.countDocuments({ userId: user._id, read: false }),
    ]);
    return { ...base, devices, investigations, activeCases, unreadNotifications, pendingActions: unreadNotifications };
  }

  if (user.role === "TECHNICIAN") {
    const assignments = await TechnicianAssignment.countDocuments({ status: { $in: ["ASSIGNED", "ACCEPTED"] } });
    return { ...base, activeCases: assignments, pendingActions: assignments };
  }

  if (user.role === "WORKSHOP_OWNER") {
    const memberships = await WorkshopMembership.find({ userId: user._id, status: "ACTIVE" }).select("workshopId").lean();
    const workshopIds = memberships.map((membership) => membership.workshopId);
    const activeCases = await RepairRequest.countDocuments({ workshopId: { $in: workshopIds }, status: { $in: ACTIVE_CASE_STATUSES } });
    return { ...base, activeCases, pendingActions: activeCases };
  }

  const [devices, investigations, activeCases, unreadNotifications] = await Promise.all([
    Device.countDocuments(),
    Investigation.countDocuments(),
    RepairRequest.countDocuments({ status: { $in: ACTIVE_CASE_STATUSES } }),
    Notification.countDocuments({ userId: user._id, read: false }),
  ]);
  return { ...base, devices, investigations, activeCases, unreadNotifications, pendingActions: activeCases };
}
