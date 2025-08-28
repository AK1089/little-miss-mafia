class RoleShowcase {
    constructor() {
        this.STORAGE_KEY = 'lmm_filters_v1';
        this.roles = [];
        this.gridElement = document.getElementById('role-grid');
        this.statusEl = null;
        this.state = {
            includedArchetypes: new Set(),
            gender: 'both',
            sortBy: 'rolelist',
        };
        this.archetypesOrdered = [];
        this.init();
    }

    async init() {
        await this.loadRoles();
        this.computeArchetypes();
        this.mountArchetypeMenu();

        const restored = this.loadPersistedState();
        if (!restored) this.resetFilters(false);

        this.attachControlEvents();
        this.setupGridSizing();
        this.renderRoles();
    }

    async loadRoles() {
        const response = await fetch('roles.json');
        this.roles = (await response.json()).map((r, idx) => ({ ...r, __idx: idx }));
    }

    computeArchetypes() {
        const seen = new Set();
        for (const r of this.roles) {
            if (!seen.has(r.archetype)) {
                this.archetypesOrdered.push(r.archetype);
                seen.add(r.archetype);
            }
        }
    }

    mountArchetypeMenu() {
        const menu = document.getElementById('archetypeMenu');
        menu.innerHTML = '';

        const hdr = document.createElement('div');
        hdr.className = 'dropdown-actions';
        hdr.innerHTML = `
          <button class="tiny" id="checkAll">All</button>
          <button class="tiny" id="uncheckAll">None</button>
        `;
        menu.appendChild(hdr);

        for (const a of this.archetypesOrdered) {
            const id = `a-${a.replace(/\\s+/g, '_')}`;
            const item = document.createElement('label');
            item.className = 'dropdown-item';
            item.innerHTML = `
            <input type="checkbox" class="arch" id="${id}" data-arch="${a}" checked>
            <span>${a}</span>
          `;
            menu.appendChild(item);
        }

        document.getElementById('checkAll').addEventListener('click', () => {
            menu.querySelectorAll('input.arch').forEach(cb => cb.checked = true);
            this.syncArchetypeStateFromUI();
        });
        document.getElementById('uncheckAll').addEventListener('click', () => {
            menu.querySelectorAll('input.arch').forEach(cb => cb.checked = false);
            this.syncArchetypeStateFromUI();
        });
        menu.addEventListener('change', (e) => {
            if (e.target && e.target.matches('input.arch')) {
                this.syncArchetypeStateFromUI();
            }
        });

        const toggle = document.getElementById('archetypeToggle');
        toggle.addEventListener('click', () => {
            const expanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', String(!expanded));
            document.getElementById('archetypeDropdown').classList.toggle('open');
        });
        document.addEventListener('click', (e) => {
            const dd = document.getElementById('archetypeDropdown');
            if (!dd.contains(e.target)) {
                dd.classList.remove('open');
                document.getElementById('archetypeToggle').setAttribute('aria-expanded', 'false');
            }
        });
    }

    attachControlEvents() {
        document.getElementById('quickSelect').addEventListener('click', (e) => {
            const btn = e.target.closest('button.pill');
            if (!btn) return;
            const group = btn.dataset.group;
            const checks = [...document.querySelectorAll('#archetypeMenu input.arch')];
            const groupBoxes = checks.filter(cb => cb.dataset.arch.startsWith(group + ' '));
            const allSelected = groupBoxes.every(cb => cb.checked);
            groupBoxes.forEach(cb => cb.checked = !allSelected);
            this.syncArchetypeStateFromUI();
        });

        document.querySelectorAll('input[name="gender"]').forEach(r => {
            r.addEventListener('change', () => {
                this.state.gender = r.value;
                this.renderRoles();
                this.saveState();
            });
        });

        document.getElementById('sortBy').addEventListener('change', (e) => {
            this.state.sortBy = e.target.value;
            this.renderRoles();
            this.saveState();
        });

        document.getElementById('resetBtn').addEventListener('click', () => this.resetFilters());

        this.statusEl = document.getElementById('statusText');
    }

    resetFilters(shouldRender = true) {
        this.state.includedArchetypes = new Set(this.archetypesOrdered);
        document.querySelectorAll('#archetypeMenu input.arch').forEach(cb => cb.checked = true);
        this.updateArchetypeCountChip();

        this.state.gender = 'both';
        document.getElementById('gender-both').checked = true;

        this.state.sortBy = 'rolelist';
        document.getElementById('sortBy').value = 'rolelist';

        if (shouldRender) this.renderRoles();
        this.saveState();
    }

    syncArchetypeStateFromUI() {
        const checked = [...document.querySelectorAll('#archetypeMenu input.arch:checked')].map(cb => cb.dataset.arch);
        this.state.includedArchetypes = new Set(checked);
        this.updateArchetypeCountChip();
        this.renderRoles();
        this.saveState();
    }

    updateArchetypeCountChip() {
        const total = this.archetypesOrdered.length;
        const sel = this.state.includedArchetypes.size;
        const chip = document.getElementById('archetypeCount');
        chip.textContent = sel === total ? 'all' : `${sel}/${total}`;
    }

    passGenderFilter(role) {
        const name = role.name.replace(/<br>/g, ' ');
        if (this.state.gender === 'both') return true;
        if (this.state.gender === 'girls') return name.startsWith('Little Miss');
        if (this.state.gender === 'boys') return name.startsWith('Mr.');
        return true;
    }

    updateStatus(currentCount) {
        const total = this.roles.length;
        if (!this.statusEl) this.statusEl = document.getElementById('statusText');
        this.statusEl.textContent = currentCount === 0
            ? 'No roles match your filters.'
            : `${currentCount}/${total} roles displayed.`;
    }

    saveState() {
        const payload = {
            includedArchetypes: [...this.state.includedArchetypes],
            gender: this.state.gender,
            sortBy: this.state.sortBy,
        };
        try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload)); } catch (_) { }
    }

    loadPersistedState() {
        let raw;
        try { raw = localStorage.getItem(this.STORAGE_KEY); } catch (_) { return false; }
        if (!raw) return false;

        let data;
        try { data = JSON.parse(raw); } catch (_) { return false; }

        const validArchetypes = new Set(this.archetypesOrdered);
        const restoredSet = new Set(
            Array.isArray(data.includedArchetypes)
                ? data.includedArchetypes.filter(a => validArchetypes.has(a))
                : this.archetypesOrdered
        );
        const gender = (['both', 'girls', 'boys'].includes(data.gender)) ? data.gender : 'both';
        const sortBy = (['rolelist', 'alpha'].includes(data.sortBy)) ? data.sortBy : 'rolelist';

        this.state.includedArchetypes = restoredSet;
        this.state.gender = gender;
        this.state.sortBy = sortBy;

        document.querySelectorAll('#archetypeMenu input.arch').forEach(cb => {
            cb.checked = restoredSet.has(cb.dataset.arch);
        });
        this.updateArchetypeCountChip();

        document.getElementById('gender-both').checked = gender === 'both';
        document.getElementById('gender-girls').checked = gender === 'girls';
        document.getElementById('gender-boys').checked = gender === 'boys';
        document.getElementById('sortBy').value = sortBy;

        return true;
    }

    renderRoles() {
        let list = this.roles.filter(r =>
            this.state.includedArchetypes.has(r.archetype) && this.passGenderFilter(r)
        );

        if (this.state.sortBy === 'alpha') {
            const clean = s => s.replace(/<br>/g, ' ').toLowerCase();
            list = list.slice().sort((a, b) => clean(a.name).localeCompare(clean(b.name)));
        } else {
            list = list.slice().sort((a, b) => a.__idx - b.__idx);
        }

        this.gridElement.innerHTML = '';
        list.forEach(role => this.gridElement.appendChild(this.createRoleCard(role)));
        this.updateStatus(list.length);
    }

    createRoleCard(role) {
        const card = document.createElement('div');
        card.className = 'role-card';
        card.dataset.roleId = role.id;
        const alignment = role.archetype.split(' ')[0].toLowerCase();
        card.innerHTML = `
          <div class="card-inner">
            <div class="card-front">
              <h2 class="role-name">${role.name}</h2>
              <img src=".${role.image}" alt="${role.name}" class="role-image">
              <span class="role-archetype archetype-${alignment}">${alignment}</span>
            </div>
            <div class="card-back">
              <h2 class="role-name-back"><a href="roles?id=${role.id}">${role.name}</a></h2>
              <h2 class="alignment-title">Alignment: ${role.archetype}</h2>
              <ul class="abilities-list">
                ${role.abilities.map(a => `<li>${a}</li>`).join('')}
              </ul>
              <h2 class="win-condition">Win Condition: ${role.wincon}</h2>
            </div>
          </div>`;
        card.addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('flipped');
        });
        return card;
    }

    setupGridSizing() {
        const ideal = 280;
        const calc = () => {
            const w = this.gridElement.getBoundingClientRect().width || this.gridElement.clientWidth || 0;
            const cols = Math.max(1, Math.floor(w / ideal));
            this.gridElement.style.setProperty('--cols', cols);
        };
        new ResizeObserver(calc).observe(this.gridElement);
        window.addEventListener('orientationchange', calc);
        calc();
    }

}

document.addEventListener('DOMContentLoaded', () => new RoleShowcase());