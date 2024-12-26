// System type definitions with point counts
const systemTypes = {
    ahu: {
        verySimple: { hw: 6, sw: 5, total: 11, objects: 25, 
            points: {ui: 4, bi: 2, bo: 3, co: 2, ao: 0} },
        simple: { hw: 12, sw: 10, total: 22, objects: 49,
            points: {ui: 6, bi: 3, bo: 4, co: 3, ao: 1} },
        average: { hw: 21, sw: 15, total: 36, objects: 80,
            points: {ui: 8, bi: 4, bo: 6, co: 4, ao: 2} },
        complex: { hw: 30, sw: 20, total: 50, objects: 110,
            points: {ui: 10, bi: 6, bo: 8, co: 6, ao: 3} }
    },
    chiller: {
        verySimple: { hw: 5, sw: 10, total: 15, objects: 33,
            points: {ui: 3, bi: 2, bo: 2, co: 2, ao: 1} },
        simple: { hw: 14, sw: 20, total: 34, objects: 75,
            points: {ui: 6, bi: 3, bo: 4, co: 3, ao: 2} },
        average: { hw: 32, sw: 30, total: 62, objects: 137,
            points: {ui: 8, bi: 4, bo: 6, co: 4, ao: 3} },
        complex: { hw: 48, sw: 40, total: 88, objects: 194,
            points: {ui: 12, bi: 6, bo: 8, co: 6, ao: 4} }
    },
    vav: {
        simple: { hw: 2, sw: 5, total: 7, objects: 16,
            points: {ui: 3, bi: 0, bo: 3, co: 2, ao: 0} },
        average: { hw: 4, sw: 10, total: 14, objects: 31,
            points: {ui: 3, bi: 0, bo: 3, co: 2, ao: 0} },
        complex: { hw: 7, sw: 15, total: 22, objects: 49,
            points: {ui: 3, bi: 0, bo: 3, co: 2, ao: 0} }
    }
};

// Controller definitions
const controllers = {
    cgm04060: {
        points: 10,
        type: 'General Purpose',
        model: 'M4-CGM04060-0',
        ui: 3, bi: 1, bo: 2, co: 4, ao: 0,
        supportedSystems: ['ahu', 'chiller', 'boiler', 'fcu']
    },
    cgm09090: {
        points: 18,
        type: 'General Purpose',
        model: 'M4-CGM09090-0',
        ui: 7, bi: 2, bo: 3, co: 4, ao: 2,
        supportedSystems: ['ahu', 'chiller', 'boiler', 'fcu']
    },
    cvm03050: {
        points: 8,
        type: 'VAV',
        model: 'M4-CVM03050-0',
        ui: 3, bi: 0, bo: 3, co: 2, ao: 0,
        supportedSystems: ['vav']
    },
    xpm04060: {
        points: 10,
        type: 'Expansion',
        model: 'M4-XPM04060-0',
        ui: 3, bi: 1, bo: 2, co: 4, ao: 0,
        requiresBase: true
    },
    xpm09090: {
        points: 18,
        type: 'Expansion',
        model: 'M4-XPM09090-0',
        ui: 7, bi: 2, bo: 3, co: 4, ao: 2,
        requiresBase: true
    },
    xpm18000: {
        points: 18,
        type: 'Expansion',
        model: 'M4-XPM18000-0',
        ui: 0, bi: 18, bo: 0, co: 0, ao: 0,
        requiresBase: true
    }
};

// Panel size definitions based on sizing guide
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

function calculatePointRequirements(systems) {
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
        totalPoints.total += systemTypes[system.type][system.complexity].total * quantity;
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
        
        // Determine base controllers needed
        const cgm09090Count = Math.ceil(Math.max(
            remainingPoints.ui / controllers.cgm09090.ui,
            remainingPoints.bi / controllers.cgm09090.bi,
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
        }
        
        // Check if expansion modules are needed
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
                remainingAfterCGM.bi / controllers.xpm09090.bi,
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
    
    const points = calculatePointRequirements(systems);
    const { controllers: requiredControllers, warnings } = determineControllers(points, systems);
    
    const totalControllers = requiredControllers.reduce((sum, c) => sum + c.quantity, 0);
    const panelSize = determinePanelSize(totalControllers);
    const numberOfPanels = Math.ceil(totalControllers / panelSize.maxControllers);
    
    // Determine SNE model
    let totalDevices = requiredControllers.reduce((sum, c) => sum + c.quantity, 0);
    let recommendedSNE = 'SNE10500';
    if (totalDevices > 150) recommendedSNE = 'SNE22000';
    else if (totalDevices > 60) recommendedSNE = 'SNE11000';
    
    // Update UI
    updateUI(points, requiredControllers, totalDevices, recommendedSNE, panelSize, numberOfPanels, warnings);
}

function updateUI(points, controllers, totalDevices, sneModel, panelSize, panelCount, warnings) {
    document.getElementById('recommendation').classList.remove('hidden');
    
    // Update points
    document.getElementById('totalUI').textContent = points.ui;
    document.getElementById('totalBI').textContent = points.bi;
    document.getElementById('totalBO').textContent = points.bo;
    document.getElementById('totalCO').textContent = points.co;
    document.getElementById('totalAO').textContent = points.ao;
    
    // Update controllers
    const controllerList = document.getElementById('controllerList');
    controllerList.innerHTML = controllers.map(c => 
        `<div>${c.quantity}x ${c.model} (${c.type})</div>`
    ).join('');
    
    document.getElementById('totalDevices').textContent = totalDevices;
    document.getElementById('recommendedSNE').textContent = sneModel;
    document.getElementById('recommendedPanel').textContent = 
        `${panelCount}x ${panelSize.size} NEMA 1 panels (Max ${panelSize.maxControllers} controllers per panel)`;
    
    // Update warnings
    const warningsDiv = document.getElementById('warnings');
    warningsDiv.innerHTML = warnings.map(w => `<div class="warning">${w}</div>`).join('');
}
