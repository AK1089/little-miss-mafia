const investigativeGroups = [
    [46, 47, 68, 57, 90],
    [53, 59, 42, 4, 24],
    [9, 61, 76, 58, 39],
    [45, 10, 35, 91, 87],
    [29, 7, 14, 78, 77],
    [25, 18, 63, 92, 3],
    [65, 27, 38, 80, 85],
    [69, 95, 93, 12, 40],
    [62, 55, 81, 75, 23],
    [94, 13, 17, 1, 21],
    [49, 74, 22, 36, 72],
    [67, 20, 15, 37, 60]
];
const investigatorID = 53;

let rolesData = [];
let currentRoleIndex = 0;

// Load roles on page load
document.addEventListener('DOMContentLoaded', async function () {
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

function navigateToRole(roleId) {
    const roleIndex = rolesData.findIndex(role => role.id === roleId);
    if (roleIndex !== -1) {
        currentRoleIndex = roleIndex;
        updateDisplay();
        updateURL();
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

function updateInvestigativeResults(currentRole) {
    const resultsDiv = document.getElementById('investigativeResults');

    // Find the group containing this role ID
    const group = investigativeGroups.find(group => group.includes(currentRole.id));

    if (!group) {
        resultsDiv.innerHTML = '';
        return;
    }

    // Get the other roles in the group (excluding current role)
    const otherRoleIds = group//.filter(id => id !== currentRole.id);
    const otherRoles = otherRoleIds.map(id => rolesData.find(role => role.id === id)).filter(Boolean);

    const investigator = rolesData.find(role => role.id === investigatorID);
    const investigatorName = investigator ? investigator.name.replace(/<br>/g, ' ') : 'Investigator';

    let html = `<h4><a href="#" onclick="navigateToRole(${investigatorID}); return false;">${investigatorName} Results</a></h4>`;
    html += '<ul>';

    otherRoles.forEach(role => {
        const cleanName = role.name.replace(/<br>/g, ' ');
        html += `<li><a href="#" onclick="navigateToRole(${role.id}); return false;">${cleanName}</a></li>`;
    });

    html += '</ul>';
    resultsDiv.innerHTML = html;
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

    // Use fullAbilities if available, otherwise fall back to abilities
    const abilitiesToUse = role.fullAbilities || role.abilities;

    abilitiesToUse.forEach(ability => {
        const abilityDiv = document.createElement('div');
        abilityDiv.className = 'ability-item';

        // Extract tags and clean text
        const tagRegex = /<([^>]+)>/g;
        const tags = [];
        let match;

        while ((match = tagRegex.exec(ability)) !== null) {
            tags.push(match[1]);
        }

        // Remove tags from ability text
        const cleanText = ability.replace(tagRegex, '').trim();

        // Create ability text
        const textDiv = document.createElement('div');
        textDiv.className = 'ability-text';
        textDiv.textContent = cleanText;

        // Create icons
        const iconsDiv = document.createElement('div');
        iconsDiv.className = 'ability-icons';

        tags.forEach(tag => {
            const iconImg = document.createElement('img');
            iconImg.className = 'ability-icon';
            iconImg.src = `icons/icon-${tag}.svg`;
            iconImg.alt = tag;
            iconImg.title = tag; // Tooltip showing the tag name

            // Fallback if icon doesn't exist
            iconImg.onerror = function () {
                // Create fallback div with same styling as before
                const fallbackDiv = document.createElement('div');
                fallbackDiv.className = 'ability-icon';
                fallbackDiv.style.background = '#ddd';
                this.parentNode.replaceChild(fallbackDiv, this);
            };

            iconsDiv.appendChild(iconImg);
        });

        abilityDiv.appendChild(textDiv);
        abilityDiv.appendChild(iconsDiv);
        abilitiesContainer.appendChild(abilityDiv);
    });

    // Update win condition
    document.getElementById('roleWincon').textContent = role.wincon;
    updateInvestigativeResults(role);

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