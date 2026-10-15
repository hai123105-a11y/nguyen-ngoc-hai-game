/**
 * ==============================================================================
 * SHADOW DEFENDER - ARCADE CANVAS WEB GAME ENGINE
 * Developed by Nguyễn Ngọc Hải
 * HTML5 Canvas 2D, Pure Web Audio API Sound Synthesizer, 60 FPS Vector Physics
 * ==============================================================================
 */

(function () {
    'use strict';

    // --------------------------------------------------------------------------
    // 1. Web Audio Synthesizer (8-Bit Retro Sound Engine - Zero External Files)
    // --------------------------------------------------------------------------
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.muted = false;
        }

        init() {
            if (!this.ctx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playLaser() {
            if (this.muted || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const t = this.ctx.currentTime;

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, t);
                osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.12);
            } catch (e) {}
        }

        playExplosion(isLarge = false) {
            if (this.muted || !this.ctx) return;
            try {
                const dur = isLarge ? 0.45 : 0.22;
                const bufferSize = this.ctx.sampleRate * dur;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(isLarge ? 400 : 800, this.ctx.currentTime);
                filter.frequency.linearRampToValueAtTime(50, this.ctx.currentTime + dur);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(isLarge ? 0.35 : 0.2, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                noise.start(this.ctx.currentTime);
            } catch (e) {}
        }

        playPowerup() {
            if (this.muted || !this.ctx) return;
            try {
                const notes = [330, 440, 554, 659];
                const t = this.ctx.currentTime;
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const start = t + idx * 0.05;

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, start);

                    gain.gain.setValueAtTime(0.15, start);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.15);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(start);
                    osc.stop(start + 0.15);
                });
            } catch (e) {}
        }

        playBomb() {
            if (this.muted || !this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, t);
                osc.frequency.exponentialRampToValueAtTime(30, t + 0.6);

                gain.gain.setValueAtTime(0.4, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.6);
            } catch (e) {}
        }

        playGameOver() {
            if (this.muted || !this.ctx) return;
            try {
                const t = this.ctx.currentTime;
                const freqs = [350, 311, 277, 220];
                freqs.forEach((freq, i) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const start = t + i * 0.14;

                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, start);

                    gain.gain.setValueAtTime(0.2, start);
                    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);

                    osc.connect(gain);
                    gain.connect(this.ctx.destination);

                    osc.start(start);
                    osc.stop(start + 0.2);
                });
            } catch (e) {}
        }
    }

    const audio = new SoundEngine();

    // --------------------------------------------------------------------------
    // 2. Game Entities & State
    // --------------------------------------------------------------------------
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    const STATE = {
        START: 'start',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAMEOVER: 'gameover'
    };

    let gameState = STATE.START;
    let score = 0;
    let bestScore = parseInt(localStorage.getItem('shadow_best_score') || '0', 10);
    let wave = 1;
    let combo = 1;
    let comboTimer = 0;
    let bombs = 3;
    let timeSlowTimer = 0;

    // Keys state
    const keys = {
        left: false,
        right: false,
        up: false,
        down: false,
        shoot: false
    };

    // Touch control state
    const touch = {
        active: false,
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0
    };

    // Responsive Canvas Resizing
    function resizeCanvas() {
        const viewport = document.getElementById('canvasViewport');
        if (!viewport) return;
        const rect = viewport.getBoundingClientRect();
        canvas.width = Math.round(rect.width);
        canvas.height = Math.round(rect.height);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        if (player) {
            player.x = Math.min(player.x, canvas.width - 30);
            player.y = Math.min(player.y, canvas.height - 30);
        }
    });

    // Color theme helper
    function getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
        return {
            isDark: isDark,
            bg: isDark ? '#000000' : '#ffffff',
            fg: isDark ? '#ffffff' : '#000000',
            fgMuted: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
            fgAccent: isDark ? '#ffffff' : '#000000',
            enemyColor: isDark ? '#ffffff' : '#000000',
            bulletColor: isDark ? '#ffffff' : '#000000',
            shieldColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
        };
    }

    // --------------------------------------------------------------------------
    // 3. Player Ship
    // --------------------------------------------------------------------------
    class PlayerShip {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = canvas.width / 2;
            this.y = canvas.height - 90;
            this.vx = 0;
            this.vy = 0;
            this.speed = 7;
            this.size = 22;
            this.lives = 3;
            this.shield = false;
            this.tripleShot = 0;
            this.shootCooldown = 0;
            this.invincibleTimer = 0;
        }

        update() {
            // Touch navigation
            if (touch.active) {
                const dx = touch.targetX - this.x;
                const dy = touch.targetY - this.y;
                this.x += dx * 0.22;
                this.y += dy * 0.22;
            } else {
                // Keyboard navigation
                if (keys.left) this.vx = -this.speed;
                else if (keys.right) this.vx = this.speed;
                else this.vx *= 0.8;

                if (keys.up) this.vy = -this.speed;
                else if (keys.down) this.vy = this.speed;
                else this.vy *= 0.8;

                this.x += this.vx;
                this.y += this.vy;
            }

            // Screen boundaries
            this.x = Math.max(this.size + 10, Math.min(canvas.width - this.size - 10, this.x));
            this.y = Math.max(this.size + 40, Math.min(canvas.height - this.size - 20, this.y));

            // Thruster particles
            if (Math.random() < 0.6) {
                particles.push(new Particle(
                    this.x + (Math.random() * 8 - 4),
                    this.y + this.size + 2,
                    (Math.random() - 0.5) * 1.5,
                    Math.random() * 3 + 2,
                    2,
                    0.4
                ));
            }

            // Timers
            if (this.shootCooldown > 0) this.shootCooldown--;
            if (this.tripleShot > 0) this.tripleShot--;
            if (this.invincibleTimer > 0) this.invincibleTimer--;

            // Shooting logic
            if (keys.shoot || (touch.active && gameState === STATE.PLAYING)) {
                this.shoot();
            }
        }

        shoot() {
            if (this.shootCooldown <= 0) {
                audio.playLaser();

                if (this.tripleShot > 0) {
                    bullets.push(new Bullet(this.x, this.y - 10, 0, -12, true));
                    bullets.push(new Bullet(this.x - 8, this.y - 8, -2.5, -11, true));
                    bullets.push(new Bullet(this.x + 8, this.y - 8, 2.5, -11, true));
                } else {
                    bullets.push(new Bullet(this.x - 6, this.y - 10, 0, -12, true));
                    bullets.push(new Bullet(this.x + 6, this.y - 10, 0, -12, true));
                }

                this.shootCooldown = 9; // rate of fire
            }
        }

        draw(c) {
            const colors = getThemeColors();

            // Invincibility flicker
            if (this.invincibleTimer > 0 && Math.floor(Date.now() / 70) % 2 === 0) {
                return;
            }

            c.save();
            c.translate(this.x, this.y);

            // Ship Body (Minimalist Wireframe Vector)
            c.strokeStyle = colors.fg;
            c.lineWidth = 2.2;
            c.lineCap = 'round';
            c.lineJoin = 'round';

            c.beginPath();
            // Main Nose
            c.moveTo(0, -this.size);
            // Right Wing
            c.lineTo(this.size * 0.9, this.size * 0.85);
            // Right Wing Inner
            c.lineTo(this.size * 0.4, this.size * 0.55);
            // Center Engine Notch
            c.lineTo(0, this.size * 0.75);
            // Left Wing Inner
            c.lineTo(-this.size * 0.4, this.size * 0.55);
            // Left Wing
            c.lineTo(-this.size * 0.9, this.size * 0.85);
            c.closePath();
            c.stroke();

            // Cockpit Diamond
            c.beginPath();
            c.moveTo(0, -this.size * 0.4);
            c.lineTo(this.size * 0.25, 0);
            c.lineTo(0, this.size * 0.25);
            c.lineTo(-this.size * 0.25, 0);
            c.closePath();
            c.stroke();

            // Shield Bubble
            if (this.shield) {
                c.strokeStyle = colors.shieldColor;
                c.lineWidth = 2;
                c.setLineDash([4, 4]);
                c.beginPath();
                c.arc(0, 0, this.size * 1.5, 0, Math.PI * 2);
                c.stroke();
                c.setLineDash([]);
            }

            c.restore();
        }

        hit() {
            if (this.invincibleTimer > 0) return false;

            if (this.shield) {
                this.shield = false;
                this.invincibleTimer = 40;
                audio.playExplosion(false);
                createSparks(this.x, this.y, 16);
                showToast('Khiên đã vỡ!');
                return false;
            }

            this.lives--;
            updateHeartsUI(this.lives);
            this.invincibleTimer = 90;
            audio.playExplosion(true);
            createSparks(this.x, this.y, 30);

            if (this.lives <= 0) {
                triggerGameOver();
                return true;
            }
            return false;
        }
    }

    // --------------------------------------------------------------------------
    // 4. Bullets & Particle System
    // --------------------------------------------------------------------------
    class Bullet {
        constructor(x, y, vx, vy, isPlayer = true) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.isPlayer = isPlayer;
            this.radius = isPlayer ? 3 : 3.5;
            this.alive = true;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            if (this.y < -20 || this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) {
                this.alive = false;
            }
        }

        draw(c) {
            const colors = getThemeColors();
            c.save();
            c.strokeStyle = this.isPlayer ? colors.bulletColor : colors.fg;
            c.fillStyle = this.isPlayer ? colors.bulletColor : 'transparent';
            c.lineWidth = 1.8;

            if (this.isPlayer) {
                // Laser beam pill
                c.beginPath();
                c.moveTo(this.x, this.y);
                c.lineTo(this.x, this.y + 10);
                c.stroke();
            } else {
                // Enemy round projectile
                c.beginPath();
                c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                c.stroke();
            }
            c.restore();
        }
    }

    class Particle {
        constructor(x, y, vx, vy, size, decay = 0.02) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.alpha = 1;
            this.decay = decay;
            this.alive = true;
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.alpha -= this.decay;
            if (this.alpha <= 0) this.alive = false;
        }

        draw(c) {
            const colors = getThemeColors();
            c.save();
            c.globalAlpha = Math.max(0, this.alpha);
            c.fillStyle = colors.fg;
            c.fillRect(this.x, this.y, this.size, this.size);
            c.restore();
        }
    }

    class Star {
        constructor() {
            this.reset(true);
        }

        reset(randomY = false) {
            this.x = Math.random() * (canvas.width || 800);
            this.y = randomY ? Math.random() * (canvas.height || 600) : 0;
            this.speed = Math.random() * 2.2 + 0.8;
            this.size = Math.random() > 0.8 ? 2 : 1;
        }

        update() {
            this.y += this.speed * (timeSlowTimer > 0 ? 0.35 : 1);
            if (this.y > canvas.height) {
                this.reset(false);
            }
        }

        draw(c) {
            const colors = getThemeColors();
            c.fillStyle = colors.fgMuted;
            c.fillRect(this.x, this.y, this.size, this.size);
        }
    }

    // --------------------------------------------------------------------------
    // 5. Enemies & Power-Ups
    // --------------------------------------------------------------------------
    const ENEMY_TYPE = {
        SCOUT: 'scout',
        INTERCEPTOR: 'interceptor',
        ASTEROID: 'asteroid',
        BOSS: 'boss'
    };

    class Enemy {
        constructor(type, x, y) {
            this.type = type;
            this.x = x || Math.random() * (canvas.width - 80) + 40;
            this.y = y || -40;
            this.alive = true;
            this.rot = 0;
            this.rotSpeed = (Math.random() - 0.5) * 0.05;

            if (type === ENEMY_TYPE.SCOUT) {
                this.hp = 1;
                this.size = 16;
                this.speed = Math.random() * 1.5 + 2.8;
                this.scoreVal = 100;
            } else if (type === ENEMY_TYPE.INTERCEPTOR) {
                this.hp = 2;
                this.size = 20;
                this.speed = Math.random() * 1 + 2.2;
                this.scoreVal = 180;
                this.shootCooldown = Math.floor(Math.random() * 60) + 70;
            } else if (type === ENEMY_TYPE.ASTEROID) {
                this.hp = 4;
                this.size = 28;
                this.speed = Math.random() * 0.8 + 1.2;
                this.scoreVal = 250;
            } else if (type === ENEMY_TYPE.BOSS) {
                this.hp = 25 + wave * 5;
                this.maxHp = this.hp;
                this.size = 54;
                this.speed = 0.8;
                this.scoreVal = 1500;
                this.shootCooldown = 40;
            }
        }

        update() {
            const speedMod = timeSlowTimer > 0 ? 0.35 : 1;
            this.rot += this.rotSpeed * speedMod;

            if (this.type === ENEMY_TYPE.SCOUT) {
                this.y += this.speed * speedMod;
            } else if (this.type === ENEMY_TYPE.INTERCEPTOR) {
                this.y += this.speed * speedMod;
                // Slight tracking
                if (player) {
                    const dx = player.x - this.x;
                    this.x += Math.sign(dx) * 0.8 * speedMod;
                }
                // Enemy firing
                this.shootCooldown--;
                if (this.shootCooldown <= 0 && this.y > 40 && this.y < canvas.height - 100) {
                    bullets.push(new Bullet(this.x, this.y + this.size, 0, 4.5 * speedMod, false));
                    this.shootCooldown = 90;
                }
            } else if (this.type === ENEMY_TYPE.ASTEROID) {
                this.y += this.speed * speedMod;
            } else if (this.type === ENEMY_TYPE.BOSS) {
                // Hover near top
                if (this.y < 110) {
                    this.y += this.speed * speedMod;
                } else {
                    this.x += Math.sin(Date.now() / 800) * 1.5 * speedMod;
                }

                this.shootCooldown--;
                if (this.shootCooldown <= 0) {
                    bullets.push(new Bullet(this.x - 24, this.y + 20, -1.5, 4.5 * speedMod, false));
                    bullets.push(new Bullet(this.x, this.y + 25, 0, 4.5 * speedMod, false));
                    bullets.push(new Bullet(this.x + 24, this.y + 20, 1.5, 4.5 * speedMod, false));
                    this.shootCooldown = 45;
                }
            }

            if (this.y > canvas.height + 50) {
                this.alive = false;
            }
        }

        draw(c) {
            const colors = getThemeColors();
            c.save();
            c.translate(this.x, this.y);
            c.rotate(this.rot);
            c.strokeStyle = colors.enemyColor;
            c.lineWidth = 2;
            c.lineJoin = 'round';

            if (this.type === ENEMY_TYPE.SCOUT) {
                // Downward triangle
                c.beginPath();
                c.moveTo(0, this.size);
                c.lineTo(this.size * 0.8, -this.size * 0.8);
                c.lineTo(-this.size * 0.8, -this.size * 0.8);
                c.closePath();
                c.stroke();
            } else if (this.type === ENEMY_TYPE.INTERCEPTOR) {
                // Geometric chevron
                c.beginPath();
                c.moveTo(0, this.size);
                c.lineTo(this.size, -this.size * 0.6);
                c.lineTo(0, 0);
                c.lineTo(-this.size, -this.size * 0.6);
                c.closePath();
                c.stroke();
            } else if (this.type === ENEMY_TYPE.ASTEROID) {
                // Rotating Hexagon
                c.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i * Math.PI) / 3;
                    const hx = Math.cos(angle) * this.size;
                    const hy = Math.sin(angle) * this.size;
                    if (i === 0) c.moveTo(hx, hy);
                    else c.lineTo(hx, hy);
                }
                c.closePath();
                c.stroke();
            } else if (this.type === ENEMY_TYPE.BOSS) {
                // Massive mothership
                c.beginPath();
                c.moveTo(0, this.size);
                c.lineTo(this.size * 1.1, 0);
                c.lineTo(this.size * 0.8, -this.size * 0.8);
                c.lineTo(-this.size * 0.8, -this.size * 0.8);
                c.lineTo(-this.size * 1.1, 0);
                c.closePath();
                c.stroke();

                // Core
                c.beginPath();
                c.arc(0, 0, 14, 0, Math.PI * 2);
                c.stroke();

                // Boss Health bar
                c.restore();
                c.save();
                c.strokeStyle = colors.fg;
                c.lineWidth = 1;
                c.strokeRect(this.x - 40, this.y - this.size - 18, 80, 5);
                c.fillStyle = colors.fg;
                c.fillRect(this.x - 40, this.y - this.size - 18, Math.max(0, (this.hp / this.maxHp) * 80), 5);
                c.restore();
                return;
            }

            c.restore();
        }

        takeHit(dmg = 1) {
            this.hp -= dmg;
            if (this.hp <= 0) {
                this.alive = false;
                audio.playExplosion(this.type === ENEMY_TYPE.BOSS);
                createSparks(this.x, this.y, this.type === ENEMY_TYPE.BOSS ? 40 : 16);
                addScore(this.scoreVal);

                // Powerup drop chance
                if (Math.random() < 0.28 || this.type === ENEMY_TYPE.BOSS) {
                    spawnPowerUp(this.x, this.y);
                }
                return true;
            }
            return false;
        }
    }

    class PowerUp {
        constructor(x, y, kind) {
            this.x = x;
            this.y = y;
            this.kind = kind; // 'triple', 'shield', 'bomb', 'slow'
            this.size = 14;
            this.alive = true;
            this.speed = 1.8;
            this.floatPhase = Math.random() * Math.PI;
        }

        update() {
            this.y += this.speed;
            this.floatPhase += 0.05;
            if (this.y > canvas.height + 30) this.alive = false;
        }

        draw(c) {
            const colors = getThemeColors();
            c.save();
            c.translate(this.x, this.y + Math.sin(this.floatPhase) * 3);

            // Diamond container
            c.strokeStyle = colors.fg;
            c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(0, -this.size);
            c.lineTo(this.size, 0);
            c.lineTo(0, this.size);
            c.lineTo(-this.size, 0);
            c.closePath();
            c.stroke();

            // Icon letter
            c.fillStyle = colors.fg;
            c.font = 'bold 11px sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            let label = '⚡';
            if (this.kind === 'shield') label = '🛡';
            if (this.kind === 'bomb') label = '💣';
            if (this.kind === 'slow') label = '⏳';
            c.fillText(label, 0, 1);

            c.restore();
        }

        apply(p) {
            audio.playPowerup();
            createSparks(this.x, this.y, 18);
            if (this.kind === 'triple') {
                p.tripleShot = 400; // ~6.6 seconds
                showToast('⚡ Nhặt Đạn Ba Tia (Triple Shot)!');
            } else if (this.kind === 'shield') {
                p.shield = true;
                showToast('🛡 Nhặt Khiên Năng Lượng (Shield)!');
            } else if (this.kind === 'bomb') {
                bombs = Math.min(5, bombs + 1);
                updateBombsUI();
                showToast('💣 Thêm 1 Bom EMP!');
            } else if (this.kind === 'slow') {
                timeSlowTimer = 300; // 5s
                showToast('⏳ Làm Chậm Thời Gian (Time Slow)!');
            }
        }
    }

    function spawnPowerUp(x, y) {
        const kinds = ['triple', 'shield', 'bomb', 'slow'];
        const chosen = kinds[Math.floor(Math.random() * kinds.length)];
        powerups.push(new PowerUp(x, y, chosen));
    }

    function createSparks(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1.5;
            particles.push(new Particle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() * 2.5 + 1.5,
                Math.random() * 0.03 + 0.02
            ));
        }
    }

    // --------------------------------------------------------------------------
    // 6. Game Loop & Global State Collections
    // --------------------------------------------------------------------------
    let player = null;
    let bullets = [];
    let enemies = [];
    let particles = [];
    let powerups = [];
    let stars = [];
    let enemySpawnCounter = 0;
    let bossSpawnedThisWave = false;

    function initGame() {
        resizeCanvas();
        stars = [];
        for (let i = 0; i < 45; i++) {
            stars.push(new Star());
        }
        player = new PlayerShip();
        updateBestScoreUI();
    }

    function startGame() {
        audio.init();
        gameState = STATE.PLAYING;
        score = 0;
        wave = 1;
        combo = 1;
        comboTimer = 0;
        bombs = 3;
        timeSlowTimer = 0;

        bullets = [];
        enemies = [];
        particles = [];
        powerups = [];
        enemySpawnCounter = 0;
        bossSpawnedThisWave = false;

        player.reset();
        updateScoreUI();
        updateHeartsUI(player.lives);
        updateBombsUI();

        document.getElementById('startOverlay').classList.add('hidden');
        document.getElementById('pauseOverlay').classList.add('hidden');
        document.getElementById('gameOverOverlay').classList.add('hidden');
    }

    function triggerGameOver() {
        gameState = STATE.GAMEOVER;
        audio.playGameOver();

        if (score > bestScore) {
            bestScore = score;
            localStorage.setItem('shadow_best_score', bestScore.toString());
            updateBestScoreUI();
        }

        document.getElementById('finalScore').textContent = score.toLocaleString();
        document.getElementById('finalBest').textContent = bestScore.toLocaleString();
        document.getElementById('finalWave').textContent = wave.toString();
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }

    function togglePause() {
        if (gameState === STATE.PLAYING) {
            gameState = STATE.PAUSED;
            document.getElementById('pauseOverlay').classList.remove('hidden');
        } else if (gameState === STATE.PAUSED) {
            gameState = STATE.PLAYING;
            document.getElementById('pauseOverlay').classList.add('hidden');
        }
    }

    function triggerBomb() {
        if (gameState !== STATE.PLAYING || bombs <= 0) return;
        bombs--;
        updateBombsUI();
        audio.playBomb();

        // Flash screen white/black
        createSparks(canvas.width / 2, canvas.height / 2, 60);

        // Clear all bullets and hurt all enemies
        bullets = bullets.filter(b => b.isPlayer);
        enemies.forEach(e => {
            e.takeHit(10);
        });
        showToast('💥 Kích nổ EMP Bomb thành công!');
    }

    function addScore(base) {
        comboTimer = 140; // ~2.3 seconds
        combo = Math.min(5, combo + 1);
        score += base * combo;
        updateScoreUI();

        // Wave progression
        if (score >= wave * 1200) {
            wave++;
            bossSpawnedThisWave = false;
            showToast(`🚀 Đợt Sóng Mới: ĐỢT ${wave}!`);
            document.getElementById('hudWave').textContent = wave.toString();
        }
    }

    // --------------------------------------------------------------------------
    // 7. Update & Render (60 FPS)
    // --------------------------------------------------------------------------
    function update() {
        if (gameState !== STATE.PLAYING) return;

        // Background stars
        stars.forEach(s => s.update());

        // Player
        player.update();

        // Combo decay
        if (comboTimer > 0) {
            comboTimer--;
            if (comboTimer <= 0) combo = 1;
        }
        document.getElementById('hudCombo').textContent = `x${combo}`;

        if (timeSlowTimer > 0) timeSlowTimer--;

        // Bullets
        bullets.forEach(b => b.update());
        bullets = bullets.filter(b => b.alive);

        // Power-ups
        powerups.forEach(p => {
            p.update();
            // Pickup collision
            const dist = Math.hypot(p.x - player.x, p.y - player.y);
            if (dist < player.size + p.size) {
                p.alive = false;
                p.apply(player);
            }
        });
        powerups = powerups.filter(p => p.alive);

        // Enemies
        enemies.forEach(e => e.update());
        enemies = enemies.filter(e => e.alive);

        // Particles
        particles.forEach(pt => pt.update());
        particles = particles.filter(pt => pt.alive);

        // Bullet vs Enemy Collision
        bullets.forEach(b => {
            if (!b.isPlayer || !b.alive) return;
            enemies.forEach(e => {
                if (!e.alive || !b.alive) return;
                const d = Math.hypot(b.x - e.x, b.y - e.y);
                if (d < b.radius + e.size) {
                    b.alive = false;
                    e.takeHit(1);
                    createSparks(b.x, b.y, 4);
                }
            });
        });

        // Enemy Bullet vs Player Collision
        bullets.forEach(b => {
            if (b.isPlayer || !b.alive) return;
            const d = Math.hypot(b.x - player.x, b.y - player.y);
            if (d < b.radius + player.size * 0.8) {
                b.alive = false;
                player.hit();
            }
        });

        // Player vs Enemy Collision
        enemies.forEach(e => {
            if (!e.alive) return;
            const d = Math.hypot(player.x - e.x, player.y - e.y);
            if (d < player.size + e.size * 0.8) {
                e.takeHit(3);
                player.hit();
            }
        });

        // Spawn logic
        enemySpawnCounter++;
        const spawnInterval = Math.max(35, 80 - wave * 6);

        // Boss spawn at threshold
        if (wave >= 2 && !bossSpawnedThisWave && score >= wave * 1000) {
            enemies.push(new Enemy(ENEMY_TYPE.BOSS, canvas.width / 2, -60));
            bossSpawnedThisWave = true;
            showToast('⚠️ CẢNH BÁO: TRÙM CUỐI XUẤT HIỆN!');
        }

        if (enemySpawnCounter >= spawnInterval) {
            enemySpawnCounter = 0;
            const roll = Math.random();
            if (roll < 0.5) {
                enemies.push(new Enemy(ENEMY_TYPE.SCOUT));
            } else if (roll < 0.85) {
                enemies.push(new Enemy(ENEMY_TYPE.INTERCEPTOR));
            } else {
                enemies.push(new Enemy(ENEMY_TYPE.ASTEROID));
            }
        }
    }

    function render() {
        const colors = getThemeColors();

        // Clear canvas
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Background stars
        stars.forEach(s => s.draw(ctx));

        // Game objects
        powerups.forEach(p => p.draw(ctx));
        bullets.forEach(b => b.draw(ctx));
        enemies.forEach(e => e.draw(ctx));
        particles.forEach(pt => pt.draw(ctx));

        if (player) {
            player.draw(ctx);
        }

        // Time slow border effect
        if (timeSlowTimer > 0) {
            ctx.save();
            ctx.strokeStyle = colors.fg;
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 8]);
            ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
            ctx.restore();
        }
    }

    function loop() {
        update();
        render();
        requestAnimationFrame(loop);
    }

    // --------------------------------------------------------------------------
    // 8. HUD & UI Helpers
    // --------------------------------------------------------------------------
    function updateScoreUI() {
        document.getElementById('hudScore').textContent = score.toLocaleString();
    }

    function updateBestScoreUI() {
        document.getElementById('hudBest').textContent = bestScore.toLocaleString();
    }

    function updateHeartsUI(lives) {
        const heartsContainer = document.getElementById('hudHearts');
        if (!heartsContainer) return;
        heartsContainer.innerHTML = '';
        for (let i = 0; i < 3; i++) {
            const heart = document.createElement('i');
            heart.className = `fa-solid fa-heart ${i >= lives ? 'lost' : ''}`;
            heartsContainer.appendChild(heart);
        }
    }

    function updateBombsUI() {
        const bombLabel = document.getElementById('touchBombCount');
        if (bombLabel) {
            bombLabel.textContent = `EMP (${bombs})`;
        }
    }

    let toastTimer;
    function showToast(msg) {
        const toast = document.getElementById('toastNotification');
        const msgEl = document.getElementById('toastMessage');
        if (!toast || !msgEl) return;

        msgEl.textContent = msg;
        toast.classList.add('show');

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    // --------------------------------------------------------------------------
    // 9. Controls & Event Listeners
    // --------------------------------------------------------------------------
    function initEvents() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            audio.init();

            if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = true;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = true;
            if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = true;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = true;
            if (e.code === 'Space') {
                keys.shoot = true;
                e.preventDefault();
            }
            if (e.code === 'KeyB' || e.code === 'Enter') {
                triggerBomb();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                togglePause();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.left = false;
            if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.right = false;
            if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.up = false;
            if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.down = false;
            if (e.code === 'Space') keys.shoot = false;
        });

        // Mouse controls on canvas
        canvas.addEventListener('mousedown', (e) => {
            audio.init();
            if (gameState === STATE.PLAYING) {
                keys.shoot = true;
            }
        });

        window.addEventListener('mouseup', () => {
            keys.shoot = false;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (gameState === STATE.PLAYING && !touch.active) {
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                if (player) {
                    player.x = (mouseX / rect.width) * canvas.width;
                }
            }
        });

        // Touch drag controls on canvas (Optimized for Mobile)
        function handleTouch(e) {
            e.preventDefault();
            audio.init();
            if (gameState !== STATE.PLAYING) return;

            const t = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            touch.active = true;
            touch.targetX = ((t.clientX - rect.left) / rect.width) * canvas.width;
            // Place ship slightly above finger position so thumb doesn't cover ship
            touch.targetY = ((t.clientY - rect.top) / rect.height) * canvas.height - 35;
        }

        canvas.addEventListener('touchstart', handleTouch, { passive: false });
        canvas.addEventListener('touchmove', handleTouch, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                touch.active = false;
            }
        });

        // UI Buttons
        document.getElementById('btnStartGame').addEventListener('click', startGame);
        document.getElementById('btnResumeGame').addEventListener('click', togglePause);
        document.getElementById('btnRestartFromPause').addEventListener('click', startGame);
        document.getElementById('btnRestartGame').addEventListener('click', startGame);
        document.getElementById('btnPauseGame').addEventListener('click', togglePause);

        // Mobile on-screen action buttons
        const touchFireBtn = document.getElementById('touchFireBtn');
        if (touchFireBtn) {
            touchFireBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                keys.shoot = true;
            });
            touchFireBtn.addEventListener('touchend', () => {
                keys.shoot = false;
            });
        }

        const touchBombBtn = document.getElementById('touchBombBtn');
        if (touchBombBtn) {
            touchBombBtn.addEventListener('click', (e) => {
                e.preventDefault();
                triggerBomb();
            });
        }

        // Fullscreen toggle
        document.getElementById('btnFullscreen').addEventListener('click', () => {
            const wrapper = document.getElementById('gameWrapper');
            if (!document.fullscreenElement) {
                if (wrapper.requestFullscreen) wrapper.requestFullscreen();
                else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });

        // Sound toggle
        const soundBtn = document.getElementById('soundToggle');
        const soundIcon = document.getElementById('soundIcon');
        soundBtn.addEventListener('click', () => {
            audio.init();
            audio.muted = !audio.muted;
            soundBtn.classList.toggle('muted', audio.muted);
            soundIcon.className = audio.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            showToast(audio.muted ? '🔇 Đã tắt âm thanh game' : '🔊 Đã bật âm thanh game');
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        const themeMeta = document.getElementById('themeColorMeta');
        const savedTheme = localStorage.getItem('hai_theme') || 'dark';
        applyTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const target = current === 'dark' ? 'light' : 'dark';
            applyTheme(target);
            localStorage.setItem('hai_theme', target);
            showToast(target === 'dark' ? '🌙 Giao diện Tối' : '☀️ Giao diện Sáng');
        });

        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            if (themeMeta) {
                themeMeta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff');
            }
        }

        // Mobile drawer navigation
        const mobileBtn = document.getElementById('mobileMenuBtn');
        const navMenu = document.getElementById('navMenu');
        const navOverlay = document.getElementById('navOverlay');

        function toggleNav(open) {
            const shouldOpen = open !== undefined ? open : !navMenu.classList.contains('open');
            if (shouldOpen) {
                navMenu.classList.add('open');
                navOverlay.classList.add('active');
                mobileBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                document.body.style.overflow = 'hidden';
            } else {
                navMenu.classList.remove('open');
                navOverlay.classList.remove('active');
                mobileBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
                document.body.style.overflow = '';
            }
        }

        mobileBtn.addEventListener('click', () => toggleNav());
        navOverlay.addEventListener('click', () => toggleNav(false));
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => toggleNav(false));
        });

        // Copy CLI Command
        const copyCliBtn = document.getElementById('copyCliBtn');
        if (copyCliBtn) {
            copyCliBtn.addEventListener('click', () => {
                navigator.clipboard.writeText('python3 run.py').then(() => {
                    showToast('🚀 Đã copy lệnh: python3 run.py');
                });
            });
        }

        // Back to top button
        const backToTop = document.getElementById('backToTop');
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 320) backToTop.classList.add('visible');
            else backToTop.classList.remove('visible');
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --------------------------------------------------------------------------
    // 10. Bootstrap
    // --------------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', () => {
        initGame();
        initEvents();
        loop();
    });
})();
