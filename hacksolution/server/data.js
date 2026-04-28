// Unified Data Layer: Maps spatial coordinates back to specific internal hospitality data.
const ZONE_DATABASE = [
  {
    x: 15, z: -10,
    zone: "Dining Area",
    peopleAtRisk: 45,
    guestInfo: "Breakfast Service Active. 12 High-Priority VIPs.",
    nearestStaff: "Manager A. Smith (Dist: 12m)",
    vulnerabilities: { elderly: 4, disabled: 1, children: 8 }
  },
  {
    x: -8, z: 12,
    zone: "Room 302",
    peopleAtRisk: 3,
    guestInfo: "2 Guests, 1 Infant. Medical flags: Asthma.",
    nearestStaff: "Nurse J. Doe (Dist: 8m)",
    vulnerabilities: { elderly: 0, disabled: 0, children: 1 }
  },
  {
    x: 12, z: 15,
    zone: "Main Lobby",
    peopleAtRisk: 12,
    guestInfo: "Shift Change in Progress. 4 Arrivals pending.",
    nearestStaff: "Security Team Alpha (Dist: 5m)",
    vulnerabilities: { elderly: 2, disabled: 0, children: 2 }
  },
  {
    x: 0, z: 20,
    zone: "Garden Sector",
    peopleAtRisk: 8,
    guestInfo: "Private Event. 8 Guests.",
    nearestStaff: "Groundskeeper M. Bell (Dist: 20m)",
    vulnerabilities: { elderly: 1, disabled: 1, children: 0 }
  }
];

function getGuestInfoByLocation(x, z) {
  // Simple proximity match (nearest neighbor)
  let closest = null;
  let minDistance = Infinity;

  // Fallback defaults
  const fallback = {
    zone: "Restricted Sector",
    peopleAtRisk: 0,
    guestInfo: "Unable to retrieve guest manifest.",
    nearestStaff: "Unknown",
    vulnerabilities: { elderly: 0, disabled: 0, children: 0 }
  };

  if (x === undefined || z === undefined) return fallback;

  for (const record of ZONE_DATABASE) {
    const dx = record.x - x;
    const dz = record.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist < minDistance) {
      minDistance = dist;
      closest = record;
    }
  }

  // If closest is within a reasonable match radius (e.g., 10 units)
  if (closest && minDistance < 10) {
    return {
      zone: closest.zone,
      peopleAtRisk: closest.peopleAtRisk,
      guestInfo: closest.guestInfo,
      nearestStaff: closest.nearestStaff,
      vulnerabilities: closest.vulnerabilities
    };
  }

  return fallback;
}

module.exports = { getGuestInfoByLocation };
