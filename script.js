class RoleShowcase {
    constructor() {
        this.roles = [];
        this.gridElement = document.getElementById('role-grid');
        this.init();
    }

    async init() {
        await this.loadRoles();
        this.renderRoles();
        this.setupEventListeners();
    }

    async loadRoles() {
        const response = await fetch('roles.json');
        this.roles = await response.json();
    }

    renderRoles() {
        this.gridElement.innerHTML = '';
        
        this.roles.forEach(role => {
            const cardElement = this.createRoleCard(role);
            this.gridElement.appendChild(cardElement);
        });
    }

    createRoleCard(role) {
        const card = document.createElement('div');
        card.className = 'role-card';
        card.dataset.roleId = role.id;
        const alignment = role.archetype.split(" ")[0].toLowerCase();

        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                <h2 class="role-name">${role.name}</h2>
                <img src=".${role.image}" 
                alt="${role.name}" 
                class="role-image">
                <span class="role-archetype archetype-${alignment}">${alignment}</span>
                </div>
                <div class="card-back">
                    <h2 class="role-name-back">${role.name}</h2>
                    <h2 class="alignment-title">Alignment: ${role.archetype}</h2>
                    <ul class="abilities-list">
                    ${role.abilities.map(ability => `<li>${ability}</li>`).join('')}
                    </ul>
                    <h2 class="win-condition">Win Condition: ${role.wincon}</h2>
                    </div>
            </div>
        `;

        return card;
    }

    setupEventListeners() {
        this.gridElement.addEventListener('click', (e) => {
            const card = e.target.closest('.role-card');
            if (card) {
                card.classList.toggle('flipped');
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.role-card.flipped').forEach(card => {
                    card.classList.remove('flipped');
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new RoleShowcase();
});