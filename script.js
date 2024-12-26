// System type definitions with ONLY hardware points
const systemTypes = {
    ahu: {
        verySimple: { hw: 6, points: {ui: 4, bi: 1, bo: 1, co: 0, ao: 0} },
        simple: { hw: 12, points: {ui: 6, bi: 2, bo: 2, co: 1, ao: 1} },
        average: { hw: 21, points: {ui: 8, bi: 4, bo: 5, co: 2, ao: 2} },
        complex: { hw: 30, points: {ui: 10, bi: 6, bo: 8, co: 3, ao: 3} }
    },
    chiller: {
        verySimple: { hw: 5, points: {ui: 3, bi: 1, bo: 1, co: 0, ao: 0} },
        simple: { hw: 14, points: {ui: 6, bi: 2, bo: 3, co: 2, ao: 1} },
        average: { hw: 32, points: {ui: 12, bi: 6, bo: 8, co: 3, ao: 3} },
        complex: { hw: 48, points: {ui: 16, bi: 10, bo: 12, co: 6, ao: 4} }
    },
    vav: {
        simple: { hw: 2, points: {ui: 1, bi: 0, bo: 1, co: 0, ao: 0} },
        average: { hw: 4, points: {ui: 2, bi: 0, bo: 1, co: 1, ao: 0} },
        complex: { hw: 7, points: {ui: 3, bi: 1, bo: 2, co: 1, ao: 0} }
    }
};

// Controller definitions
const controllers = {
    cgm04060: {
        model: 'M4-CGM04060-0',
        ui: 3, bi: 1, bo: 2, co: 4, ao: 0,
        supportedSystems: ['ahu', 'chiller']
    },
    cgm09090: {
        model: 'M4-CGM09090-0',
        ui: 7, bi: 2, bo: 3, co: 4, ao: 2,
        supportedSystems: ['ahu', 'chiller']
    },
    cvm03050: {
        model: 'M4-CVM03050-0',
        ui: 3, bi: 0, bo: 3, co: 2, ao: 0,
        supportedSystems: ['vav']
    },
    xpm04060: {
        model: 'M4-XPM04060-0',
        ui: 3, bi: 1, bo: 2, co: 4, ao: 0,
        requiresBase: true
    },
    xpm09090: {
        model: 'M4-XPM09090-0',
        ui: 7, bi: 2, bo: 3, co: 4, ao: 2,
        requiresBase: true
    }
};

// Panel size definitions
const panelSizes = {
    smallest: {
        size: '16x20',
        maxControllers: 1
    },
    small: {
        size: '20x24',
        maxControllers: 2
    },
    medium: {
        size: '24x24',
        maxControllers: 2
    },
    mediumLarge: {
        size: '24x36',
        maxControllers: 4
    },
    large: {
        size: '30x42',
        maxControllers: 6
    },
    largest: {
        size: '36x48',
        maxControllers: 8
    }
};

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addSystem').addEventListener('click', addSystem);
});

function addSystem() {
    const systemRow = document.createElement('div');
    systemRow.className = 'system-row';
    
    const systemSelect = createSystemSelect();
    const complexitySelect = createComplexitySelect();
    const quantityInput = createQuantityInput();
    const deleteButton = createDeleteButton();
    
    systemRow.appendChild(systemSelect);
    systemRow.appendChild(complexitySelect);
    systemRow.appendChild(quantityInput);
    systemRow.appendChild(deleteButton);
    
    document.getElementById('systemList').appendChild(systemRow);
    
    updateComplexityOptions(systemSelect, complexitySelect);
    calculateRecommendation();
}

function createSystemSelect() {
    const select = document.createElement('select');
    select.innerHTML = Object.keys(systemTypes).map(type => 
        `<option value="${type}">${type.toUpperCase()}</option>`
    ).join('');
    
    select.addEventListener('change', (e) => {
        updateComplexityOptions(e.target, e.target.nextElementSibling);
        calculateRecommendation();
    });
    return select;
}

function createComplexitySelect() {
    const select = document.createElement('select');
    select.addEventListener('change', calculateRecommendation);
    return select;
}

function createQuantityInput() {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.value = '1';
    input.addEventListener('change', calculateRecommendation);
    return input;
}

function createDeleteButton() {
    const button = document.createElement('button');
    button.textContent = 'Delete';
    button.className = 'delete-btn';
    button.addEventListener('click', (e) => {
        e.target.parentElement.remove();
        calculateRecommendation();
    });
    return button;
}

