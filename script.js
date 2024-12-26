// System definitions
const systemTypes = {
    ahu: {
        verySimple: { hw: 6, sw: 5, total: 11, objects: 25 },
        simple: { hw: 12, sw: 10, total: 22, objects: 49 },
        average: { hw: 21, sw: 15, total: 36, objects: 80 },
        complex: { hw: 30, sw: 20, total: 50, objects: 110 }
    },
    chiller: {
        verySimple: { hw: 5, sw: 10, total: 15, objects: 33 },
        simple: { hw: 14, sw: 20, total: 34, objects: 75 },
        average: { hw: 32, sw: 30, total: 62, objects: 137 },
        complex: { hw: 48, sw: 40, total: 88, objects: 194 }
    },
    vav: {
        simple: { hw: 2, sw: 5, total: 7, objects: 16 },
        average: { hw: 4, sw: 10, total: 14, objects: 31 },
        complex: { hw: 7, sw: 15, total: 22, objects: 49 }
    }
};

// Controller definitions
const controllers = {
    cgm09090: {
        points: 18,
        maxPoints: 18
    },
    xpm09090: {
        points: 18,
        maxPoints: 18
    }
};

let systems = [];

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
    
    systemRow.appendChild(systemSelect);
    systemRow.appendChild(complexitySelect);
    systemRow.appendChild(quantityInput);
    
    document.getElementById('systemList').appendChild(systemRow);
    
    updateComplexityOptions(systemSelect, complexitySelect);
    calculateRecommendation();
}

function createSystemSelect() {
    const select = document.createElement('select');
    select.innerHTML = `
        <option value="ahu">AHU</option>
        <option value="chiller">Chiller</option>
        <option value="vav">VAV</option>
    `;
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

function updateComplexityOptions(systemSelect, complexitySelect) {
    const systemType = systemSelect.value;
    const complexities = Object.keys(systemTypes[systemType]);
    
    complexitySelect.innerHTML = complexities.map(complexity => 
        `<option value="${complexity}">${complexity}</option>`
    ).join('');
}

function calculateRecommendation() {
    let totalPoints = 0;
    let totalDevices = 0;
    
    document.querySelectorAll('.system-row').forEach(row => {
        const systemType = row.children[0].value;
        const complexity = row.children[1].value;
        const quantity = parseInt(row.children[2].value);
        
        const systemSpec = systemTypes[systemType][complexity];
        totalPoints += systemSpec.total * quantity;
        totalDevices += quantity;
    });
    
    // Calculate required CGM+XPM combinations
    const pointsPerCombo = controllers.cgm09090.points + controllers.xpm09090.points;
    const requiredCombos = Math.ceil(totalPoints / pointsPerCombo);
    
    // Determine SNE model
    let recommendedSNE = 'SNE10500';
    if (totalDevices > 150) recommendedSNE = 'SNE22000';
    else if (totalDevices > 60) recommendedSNE = 'SNE11000';
    
    // Determine panel size
    const panelSize = requiredCombos <= 2 ? '24x20' : '36x24';
    
    // Update UI
    document.getElementById('recommendation').classList.remove('hidden');
    document.getElementById('totalPoints').textContent = totalPoints;
    document.getElementById('totalDevices').textContent = totalDevices;
    document.getElementById('requiredControllers').textContent = `${requiredCombos} CGM09090+XPM09090 combinations`;
    document.getElementById('recommendedSNE').textContent = recommendedSNE;
    document.getElementById('recommendedPanel').textContent = `${panelSize} NEMA 1`;
}
