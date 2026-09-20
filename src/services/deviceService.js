import { componentRepository, deviceRepository } from "@/lib/repository";

export function getDeviceProfile(deviceId) { const device = deviceRepository.get(deviceId); return device ? { ...device, components: componentRepository.list(deviceId) } : null; }
export function createDevice(input) { if (!input?.brand || !input?.model || !input?.location) throw new Error("Brand, model and location are required."); return deviceRepository.create(input); }
