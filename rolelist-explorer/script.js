let rolelists = {};
let currentPlayerCount = 8;
let minPlayers = 4;
let maxPlayers = 20;

// Load rolelists on page load
document.addEventListener('DOMContentLoaded', async function () {
    await loadRolelists();
    updateDisplay();
    setupEventListeners();
});

async function loadRolelists() {
    try {
        const response = await fetch('rolelists.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        rolelists = await response.json();

        // Determine min/max players from available rolelists
        const playerCounts = Object.keys(rolelists).map(Number);
        minPlayers = Math.min(...playerCounts);
        maxPlayers = Math.max(...playerCounts);

        // Set default to 12 if available, otherwise use the closest
        if (rolelists[12]) {
            currentPlayerCount = 12;
        } else {
            currentPlayerCount = playerCounts.find(count => count >= 8) || playerCounts[0];
        }

        console.log(`✅ Loaded rolelists for ${playerCounts.length} player counts`);

    } catch (error) {
        console.error('❌ Error loading rolelists:', error);
        minPlayers = 8;
        maxPlayers = 12;
        currentPlayerCount = 12;
    }
}

function setupEventListeners() {
    document.getElementById('decreaseBtn').addEventListener('click', () => {
        if (currentPlayerCount > minPlayers) {
            currentPlayerCount--;
            updateDisplay();
        }
    });

    document.getElementById('increaseBtn').addEventListener('click', () => {
        if (currentPlayerCount < maxPlayers) {
            currentPlayerCount++;
            updateDisplay();
        }
    });

    // Copy to clipboard with Cmd+Enter (or Ctrl+Enter on Windows)
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault();
            copyToClipboard();
        }
    });
}

function updateDisplay() {
    // Update player count display
    document.getElementById('playerCount').textContent = currentPlayerCount;

    // Update button states
    const decreaseBtn = document.getElementById('decreaseBtn');
    const increaseBtn = document.getElementById('increaseBtn');

    decreaseBtn.disabled = currentPlayerCount <= minPlayers;
    increaseBtn.disabled = currentPlayerCount >= maxPlayers;

    // Get current rolelist
    const currentRoles = rolelists[currentPlayerCount] || [];

    // Count alignments
    const counts = countAlignments(currentRoles);
    updateAlignmentSummary(counts);

    // Display roles
    displayRoles(currentRoles, counts);
}

function countAlignments(roles) {
    const counts = { town: 0, mafia: 0, neutral: 0 };

    roles.forEach(role => {
        const alignment = role.toLowerCase();
        if (alignment.startsWith('town')) {
            counts.town++;
        } else if (alignment.startsWith('mafia')) {
            counts.mafia++;
        } else if (alignment.startsWith('neutral')) {
            counts.neutral++;
        }
    });

    return counts;
}

function updateAlignmentSummary(counts) {
    const parts = [];

    if (counts.town > 0) {
        parts.push(`${counts.town} Town`);
    }
    if (counts.mafia > 0) {
        parts.push(`${counts.mafia} Mafia`);
    }
    if (counts.neutral > 0) {
        parts.push(`${counts.neutral} Neutral`);
    }

    document.getElementById('alignmentText').textContent = parts.join(', ');
}

function displayRoles(roles, counts) {
    const townList = document.getElementById('townRoles');
    const evilList = document.getElementById('evilRoles');

    // Clear existing content
    townList.innerHTML = '';
    evilList.innerHTML = '';

    roles.forEach(role => {
        const li = document.createElement('li');
        li.textContent = role;

        const alignment = role.toLowerCase();
        if (alignment.startsWith('town')) {
            li.className = 'town-role';
            townList.appendChild(li);
        } else if (alignment.startsWith('mafia')) {
            li.className = 'mafia-role';
            evilList.appendChild(li);
        } else if (alignment.startsWith('neutral')) {
            li.className = 'neutral-role';
            evilList.appendChild(li);
        }
    });
}

function copyToClipboard() {
    const currentRoles = rolelists[currentPlayerCount] || [];

    if (currentRoles.length === 0) {
        return;
    }

    const text = currentRoles.join('\n');

    navigator.clipboard.writeText(text).then(() => {
        showCopyNotification();
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyNotification();
    });
}

function showCopyNotification() {
    const notification = document.getElementById('copyNotification');
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 2000);
}