// pseudo-random number generator which takes a seed
class SeededRandom {
    // if no seed is not provided, use the current timestamp
    constructor(seed) {
        this.seed = seed ? this.hashCode(seed.toString()) : Date.now();
    }
    
    // hash a string to a number
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // generate the next random number
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

let rolesData = null;
let rng = null;

// load roles and add button upon page load
document.addEventListener('DOMContentLoaded', async function() {
    await loadRoles();
    updateAssignButton();

    // bind command-enter to assign button anywhere on the page
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && event.metaKey) {
            event.preventDefault();
            assignRoles();
        }
    });
});

// add input listeners for each input
document.getElementById('roleListInput').addEventListener('input', updateAssignButton);
document.getElementById('playerListInput').addEventListener('input', updateAssignButton);
document.getElementById('assignBtn').addEventListener('click', assignRoles);

// get roles from json file
async function loadRoles() {
    const loadingDiv = document.getElementById('loadingMessage');
    const errorDiv = document.getElementById('errorMessage');
    
    try {
        loadingDiv.style.display = 'block';
        errorDiv.style.display = 'none';
        
        const response = await fetch('./../roles.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // read file and parse JSON
        rolesData = await response.json();
        loadingDiv.style.display = 'none';
        console.log(`✅ Loaded ${rolesData.length} roles successfully!`);
        
    } catch (error) {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = `❌ Error loading roles: ${error.message}`;
        errorDiv.style.display = 'block';
        rolesData = null;
    }
}

// disable the button when inputs are invalid
function updateAssignButton() {
    const btn = document.getElementById('assignBtn');
    const roleList = document.getElementById('roleListInput').value.trim();
    btn.disabled = !rolesData || !roleList;
}

// assign roles to players
function assignRoles() {
    const roleListText = document.getElementById('roleListInput').value.trim();
    const playerListText = document.getElementById('playerListInput').value.trim();
    const seedText = document.getElementById('seedInput').value.trim();
    if (!roleListText || !rolesData) return;

    // initialise a new SeededRandom instance with the provided seed
    rng = new SeededRandom(seedText);

    // parse role slots and player names
    const roleSlots = roleListText.split('\n').map(line => line.trim()).filter(line => line);
    const playerNames = playerListText ? playerListText.split('\n').map(line => line.trim()).filter(line => line) : [];
    
    // shuffle player names
    const shuffledPlayers = [...playerNames];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    // create assignments array
    const assignments = [];

    // assign roles to each slot
    for (let i = 0; i < roleSlots.length; i++) {
        const slot = roleSlots[i];
        const playerName = shuffledPlayers[i] || null;
        
        try {
            const assignedRole = assignRoleForSlot(slot);
            assignments.push({
                slotNumber: i + 1,
                slotDescription: slot,
                playerName: playerName,
                role: assignedRole
            });
        } catch (error) {
            assignments.push({
                slotNumber: i + 1,
                slotDescription: slot,
                playerName: playerName,
                error: error.message
            });
        }
    }

    displayResults(assignments);
}

// given a slot in the rolelist, pick a valid corresponding role
function assignRoleForSlot(slotDescription) {
    const parts = slotDescription.split(' ');
    if (parts.length < 2) {
        throw new Error(`Invalid slot format: ${slotDescription}`);
    }

    // pick out the alignment (Town/Mafia/Neutral) and the archetype specification (everything else)
    const alignment = parts[0]; // Town, Mafia, etc.
    const archetypeSpec = parts.slice(1).join(' ');
    
    // filter to only roles of this alignment
    const alignmentRoles = rolesData.filter(role => 
        role.archetype.toLowerCase().startsWith(alignment.toLowerCase())
    );

    // make sure some role exists for this alignment
    if (alignmentRoles.length === 0) {
        throw new Error(`No roles found for alignment: ${alignment}`);
    }

    // "Any" = any role of this alignment is fine
    if (archetypeSpec.toLowerCase() === 'any') {
        const randomIndex = Math.floor(rng.next() * alignmentRoles.length);
        return alignmentRoles[randomIndex];
    }

    // check if this is a "Non-" specification, if so we negate the search
    const isNegated = archetypeSpec.toLowerCase().includes('non-');
    const cleanSpec = archetypeSpec.replace(/non-/gi, '');

    // get each archetype specifier by splitting on "/"
    const archetypes = cleanSpec.split('/').map(a => a.trim()).filter(a => a);
    
    // find matching roles based on archetype
    const matchingRoles = alignmentRoles.filter(role => {

        // for each role, find the archetype and check it matches by start
        const roleArchetypePart = role.archetype.split(' ').slice(1).join(' ');
        const matchesAnyArchetype = archetypes.some(archetype => 
            roleArchetypePart.toLowerCase().startsWith(archetype.toLowerCase())
        );
        
        // return based on whether we're negating or not
        return isNegated ? !matchesAnyArchetype : matchesAnyArchetype;
    });

    // again check if we found any matching roles
    if (matchingRoles.length === 0) {
        throw new Error(`No roles found matching: ${slotDescription}`);
    }

    // assuming roles exist, pick a random role using seeded RNG
    const randomIndex = Math.floor(rng.next() * matchingRoles.length);
    return matchingRoles[randomIndex];
}

// get the archetype class for a role
function getArchetypeClass(archetype) {
    const lower = archetype.toLowerCase();
    if (lower.includes('town')) return 'archetype-town';
    if (lower.includes('mafia')) return 'archetype-mafia';
    return 'archetype-neutral';
}

// once roles are assigned, display the cards
function displayResults(assignments) {
    const resultsDiv = document.getElementById('results');
    
    // filter successful and error assignments
    const successful = assignments.filter(a => !a.error);
    const errors = assignments.filter(a => a.error);

    // role grid
    let html = '<div class="role-grid">';

    // successful assignments first
    successful.forEach(assignment => {
        const role = assignment.role;
        const alignment = role.archetype.split(" ")[0].toLowerCase();
        
        // header with the relevant slot description and the player who got this role
        const slotHeaderText = assignment.playerName ? 
            `${assignment.slotDescription}<br>${assignment.playerName}` :
            `${assignment.slotDescription}`;
        
        // role card
        html += `
            <div>
                <div class="slot-header">${slotHeaderText}</div>
                <div class="role-card">
                    <div class="card-inner">
                        <div class="card-front">
                            <h2 class="role-name">${role.name}</h2>
                            <img src="..${role.image}" 
                                 alt="${role.name}" 
                                 class="role-image">
                            <span class="role-archetype archetype-${alignment}">${alignment}</span>
                        </div>
                        <div class="card-back">
                            <h2 class="role-name-back"><a href="../roles?id=${role.id}">${role.name}</a></h2>
                            <h2 class="alignment-title">Alignment: ${role.archetype}</h2>
                            <ul class="abilities-list">
                                ${role.abilities.map(ability => `<li>${ability}</li>`).join('')}
                            </ul>
                            <h2 class="win-condition">Win Condition: ${role.wincon}</h2>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // display error cards
    errors.forEach(assignment => {
        const slotHeaderText = assignment.playerName ? 
            `${assignment.slotDescription}<br>${assignment.playerName}` :
            `${assignment.slotDescription}`;
            
        html += `
            <div>
                <div class="slot-header" style="background: rgba(151, 52, 55, 0.9);">
                    ${slotHeaderText}
                </div>
                <div class="role-card">
                    <div class="card-inner">
                        <div class="card-front" style="background: #ffebee;">
                            <div class="role-image" style="background: #ffcdd2;">❌</div>
                            <div class="role-name" style="color: #c62828;">Assignment Failed</div>
                            <div style="color: #d32f2f; padding: 1rem; text-align: center; font-size: 0.9rem;">
                                ${assignment.error}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    resultsDiv.innerHTML = html;
}