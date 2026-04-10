// Cheat / Mod Menu
// Open: press M twice within 500ms
// Close: click the X button in the top-right corner

class CheatMenu {
    constructor(game) {
        this.game = game;
        this.lastMPress = 0;
        this.panel = document.getElementById('cheat-menu');
        this.closeBtn = document.getElementById('cheat-menu-close');

        this._bindKeys();
        this._bindButtons();
    }

    // ── hotkey ──────────────────────────────────────────────
    _bindKeys() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() !== 'm') return;
            // Ignore if focus is on an input / textarea
            if (document.activeElement && ['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;

            const now = Date.now();
            if (now - this.lastMPress < 500) {
                this.toggle();
                this.lastMPress = 0;
            } else {
                this.lastMPress = now;
            }
        });
    }

    // ── open / close ─────────────────────────────────────────
    toggle() {
        if (this.panel.classList.contains('hidden')) {
            this.open();
        } else {
            this.close();
        }
    }

    open() {
        this._refreshState();
        this.panel.classList.remove('hidden');
    }

    close() {
        this.panel.classList.add('hidden');
    }

    // ── button wiring ─────────────────────────────────────────
    _bindButtons() {
        this.closeBtn.addEventListener('click', () => this.close());

        // Refill Oxygen
        document.getElementById('cheat-refill-o2').addEventListener('click', () => {
            this.game.state.oxygen = 100;
            this.game.ui.update();
            this._notify('O2 refilled to 100%');
        });

        // Skip to 6AM (win current night)
        document.getElementById('cheat-skip-night').addEventListener('click', () => {
            if (this.game.state.isGameRunning) {
                this._notify('Skipping night...');
                setTimeout(() => this.game.winNight(), 300);
                this.close();
            } else {
                this._notify('Start a night first');
            }
        });

        // Advance time +1 hour
        document.getElementById('cheat-advance-time').addEventListener('click', () => {
            if (this.game.state.isGameRunning) {
                this.game.state.currentTime = Math.min(this.game.state.currentTime + 1, 6);
                this.game.ui.update();
                const hours = ['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
                this._notify('Time → ' + (hours[this.game.state.currentTime] || '6 AM'));
                if (this.game.state.currentTime >= 6) {
                    setTimeout(() => this.game.winNight(), 300);
                    this.close();
                }
            } else {
                this._notify('Start a night first');
            }
        });

        // Freeze enemies toggle
        document.getElementById('cheat-freeze-enemies').addEventListener('click', () => {
            const ai = this.game.enemyAI;
            if (!ai) return;
            ai._cheatFrozen = !ai._cheatFrozen;

            // Patch / restore the move-check on all timers by clamping aiLevel
            if (ai._cheatFrozen) {
                ai._savedEpsteinAI    = ai.epstein  && ai.epstein.aiLevel;
                ai._savedTrumpAI      = ai.trump    && ai.trump.aiLevel;
                ai._savedHawkingAI    = ai.hawking  && ai.hawking.aiLevel;
                if (ai.epstein)  ai.epstein.aiLevel  = 0;
                if (ai.trump)    ai.trump.aiLevel    = 0;
                if (ai.hawking)  ai.hawking.aiLevel  = 0;
                document.getElementById('cheat-freeze-enemies').textContent = 'UNFREEZE ENEMIES';
                this._notify('Enemies frozen');
            } else {
                if (ai.epstein  && ai._savedEpsteinAI  != null) ai.epstein.aiLevel  = ai._savedEpsteinAI;
                if (ai.trump    && ai._savedTrumpAI    != null) ai.trump.aiLevel    = ai._savedTrumpAI;
                if (ai.hawking  && ai._savedHawkingAI  != null) ai.hawking.aiLevel  = ai._savedHawkingAI;
                document.getElementById('cheat-freeze-enemies').textContent = 'FREEZE ENEMIES';
                this._notify('Enemies unfrozen');
            }
        });

        // Unlock Special Night
        document.getElementById('cheat-unlock-special').addEventListener('click', () => {
            localStorage.setItem('night6Unlocked', 'true');
            this.game.updateContinueButton();
            this._notify('Special Night unlocked!');
        });

        // Unlock Custom Night
        document.getElementById('cheat-unlock-custom').addEventListener('click', () => {
            localStorage.setItem('night6Completed', 'true');
            this.game.updateContinueButton();
            this._notify('Custom Night unlocked!');
        });

        // Jump to night (select)
        document.getElementById('cheat-jump-night-btn').addEventListener('click', () => {
            const select = document.getElementById('cheat-night-select');
            const night = parseInt(select.value);
            if (this.game.state.isGameRunning) {
                this._notify('Return to menu first');
                return;
            }
            this.game.state.currentNight = night;
            if (night === 6) {
                localStorage.setItem('night6Unlocked', 'true');
                this._notify('Starting Special Night...');
                setTimeout(() => {
                    this.game.mainMenu.classList.add('hidden');
                    this.game.startSpecialNight();
                }, 400);
            } else {
                this._notify('Starting Night ' + night + '...');
                setTimeout(() => {
                    this.game.mainMenu.classList.add('hidden');
                    const menuMusic = document.getElementById('menu-music');
                    if (menuMusic) { menuMusic.pause(); menuMusic.currentTime = 0; }
                    this.game.initGame();
                }, 400);
            }
            this.close();
        });

        // Infinite Oxygen toggle
        document.getElementById('cheat-infinite-o2').addEventListener('click', () => {
            this.game._cheatInfiniteO2 = !this.game._cheatInfiniteO2;
            const btn = document.getElementById('cheat-infinite-o2');
            if (this.game._cheatInfiniteO2) {
                btn.textContent = 'INFINITE O₂: ON';
                btn.classList.add('cheat-active');
                this._patchInfiniteO2();
                this._notify('Infinite O₂ ON');
            } else {
                btn.textContent = 'INFINITE O₂: OFF';
                btn.classList.remove('cheat-active');
                this._notify('Infinite O₂ OFF');
            }
        });
    }

    // ── infinite O2 patch ────────────────────────────────────
    _patchInfiniteO2() {
        // Poll every second while the flag is on; keep O2 full
        const id = setInterval(() => {
            if (!this.game._cheatInfiniteO2) { clearInterval(id); return; }
            if (this.game.state.isGameRunning) {
                this.game.state.oxygen = 100;
                this.game.ui.update();
            }
        }, 500);
    }

    // ── sync live state to UI labels ─────────────────────────
    _refreshState() {
        const s = this.game.state;
        const hours = ['12 AM','1 AM','2 AM','3 AM','4 AM','5 AM','6 AM'];
        document.getElementById('cheat-info-night').textContent = s.isGameRunning ? 'Night ' + s.currentNight : '—';
        document.getElementById('cheat-info-time').textContent  = s.isGameRunning ? (hours[s.currentTime] || '6 AM') : '—';
        document.getElementById('cheat-info-o2').textContent    = s.isGameRunning ? s.oxygen + '%' : '—';

        // Sync freeze button label
        const ai = this.game.enemyAI;
        const frozen = ai && ai._cheatFrozen;
        const freezeBtn = document.getElementById('cheat-freeze-enemies');
        freezeBtn.textContent = frozen ? 'UNFREEZE ENEMIES' : 'FREEZE ENEMIES';
        if (frozen) freezeBtn.classList.add('cheat-active');
        else        freezeBtn.classList.remove('cheat-active');

        // Sync infinite O2 button label
        const infBtn = document.getElementById('cheat-infinite-o2');
        if (this.game._cheatInfiniteO2) {
            infBtn.textContent = 'INFINITE O₂: ON';
            infBtn.classList.add('cheat-active');
        } else {
            infBtn.textContent = 'INFINITE O₂: OFF';
            infBtn.classList.remove('cheat-active');
        }
    }

    // ── toast notification ───────────────────────────────────
    _notify(msg) {
        const el = document.createElement('div');
        el.className = 'cheat-toast';
        el.textContent = '⚡ ' + msg;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 1600);
    }
}
