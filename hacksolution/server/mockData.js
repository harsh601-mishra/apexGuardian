const generateMockPayload = (activeNodes) => {
    const iotStats = {
        event: "glass_break",
        decibel: 118,
        temperature: 42,
        smoke_level: "medium",
        location: { x: 10, y: 6 }
    };

    const metrics = {
        total_guests: 450,
        safe: 430,
        at_risk: 20,
        responders: 12,
        response_time: "00:45 sec"
    };

    const guestInventory = [
        'Mrs. Sharma (Room 302, Elderly, Priority: Purple)',
        'Guest 105 (Room 305, Priority: Pink)'
    ];

    const vitalSigns = {};
    if (activeNodes && activeNodes.forEach) {
        activeNodes.forEach(nodeId => {
            vitalSigns[nodeId] = {
                heartRate: Math.floor(Math.random() * (160 - 70 + 1)) + 70 + ' BPM'
            };
        });
    }

    return { iotStats, metrics, guestInventory, vitalSigns };
};

module.exports = { generateMockPayload };
