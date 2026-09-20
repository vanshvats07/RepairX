export function buildWorkshopQueries({ device, problem, requiredCapabilities = [], location }) {
	const capabilities = requiredCapabilities.length ? requiredCapabilities.join(" ") : "repair";
	return [`${device.brand} ${device.model} ${capabilities} ${location}`, `${device.brand} mobile ${problem} ${location}`, `${device.brand} service center ${location}`];
}

export function normalizeWorkshopResult(result = {}, index = 0) {
	return { id: result.id || `live-workshop-${index}`, name: result.name || result.title || "Workshop name unavailable", address: result.address || result.address_snippet || "Address unavailable", locality: result.locality || "Delhi NCR", city: result.city || "Delhi", pincode: result.pincode || null, latitude: result.latitude || result.gps_coordinates?.latitude || null, longitude: result.longitude || result.gps_coordinates?.longitude || null, phone: result.phone || null, website: result.website || result.link || null, rating: result.rating || null, reviewCount: result.reviewCount || result.reviews || null, hours: result.hours || null, distance: result.distance || null, capabilities: result.capabilities || [], source: result.source || "Search result", sourceType: result.sourceType || "REPORTED", retrievedAt: result.retrievedAt || new Date().toISOString(), authorizationStatus: result.authorizationStatus || "UNKNOWN" };
}

export function searchLocalWorkshops({ device, problem, requiredCapabilities = [], location }) {
	return { queries: buildWorkshopQueries({ device, problem, requiredCapabilities, location }), workshops: [], live: false, fallbackMessage: "No workshop records are available yet. Connect a workshop database or live local search." };
}

export function matchWorkshops({ device, problem, requiredCapabilities = ["Battery diagnostics", "Charging system inspection", "Thermal diagnostics"], location, workshops }) {
	const candidates = workshops || searchLocalWorkshops({ device, problem, requiredCapabilities, location }).workshops;
	const text = `${problem} ${requiredCapabilities.join(" ")}`.toLowerCase();
	return candidates.map((workshop) => {
		const deviceCompatibility = workshop.supportedDevices?.some((item) => item.toLowerCase().includes(device.model.toLowerCase())) || workshop.supportedBrands?.includes(device.brand);
		const matchedCapabilities = (workshop.capabilities || workshop.specializations || []).filter((item) => /battery|charg|board|thermal|diagnostic/i.test(`${item} ${text}`));
		const capabilityMatch = matchedCapabilities.length > 0;
		const nearby = Boolean(workshop.distance) || workshop.locality?.toLowerCase().includes(location.split(",")[0].toLowerCase());
		const availability = Boolean(workshop.availability);
		const factors = [{ label: "Compatible device", value: deviceCompatibility }, { label: "Relevant repair capability", value: capabilityMatch }, { label: "Nearby location", value: nearby }, { label: "Availability signal", value: availability }];
		return { ...workshop, matchedCapabilities, matchReasons: factors.filter((factor) => factor.value).map((factor) => factor.label), factors, dataConfidence: workshop.sourceType || "UNKNOWN", transparentMatch: `${factors.filter((factor) => factor.value).length}/${factors.length} matching signals` };
	}).sort((a, b) => b.matchReasons.length - a.matchReasons.length);
}

export function getWorkshopDetails(workshopId, workshops = []) { return workshops.find((workshop) => workshop.id === workshopId) || null; }

export function createRepairRequest({ deviceId, investigationId, workshopId, complaint, preliminaryAssessment, requiredCapabilities }) {
	return { deviceId, investigationId, workshopId, complaint, preliminaryAssessment, requiredCapabilities, status: "REQUESTED", createdAt: new Date().toISOString() };
}