function updateComplexityOptions(systemSelect, complexitySelect) {
    const systemType = systemSelect.value;
    const complexities = Object.keys(systemTypes[systemType]);
    
    complexitySelect.innerHTML = complexities.map(complexity => 
        `<option value="${complexity}">${complexity}</option>`
    ).join('');
}

function calculateHardwarePoints(systems) {
    let totalPoints = {
        ui: 0, bi: 0, bo: 0, co: 0, ao: 0,
        total: 0
    };
    
    systems.forEach(system => {
        const points = systemTypes[system.type][system.complexity].points;
        const quantity = system.quantity;
        
        totalPoints.ui += points.ui * quantity;
        totalPoints.bi += points.bi * quantity;
        totalPoints.bo += points.bo * quantity;
        totalPoints.co += points.co * quantity;
        totalPoints.ao += points.ao * quantity;
        totalPoints.total += systemTypes[system.type][system.complexity].hw * quantity;
    });
    
    return totalPoints;
}

function determineControllers(points, systems) {
    let requiredControllers = [];
    let warnings = [];
    
    // Handle VAV controllers first
    const vavSystems = systems.filter(s => s.type === 'vav');
    if (vavSystems.length > 0) {
        const totalVAVs = vavSystems.reduce((sum, sys) => sum + sys.quantity, 0);
        requiredControllers.push({
            model: 'M4-CVM03050-0',
            quantity: totalVAVs,
            type: 'VAV Controller'
        });
    }
    
    // Handle other systems
    const nonVAVSystems = systems.filter(s => s.type !== 'vav');
    if (nonVAVSystems.length > 0) {
        const remainingPoints = {
            ui: points.ui,
            bi: points.bi,
            bo: points.bo,
            co: points.co,
            ao: points.ao
        };

        // First try CGM09090 controllers for best point density
        const cgm09090Count = Math.ceil(Math.max(
            remainingPoints.ui / controllers.cgm09090.ui,
            remainingPoints.bi / controllers.cgm09090.bi || 0,
            remainingPoints.bo / controllers.cgm09090.bo,
            remainingPoints.co / controllers.cgm09090.co,
            remainingPoints.ao / controllers.cgm09090.ao || 0
        ));

        if (cgm09090Count > 0) {
            requiredControllers.push({
                model: 'M4-CGM09090-0',
                quantity: cgm09090Count,
                type: 'General Purpose Controller'
            });

            // Check if expansion modules needed
            const remainingAfterCGM = {
                ui: remainingPoints.ui - (cgm09090Count * controllers.cgm09090.ui),
                bi: remainingPoints.bi - (cgm09090Count * controllers.cgm09090.bi),
                bo: remainingPoints.bo - (cgm09090Count * controllers.cgm09090.bo),
                co: remainingPoints.co - (cgm09090Count * controllers.cgm09090.co),
                ao: remainingPoints.ao - (cgm09090Count * controllers.cgm09090.ao)
            };

            if (Object.values(remainingAfterCGM).some(v => v > 0)) {
                const xpmCount = Math.ceil(Math.max(
                    remainingAfterCGM.ui / controllers.xpm09090.ui,
                    remainingAfterCGM.bi / controllers.xpm09090.bi || 0,
                    remainingAfterCGM.bo / controllers.xpm09090.bo,
                    remainingAfterCGM.co / controllers.xpm09090.co,
                    remainingAfterCGM.ao / controllers.xpm09090.ao || 0
                ));

                if (xpmCount > 0) {
                    requiredControllers.push({
                        model: 'M4-XPM09090-0',
                        quantity: xpmCount,
                        type: 'Expansion Module'
                    });
                }
            }
        }
    }
    
    return { controllers: requiredControllers, warnings };
}

function determinePanelSize(totalControllers) {
    if (totalControllers <= 1) return panelSizes.smallest;
    if (totalControllers <= 2) return panelSizes.small;
    if (totalControllers <= 4) return panelSizes.mediumLarge;
    if (totalControllers <= 6) return panelSizes.large;
    return panelSizes.largest;
}

function calculateRecommendation() {
    const systems = [];
    document.querySelectorAll('.system-row').forEach(row => {
        systems.push({
            type: row.children[0].value,
            complexity: row.children[1].value,
            quantity: parseInt(row.children[2].value)
        });
    });
    
    const points = calculateHardwarePoints(systems);
    const { controllers: requiredControllers, warnings } = determineControllers(points, systems);
    
    const totalControllers = requiredControllers.reduce((sum, c) => sum + c.quantity, 0);
    const panelSize = determinePanelSize(totalControllers);
    const numberOfPanels = Math.ceil(totalControllers / panelSize.maxControllers);
    
    const totalDevices = requiredControllers.reduce((sum, c) => sum + c.quantity
