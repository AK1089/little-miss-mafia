let rolesData = [];
let currentRoleIndex = 0;

// Load roles on page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadRoles();
    
    // Get role ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const roleId = urlParams.get('id');
    
    if (roleId) {
        const roleIndex = rolesData.findIndex(role => role.id === parseInt(roleId));
        if (roleIndex !== -1) {
            currentRoleIndex = roleIndex;
        }
    }
    
    updateDisplay();
    setupEventListeners();
});

async function loadRoles() {
    const loadingDiv = document.getElementById('loadingMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    try {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        const response = await fetch('../roles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        rolesData = await response.json();
        
        loadingDiv.style.display = 'none';
        console.log(`✅ Loaded ${rolesData.length} roles successfully!`);
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = `❌ Error loading roles: ${error.message}`;
        errorDiv.style.display = 'block';
        rolesData = [];
    }
}

function setupEventListeners() {
    document.getElementById('prevBtn').addEventListener('click', () => {
        currentRoleIndex = currentRoleIndex === 0 ? rolesData.length - 1 : currentRoleIndex - 1;
        updateDisplay();
        updateURL();
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        currentRoleIndex = currentRoleIndex === rolesData.length - 1 ? 0 : currentRoleIndex + 1;
        updateDisplay();
        updateURL();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            currentRoleIndex = currentRoleIndex === 0 ? rolesData.length - 1 : currentRoleIndex - 1;
            updateDisplay();
            updateURL();
        } else if (e.key === 'ArrowRight') {
            currentRoleIndex = currentRoleIndex === rolesData.length - 1 ? 0 : currentRoleIndex + 1;
            updateDisplay();
            updateURL();
        }
    });
}

function updateDisplay() {
    if (rolesData.length === 0) return;
    
    const role = rolesData[currentRoleIndex];
    
    // Update role information
    document.getElementById('roleImage').src = ".." + role.image;
    document.getElementById('roleImage').alt = role.name;
    
    // Set role name with preserved line breaks
    const roleNameElement = document.getElementById('roleName');
    roleNameElement.innerHTML = role.name; // Use innerHTML to preserve <br> tags
    
    // Set gender icon
    const genderIcon = document.getElementById('genderIcon');
    const isFemale = role.name.startsWith('Little Miss');
    genderIcon.textContent = isFemale ? '♀' : '♂';
    genderIcon.className = `gender-icon ${isFemale ? 'gender-female' : 'gender-male'}`;
    
    // Set archetype with proper styling and line break
    const archetypeElement = document.getElementById('roleArchetype');
    const alignment = role.archetype.split(' ')[0].toLowerCase();
    const archetypeWithBreak = role.archetype.replace(' ', '<br>');
    archetypeElement.innerHTML = archetypeWithBreak;
    archetypeElement.className = `role-archetype archetype-${alignment}`;
    
    // Update abilities
    const abilitiesContainer = document.getElementById('roleAbilities');
    abilitiesContainer.innerHTML = '';
    
    role.abilities.forEach(ability => {
        const abilityDiv = document.createElement('div');
        abilityDiv.className = 'ability-item';
        
        // Create icon placeholder space
        const iconsDiv = document.createElement('div');
        iconsDiv.className = 'ability-icons';
        // Add placeholder icons (will be ignored for now as requested)
        for (let i = 0; i < 4; i++) {
            const icon = document.createElement('div');
            icon.className = 'ability-icon';
            iconsDiv.appendChild(icon);
        }
        
        // Create ability text
        const textDiv = document.createElement('div');
        textDiv.className = 'ability-text';
        textDiv.textContent = ability;
        
        abilityDiv.appendChild(iconsDiv);
        abilityDiv.appendChild(textDiv);
        abilitiesContainer.appendChild(abilityDiv);
    });
    
    // Update win condition
    document.getElementById('roleWincon').textContent = role.wincon;
    
    // Update navigation buttons (no longer disable, just visual indication)
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Remove disabled states since we now wrap around
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    
    // Update page title
    document.title = role.name.replace(/<br>/g, ' ');
}

function updateURL() {
    if (rolesData.length === 0) return;
    
    const role = rolesData[currentRoleIndex];
    const newURL = `${window.location.pathname}?id=${role.id}`;
    window.history.replaceState({}, '', newURL);
}

// Handle browser back/forward
window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roleId = urlParams.get('id');
    
    if (roleId && rolesData.length > 0) {
        const roleIndex = rolesData.findIndex(role => role.id === parseInt(roleId));
        if (roleIndex !== -1) {
            currentRoleIndex = roleIndex;
            updateDisplay();
        }
    }
});