import Device from "@/models/Device";

export async function getOwnedDevice(deviceId, user) {
  if (!user?._id || !deviceId) return null;
  return Device.findOne({ _id: deviceId, userId: user._id }).lean();
}
