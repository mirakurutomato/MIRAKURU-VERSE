import * as THREE from 'three';

const CONFIG = {
    colors: { bg: 0xe0f7fa, fog: 0xe0f7fa },
    avatarColors: [
        { main: 0x00bcd4 },
        { main: 0xff4081 },
        { main: 0x76ff03 },
        { main: 0xffab00 },
        { main: 0x651fff }
    ],
    movement: { speed: 0.16, rotSpeed: 0.03, verticalSpeed: 0.14 },
    camera: { distance: 8, height: 2.6, pitchMin: -0.6, pitchMax: 0.45, yawLimit: 1.0 },
    mention: { duration: 2400 },
    emotes: {
        wave: { icon: '👋', duration: 1200 },
        spin: { icon: '🌀', duration: 1000 },
        spark: { icon: '✨', duration: 900 },
        cheer: { icon: '🎵', duration: 1200 }
    }
};

const NAME_LIMIT = 12;
const MY_ID = 'user_' + Math.random().toString(36).substr(2, 9);
const MY_COLOR_IDX = Math.floor(Math.random() * CONFIG.avatarColors.length);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const normalizeName = (name) => name.trim().toLowerCase();
const lerpAngle = (start, end, alpha) => {
    let delta = end - start;
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;
    return start + delta * alpha;
};
const TAU = Math.PI * 2;
const randRange = (min, max) => min + Math.random() * (max - min);
const toNumber = (value, fallback) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

class MagicSystem {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.type = options.type || 'snow';
        this.count = Math.max(20, Math.floor(toNumber(options.count, 240)));
        this.color = options.color || '#ffffff';
        this.speed = Math.max(0.1, toNumber(options.speed, 0.8));
        this.size = Math.max(0.02, toNumber(options.size, 0.12));
        this.area = options.area || { x: 90, y: 50, z: 90 };
        this.time = 0;
        this.points = null;
        this.positions = null;
        this.velocities = null;
        this.life = null;
        this.build();
    }

    applyConfig(config = {}) {
        const nextType = config.type ?? this.type;
        const nextCount = Math.max(20, Math.floor(toNumber(config.count, this.count)));
        const nextColor = config.color ?? this.color;
        const nextSpeed = Math.max(0.1, toNumber(config.speed, this.speed));
        const nextSize = Math.max(0.02, toNumber(config.size, this.size));
        const needsRebuild = nextType !== this.type || nextCount !== this.count;
        this.type = nextType;
        this.count = nextCount;
        this.color = nextColor;
        this.speed = nextSpeed;
        this.size = nextSize;
        if (needsRebuild) {
            this.build();
        } else if (this.points) {
            this.points.material.color.set(this.color);
            this.points.material.size = this.size;
            this.points.material.needsUpdate = true;
        }
        return this.getStatus();
    }

    getStatus() {
        return {
            type: this.type,
            count: this.count,
            color: this.color,
            speed: this.speed,
            size: this.size
        };
    }

    build() {
        if (this.points) {
            this.scene.remove(this.points);
        }
        const geometry = new THREE.BufferGeometry();
        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.life = new Float32Array(this.count);
        for (let i = 0; i < this.count; i++) {
            this.resetParticle(i, true);
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
        const material = new THREE.PointsMaterial({
            color: new THREE.Color(this.color),
            size: this.size,
            transparent: true,
            opacity: this.type === 'fireworks' ? 0.9 : 0.8,
            depthWrite: false
        });
        this.points = new THREE.Points(geometry, material);
        this.points.frustumCulled = false;
        this.scene.add(this.points);
    }

    resetParticle(i, fresh = false) {
        const idx = i * 3;
        const halfX = this.area.x / 2;
        const halfY = this.area.y / 2;
        const halfZ = this.area.z / 2;
        if (this.type === 'snow') {
            this.positions[idx] = randRange(-halfX, halfX);
            this.positions[idx + 1] = randRange(-halfY, halfY) + (fresh ? halfY : 0);
            this.positions[idx + 2] = randRange(-halfZ, halfZ);
            this.velocities[idx] = randRange(-0.3, 0.3);
            this.velocities[idx + 1] = randRange(0.6, 1.4);
            this.velocities[idx + 2] = randRange(-0.3, 0.3);
            this.life[i] = 1;
            return;
        }
        if (this.type === 'spark') {
            const angle = randRange(0, TAU);
            const radius = randRange(0, Math.min(halfX, halfZ) * 0.5);
            this.positions[idx] = Math.cos(angle) * radius;
            this.positions[idx + 1] = randRange(-halfY * 0.4, halfY * 0.4);
            this.positions[idx + 2] = Math.sin(angle) * radius;
            this.velocities[idx] = randRange(-0.2, 0.2);
            this.velocities[idx + 1] = randRange(0.4, 1.0);
            this.velocities[idx + 2] = randRange(-0.2, 0.2);
            this.life[i] = 1;
            return;
        }
        const centerX = randRange(-halfX * 0.7, halfX * 0.7);
        const centerY = randRange(6, halfY + 10);
        const centerZ = randRange(-halfZ * 0.7, halfZ * 0.7);
        this.positions[idx] = centerX;
        this.positions[idx + 1] = centerY;
        this.positions[idx + 2] = centerZ;
        const theta = randRange(0, TAU);
        const phi = randRange(0, Math.PI);
        const burstSpeed = randRange(1.0, 2.8);
        this.velocities[idx] = Math.cos(theta) * Math.sin(phi) * burstSpeed;
        this.velocities[idx + 1] = Math.cos(phi) * burstSpeed;
        this.velocities[idx + 2] = Math.sin(theta) * Math.sin(phi) * burstSpeed;
        this.life[i] = randRange(0.8, 1.8);
    }

    update(delta) {
        if (!this.points) return;
        const positions = this.positions;
        const velocities = this.velocities;
        const halfY = this.area.y / 2;
        this.time += delta;
        if (this.type === 'snow') {
            for (let i = 0; i < this.count; i++) {
                const idx = i * 3;
                positions[idx + 1] -= velocities[idx + 1] * delta * this.speed;
                positions[idx] += velocities[idx] * delta * this.speed * 0.35;
                positions[idx + 2] += velocities[idx + 2] * delta * this.speed * 0.35;
                if (positions[idx + 1] < -halfY) {
                    this.resetParticle(i, true);
                }
            }
        } else if (this.type === 'spark') {
            for (let i = 0; i < this.count; i++) {
                const idx = i * 3;
                positions[idx + 1] += velocities[idx + 1] * delta * this.speed;
                positions[idx] += Math.sin(this.time * 2.2 + i) * 0.01 * this.speed;
                positions[idx + 2] += Math.cos(this.time * 2.2 + i) * 0.01 * this.speed;
                if (positions[idx + 1] > halfY) {
                    this.resetParticle(i, true);
                }
            }
        } else {
            for (let i = 0; i < this.count; i++) {
                const idx = i * 3;
                this.life[i] -= delta;
                if (this.life[i] <= 0) {
                    this.resetParticle(i, true);
                    continue;
                }
                velocities[idx + 1] -= 2.6 * delta;
                positions[idx] += velocities[idx] * delta * this.speed;
                positions[idx + 1] += velocities[idx + 1] * delta * this.speed;
                positions[idx + 2] += velocities[idx + 2] * delta * this.speed;
            }
        }
        this.points.geometry.attributes.position.needsUpdate = true;
    }
}

class TreasureSystem {
    constructor(world, options = {}) {
        this.world = world;
        this.radius = Math.max(6, toNumber(options.radius, 28));
        this.autoHint = options.autoHint ?? true;
        this.broadcast = options.broadcast ?? false;
        this.hintCooldown = Math.max(300, toNumber(options.hintCooldown, 900));
        this.lastHintAt = 0;
        this.lastDistance = null;
        this.lastPosition = null;
        this.position = new THREE.Vector3();
        this.marker = this.createMarker();
        this.reset();
    }

    createMarker() {
        const ringGeo = new THREE.TorusGeometry(0.8, 0.14, 12, 40);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd54f, transparent: true, opacity: 0.4 });
        const mesh = new THREE.Mesh(ringGeo, ringMat);
        mesh.rotation.x = Math.PI / 2;
        mesh.visible = false;
        this.world.scene.add(mesh);
        return mesh;
    }

    reset() {
        const r = this.radius;
        this.position.set(randRange(-r, r), 0, randRange(-r, r));
        if (this.marker) this.marker.position.copy(this.position);
        this.lastDistance = null;
        this.lastPosition = null;
    }

    setAuto(enabled) {
        this.autoHint = !!enabled;
    }

    setBroadcast(enabled) {
        this.broadcast = !!enabled;
    }

    distanceToPlayer() {
        if (!this.world.myAvatar) return null;
        return this.position.distanceTo(this.world.myAvatar.position);
    }

    hint(say = false) {
        const distance = this.distanceToPlayer();
        if (distance === null) return null;
        let message = 'Warm...';
        if (this.lastDistance === null) {
            message = 'Find it...';
        } else {
            const delta = this.lastDistance - distance;
            if (delta > 0.2) {
                message = 'Hot!';
            } else if (delta < -0.2) {
                message = 'Cold!';
            }
        }
        this.lastDistance = distance;
        if (say) this.world.systemSay(message, this.broadcast);
        return { message, distance };
    }

    update(delta) {
        const distance = this.distanceToPlayer();
        if (distance === null) {
            if (this.world.ui.treasureDistance) this.world.ui.treasureDistance.textContent = '--';
            return;
        }
        if (this.world.ui.treasureDistance) {
            this.world.ui.treasureDistance.textContent = distance.toFixed(2);
        }
        if (!this.autoHint) return;
        const now = Date.now();
        if (!this.lastPosition) {
            this.lastPosition = this.world.myAvatar.position.clone();
            return;
        }
        const moved = this.lastPosition.distanceToSquared(this.world.myAvatar.position) > 0.05;
        if (moved && now - this.lastHintAt > this.hintCooldown) {
            this.hint(true);
            this.lastHintAt = now;
        }
        this.lastPosition.copy(this.world.myAvatar.position);
    }
}

class TagBot {
    constructor(world, options = {}) {
        this.world = world;
        this.name = options.name || 'TAG-BOT';
        this.nameKey = normalizeName(this.name);
        this.mode = options.mode || 'chase';
        this.radius = Math.max(2, toNumber(options.radius, 120));
        this.speed = Math.max(0.2, toNumber(options.speed, 1.2));
        this.active = options.active ?? true;
        this.mesh = this.world.createAvatarMesh({ main: 0xff6f00 });
        this.mesh.position.set(randRange(-8, 8), 0, randRange(-8, 8));
        this.mesh.userData.role = 'tag';
        this.home = this.mesh.position.clone();
        this.wanderAngle = Math.random() * TAU;
        this.tmpVec = new THREE.Vector3();
        this.tmpTarget = new THREE.Vector3();
        this.world.scene.add(this.mesh);
        this.mesh.visible = this.active;
        if (this.active) this.ensureTag();
    }

    ensureTag() {
        if (this.mesh && !this.mesh.userData.nameTag) {
            this.world.attachNameTag(this.mesh, this.name, false);
        }
    }

    resetUi() {
        if (this.mesh.userData.bubbles) {
            this.mesh.userData.bubbles.forEach(b => b.el.remove());
            this.mesh.userData.bubbles = [];
        }
        if (this.mesh.userData.nameTag) {
            this.mesh.userData.nameTag.remove();
            this.mesh.userData.nameTag = null;
        }
    }

    setActive(active) {
        this.active = !!active;
        this.mesh.visible = this.active;
        if (!this.active) {
            this.resetUi();
            return;
        }
        this.ensureTag();
    }

    setConfig(config = {}) {
        if (config.mode) this.mode = config.mode === 'flee' ? 'flee' : 'chase';
        if (config.radius !== undefined) this.radius = Math.max(2, toNumber(config.radius, this.radius));
        if (config.speed !== undefined) this.speed = Math.max(0.2, toNumber(config.speed, this.speed));
        if (config.active !== undefined) this.setActive(config.active);
        if (this.active) this.ensureTag();
        return this.getStatus();
    }

    getStatus() {
        return {
            mode: this.mode,
            radius: this.radius,
            speed: this.speed,
            active: this.active
        };
    }

    update(delta) {
        if (!this.active || !this.world.myAvatar) return;
        const playerPos = this.world.myAvatar.position;
        const pos = this.mesh.position;
        const offset = this.tmpVec.subVectors(playerPos, pos);
        const distance = offset.length();
        if (distance < this.radius && distance > 0.001) {
            const direction = offset.normalize();
            if (this.mode === 'flee') direction.multiplyScalar(-1);
            pos.addScaledVector(direction, this.speed * delta);
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        } else {
            this.wanderAngle += delta * 0.6;
            const orbitX = Math.cos(this.wanderAngle) * 2;
            const orbitZ = Math.sin(this.wanderAngle) * 2;
            this.tmpTarget.set(this.home.x + orbitX, this.home.y, this.home.z + orbitZ);
            const wanderDir = this.tmpVec.subVectors(this.tmpTarget, pos);
            if (wanderDir.length() > 0.2) {
                wanderDir.normalize();
                pos.addScaledVector(wanderDir, this.speed * 0.35 * delta);
                this.mesh.rotation.y = Math.atan2(wanderDir.x, wanderDir.z);
            }
        }
        if (this.mesh.userData.visual) {
            this.mesh.userData.visual.position.y = Math.sin(Date.now() * 0.005 + this.wanderAngle) * 0.05;
        }
    }
}

class NPCManager {
    constructor(world, options = {}) {
        this.world = world;
        this.greeter = this.createNpc('MIRA', { main: 0x26c6da }, new THREE.Vector3(-6, 0, -2));
        this.patrol = this.createNpc('WATCH', { main: 0xff7043 }, new THREE.Vector3(6, 0, 6));
        this.pet = this.createNpc('PON', { main: 0x8bc34a }, new THREE.Vector3(2, 0, 4));
        this.setNpcActive(this.greeter, options.greeter ?? true);
        this.setNpcActive(this.patrol, options.patrol ?? true);
        this.setNpcActive(this.pet, options.pet ?? true);
        this.patrolRoute = [
            new THREE.Vector3(-12, 0, -12),
            new THREE.Vector3(12, 0, -12),
            new THREE.Vector3(12, 0, 12),
            new THREE.Vector3(-12, 0, 12)
        ];
        this.patrolIndex = 0;
        this.patrolSpeed = 0.8;
        this.petFollowDistance = 2.4;
        this.petSpeed = 1.1;
        this.chatCooldownUntil = 0;
        this.tmpVec = new THREE.Vector3();
    }

    createNpc(name, colors, position) {
        const mesh = this.world.createAvatarMesh(colors);
        mesh.position.copy(position);
        mesh.userData.role = 'npc';
        mesh.userData.npcName = name;
        this.world.scene.add(mesh);
        this.world.attachNameTag(mesh, name, false);
        return { name, nameKey: normalizeName(name), mesh, active: true };
    }

    setNpcActive(npc, active) {
        if (!npc) return;
        npc.active = !!active;
        npc.mesh.visible = npc.active;
        if (!npc.active) {
            if (npc.mesh.userData.bubbles) {
                npc.mesh.userData.bubbles.forEach(b => b.el.remove());
                npc.mesh.userData.bubbles = [];
            }
            if (npc.mesh.userData.nameTag) {
                npc.mesh.userData.nameTag.remove();
                npc.mesh.userData.nameTag = null;
            }
            return;
        }
        if (!npc.mesh.userData.nameTag) {
            this.world.attachNameTag(npc.mesh, npc.name, false);
        }
    }

    setConfig({ greeter, patrol, pet } = {}) {
        if (greeter !== undefined) this.setNpcActive(this.greeter, !!greeter);
        if (patrol !== undefined) this.setNpcActive(this.patrol, !!patrol);
        if (pet !== undefined) this.setNpcActive(this.pet, !!pet);
        return this.status();
    }

    status() {
        return {
            greeter: !!(this.greeter && this.greeter.active),
            patrol: !!(this.patrol && this.patrol.active),
            pet: !!(this.pet && this.pet.active)
        };
    }

    getActiveNpcs() {
        return [this.greeter, this.patrol, this.pet].filter(npc => npc && npc.active);
    }

    getMeshes() {
        return this.getActiveNpcs().map(npc => npc.mesh);
    }

    getNames() {
        return this.getActiveNpcs().map(npc => npc.name);
    }

    refreshTags() {
        this.getActiveNpcs().forEach((npc) => {
            if (!npc.mesh.userData.nameTag) this.world.attachNameTag(npc.mesh, npc.name, false);
        });
    }

    resetUi() {
        [this.greeter, this.patrol, this.pet].forEach((npc) => {
            if (!npc) return;
            if (npc.mesh.userData.bubbles) {
                npc.mesh.userData.bubbles.forEach(b => b.el.remove());
                npc.mesh.userData.bubbles = [];
            }
            if (npc.mesh.userData.nameTag) {
                npc.mesh.userData.nameTag.remove();
                npc.mesh.userData.nameTag = null;
            }
        });
    }

    handleChat(text) {
        if (!this.greeter || !this.greeter.active || !text) return;
        const now = Date.now();
        if (now < this.chatCooldownUntil) return;
        const normalized = String(text).toLowerCase();
        const greetingMatch = /(こんにちは|こんばんは|おはよう|hello|hi|hey)/i.test(normalized);
        const helpMatch = /(help|使い方|操作|how)/i.test(normalized);
        if (greetingMatch) {
            const replies = ['こんにちは！', 'ようこそ！', 'HELLO!'];
            const reply = replies[Math.floor(Math.random() * replies.length)];
            this.world.showChatBubble(this.greeter.mesh, reply);
            this.chatCooldownUntil = now + 2000;
        } else if (helpMatch) {
            const reply = 'WASDとSYSTEM LABで遊べます';
            this.world.showChatBubble(this.greeter.mesh, reply);
            this.chatCooldownUntil = now + 2400;
        }
    }

    update(delta) {
        if (this.patrol && this.patrol.active) this.updatePatrol(delta);
        if (this.pet && this.pet.active) this.updatePet(delta);
        [this.greeter, this.patrol, this.pet].forEach((npc, index) => {
            if (!npc || !npc.active) return;
            const visual = npc.mesh.userData.visual;
            if (visual) {
                visual.position.y = Math.sin(Date.now() * 0.005 + index) * 0.05;
            }
        });
    }

    updatePatrol(delta) {
        const target = this.patrolRoute[this.patrolIndex % this.patrolRoute.length];
        const pos = this.patrol.mesh.position;
        const direction = this.tmpVec.subVectors(target, pos);
        const distance = direction.length();
        if (distance < 0.4) {
            this.patrolIndex = (this.patrolIndex + 1) % this.patrolRoute.length;
            return;
        }
        direction.normalize();
        pos.addScaledVector(direction, this.patrolSpeed * delta);
        this.patrol.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }

    updatePet(delta) {
        if (!this.world.myAvatar) return;
        const pos = this.pet.mesh.position;
        const target = this.world.myAvatar.position;
        const direction = this.tmpVec.subVectors(target, pos);
        const distance = direction.length();
        if (distance < 0.1) return;
        direction.normalize();
        pos.addScaledVector(direction, this.petSpeed * delta);
        this.pet.mesh.rotation.y = Math.atan2(direction.x, direction.z);
    }
}

// --- Network Logic ---
class NetworkManager {
    constructor(world) {
        this.world = world;
        this.client = null;
        // 全員が同じ部屋に入る設定
        this.room = 'mirakuruverse/global_public_lobby_2025';
        this.lastSent = 0;
    }

    connect() {
        const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
        console.log('Connecting to Global Lobby...');

        this.client = mqtt.connect(brokerUrl);

        this.client.on('connect', () => {
            console.log('Connected to Global Lobby!');
            this.client.subscribe(this.room);

            this.send({ type: 'join', colorIdx: MY_COLOR_IDX });
            this.toggleScreen(true);
            this.world.start();
        });

        this.client.on('message', (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                if (data.id === MY_ID) return;
                this.world.handleNetworkMessage(data);
            } catch (e) { console.error(e); }
        });
    }

    disconnect() {
        if (this.client && this.client.connected) {
            this.send({ type: 'leave' });
            this.client.end();
        }
        this.client = null;
        this.toggleScreen(false);
        this.world.reset();
    }

    toggleScreen(isGame) {
        const login = document.getElementById('login-screen');
        const ui = document.getElementById('ui-layer');
        const copyright = document.getElementById('copyright');
        document.body.classList.toggle('in-game', isGame);
        this.world.setPythonOnlyMode(false);

        if (isGame) {
            login.classList.add('hidden');
            ui.classList.add('active');
            copyright.classList.remove('on-login');
            copyright.classList.add('on-game');
            setTimeout(() => {
                if (this.world.ui.chatInput) this.world.ui.chatInput.focus();
            }, 200);
        } else {
            login.classList.remove('hidden');
            ui.classList.remove('active');
            copyright.classList.remove('on-game');
            copyright.classList.add('on-login');
            this.world.ui.nicknameInput.focus();
        }
    }

    send(data) {
        if (!this.client || !this.client.connected) return;
        const payload = { id: MY_ID, name: this.world.myName, ...data };
        this.client.publish(this.room, JSON.stringify(payload));
    }

    broadcastMove(pos, rot, force = false) {
        const now = Date.now();
        if (force || now - this.lastSent > 50) {
            this.send({ type: 'move', x: pos.x, y: pos.y, z: pos.z, ry: rot.y, colorIdx: MY_COLOR_IDX });
            this.lastSent = now;
        }
    }
}

// --- World Logic ---
class MirakuruVerse {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.keys = {};
        this.remotePlayers = {};
        this.myName = '';
        this.myNameKey = '';
        this.view = { yaw: 0, pitch: 0, isDragging: false, lastX: 0, lastY: 0 };
        this.controlMode = 'hybrid';
        this.floatingTitle = null;
        this.pyodide = null;
        this.pyLoading = false;
        this.pyApiReady = false;
        this.ui = {
            nicknameInput: document.getElementById('nickname-input'),
            consentCheckbox: document.getElementById('consent-checkbox'),
            connectButton: document.getElementById('btn-connect'),
            nicknameDisplay: document.getElementById('nickname-display'),
            chatInput: document.getElementById('chat-input'),
            chatSend: document.getElementById('chat-send'),
            mentionList: document.getElementById('mention-list'),
            reactionButtons: document.getElementById('reaction-buttons'),
            emoteButtons: document.getElementById('emote-buttons'),
            pyMenuButton: document.getElementById('py-menu-button'),
            pyPanel: document.getElementById('py-panel'),
            pyRun: document.getElementById('py-run'),
            pyClear: document.getElementById('py-clear'),
            pyClose: document.getElementById('py-close'),
            pyCode: document.getElementById('py-code'),
            pyOutput: document.getElementById('py-output'),
            pyStatus: document.getElementById('py-status')
        };
        this.chatPlaceholder = this.ui.chatInput ? this.ui.chatInput.placeholder : '';

        this.network = new NetworkManager(this);

        this.initThree();
        this.createEnvironment();
        this.clock = new THREE.Clock();
        this.initSystems();
        this.setupInputs();
        this.setupViewControls();
        this.setupTouchControls();
        this.setupChat();
        this.setupPythonConsole();
        this.initPyodide();
        this.setupLogin();

        document.getElementById('btn-exit').addEventListener('click', () => {
            this.network.disconnect();
        });

        window.addEventListener('beforeunload', () => {
            if (this.network.client) this.network.send({ type: 'leave' });
        });
    }

    start() {
        if (this.myAvatar) {
            if (this.myAvatar.userData.nameTag) this.myAvatar.userData.nameTag.remove();
            this.scene.remove(this.myAvatar);
        }
        this.myAvatar = this.createAvatarMesh(CONFIG.avatarColors[MY_COLOR_IDX]);
        this.myAvatar.userData.playerId = MY_ID;

        // 初期位置をランダムに分散させる (混雑回避)
        this.myAvatar.position.set(
            (Math.random() - 0.5) * 10, // -5 ~ +5
            0,
            (Math.random() - 0.5) * 10  // -5 ~ +5
        );

        this.scene.add(this.myAvatar);
        this.attachNameTag(this.myAvatar, this.myName, true);
        if (this.tagBot) this.tagBot.ensureTag();
        if (this.npcManager) this.npcManager.refreshTags();
        if (this.treasureSystem) this.treasureSystem.reset();
        if (this.clock) this.clock.start();
        this.isGameActive = true;
        this.animate();
    }

    reset() {
        this.isGameActive = false;
        if (this.myAvatar) { this.scene.remove(this.myAvatar); this.myAvatar = null; }
        Object.keys(this.remotePlayers).forEach(id => this.removeRemotePlayer(id));
        this.remotePlayers = {};
        document.getElementById('bubbles-layer').innerHTML = '';
        document.getElementById('name-tags-layer').innerHTML = '';
        if (this.tagBot) this.tagBot.resetUi();
        if (this.npcManager) this.npcManager.resetUi();
        if (this.ui.treasureDistance) this.ui.treasureDistance.textContent = '--';
        if (this.clock) this.clock.stop();
        this.keys = {};
        this.refreshMentionList();
    }

    setPythonOnlyMode(enabled) {
        this.controlMode = enabled ? 'python' : 'hybrid';
        document.body.classList.toggle('python-only', enabled);
        if (enabled) this.keys = {};
        if (this.ui.chatInput) {
            this.ui.chatInput.placeholder = enabled ? 'Pythonコンソールから送信' : this.chatPlaceholder;
        }
        if (!enabled && this.ui.pyPanel) {
            this.ui.pyPanel.classList.remove('open');
            this.ui.pyPanel.classList.add('hidden');
            this.ui.pyPanel.setAttribute('aria-hidden', 'true');
        }
        const disableField = (el) => {
            if (!el) return;
            if ('disabled' in el) el.disabled = enabled;
        };
        disableField(this.ui.chatInput);
        disableField(this.ui.chatSend);
        if (this.ui.reactionButtons) {
            this.ui.reactionButtons.querySelectorAll('button').forEach(btn => disableField(btn));
        }
        if (this.ui.emoteButtons) {
            this.ui.emoteButtons.querySelectorAll('button').forEach(btn => disableField(btn));
        }
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.bg);
        this.scene.fog = new THREE.FogExp2(CONFIG.colors.fog, 0.012);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.container.appendChild(this.renderer.domElement);

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
        const dirLight = new THREE.DirectionalLight(0xe0f7fa, 1.0);
        dirLight.position.set(50, 100, 50);
        this.scene.add(dirLight);

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createEnvironment() {
        const ringGeo = new THREE.TorusGeometry(40, 0.2, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x0288d1, transparent: true, opacity: 0.2 });
        const floorRing = new THREE.Mesh(ringGeo, ringMat);
        floorRing.rotation.x = Math.PI / 2; floorRing.position.y = -10;
        this.scene.add(floorRing);

        const grid = new THREE.GridHelper(200, 60, 0x00bcd4, 0x006064);
        if (Array.isArray(grid.material)) {
            grid.material.forEach((mat) => { mat.opacity = 0.18; mat.transparent = true; });
        } else {
            grid.material.opacity = 0.18;
            grid.material.transparent = true;
        }
        grid.position.y = -0.5;
        this.scene.add(grid);

        const boxGeo = new THREE.BoxGeometry(1, 1, 1);
        const boxMat = new THREE.MeshPhysicalMaterial({ color: 0x00bcd4, transparent: true, opacity: 0.5 });
        for (let i = 0; i < 100; i++) {
            const mesh = new THREE.Mesh(boxGeo, boxMat);
            mesh.position.set((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 50 + 10, (Math.random() - 0.5) * 100);
            this.scene.add(mesh);
        }
        this.createFloatingTitle();
    }

    initSystems() {
        this.magicSystem = new MagicSystem(this.scene, {
            type: 'snow',
            count: 240,
            color: '#ffffff',
            speed: 0.8,
            size: 0.12
        });
        this.treasureSystem = new TreasureSystem(this, {
            radius: 28,
            autoHint: false,
            broadcast: false,
            hintCooldown: 900
        });
        this.tagBot = new TagBot(this, {
            mode: 'chase',
            radius: 120,
            speed: 1.2,
            active: true
        });
        this.npcManager = new NPCManager(this, { greeter: true, patrol: true, pet: true });
    }

    createFloatingTitle() {
        const canvas = document.createElement('canvas');
        const width = 1024;
        const height = 256;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const text = 'MIRAKURU-VERSE';
        ctx.clearRect(0, 0, width, height);
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, '#00e5ff');
        gradient.addColorStop(0.5, '#80d8ff');
        gradient.addColorStop(1, '#00e676');
        ctx.font = '700 120px "Rajdhani", "Noto Sans JP", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0, 96, 100, 0.35)';
        ctx.shadowBlur = 18;
        ctx.fillStyle = gradient;
        ctx.fillText(text, width / 2, height / 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.strokeText(text, width / 2, height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        const aspect = width / height;
        const heightUnits = 6;
        sprite.scale.set(heightUnits * aspect, heightUnits, 1);
        sprite.position.set(0, 12, -18);
        sprite.userData.float = { baseY: sprite.position.y, amplitude: 0.8, speed: 0.0012 };
        this.scene.add(sprite);
        this.floatingTitle = sprite;
    }

    createAvatarMesh(colors) {
        const group = new THREE.Group();
        const visual = new THREE.Group();
        group.add(visual);
        group.userData.visual = visual;

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 32, 32), new THREE.MeshToonMaterial({ color: 0xffffff }));
        visual.add(body);
        const eyeMat = new THREE.MeshBasicMaterial({ color: colors.main });
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
        leftEye.position.set(-0.25, 0.2, 0.65);
        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeMat);
        rightEye.position.set(0.25, 0.2, 0.65);
        visual.add(leftEye, rightEye);
        const earGeo = new THREE.ConeGeometry(0.15, 1.2, 32);
        const earMat = new THREE.MeshToonMaterial({ color: colors.main });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.5, 1.0, 0); leftEar.rotation.z = 0.2;
        const rightEar = new THREE.Mesh(earGeo, earMat);
        rightEar.position.set(0.5, 1.0, 0); rightEar.rotation.z = -0.2;
        visual.add(leftEar, rightEar);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(1.4, 0.03, 16, 64),
            new THREE.MeshBasicMaterial({ color: colors.main, transparent: true, opacity: 0.6 })
        );
        ring.rotation.x = Math.PI / 1.8;
        visual.add(ring);
        return group;
    }

    setupInputs() {
        document.addEventListener('keydown', (e) => {
            if (this.controlMode === 'python') return;
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
            this.keys[e.code] = true;
        });
        document.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    setupViewControls() {
        this.renderer.domElement.style.touchAction = 'none';
        this.renderer.domElement.addEventListener('pointerdown', (e) => {
            if (this.controlMode === 'python') return;
            if (e.button !== 0) return;
            this.view.isDragging = true;
            this.view.lastX = e.clientX;
            this.view.lastY = e.clientY;
            this.renderer.domElement.setPointerCapture(e.pointerId);
        });
        this.renderer.domElement.addEventListener('pointermove', (e) => {
            if (this.controlMode === 'python') return;
            if (!this.view.isDragging) return;
            const dx = e.clientX - this.view.lastX;
            const dy = e.clientY - this.view.lastY;
            this.view.yaw = clamp(this.view.yaw - dx * 0.003, -CONFIG.camera.yawLimit, CONFIG.camera.yawLimit);
            this.view.pitch = clamp(this.view.pitch - dy * 0.003, CONFIG.camera.pitchMin, CONFIG.camera.pitchMax);
            this.view.lastX = e.clientX;
            this.view.lastY = e.clientY;
        });
        const endDrag = (e) => {
            if (!this.view.isDragging) return;
            this.view.isDragging = false;
            if (this.renderer.domElement.hasPointerCapture(e.pointerId)) {
                this.renderer.domElement.releasePointerCapture(e.pointerId);
            }
        };
        this.renderer.domElement.addEventListener('pointerup', endDrag);
        this.renderer.domElement.addEventListener('pointerleave', endDrag);
        window.addEventListener('blur', () => {
            this.view.isDragging = false;
            this.keys = {};
        });
    }

    setupTouchControls() {
        const controls = document.getElementById('mobile-controls');
        if (!controls) return;
        const buttons = controls.querySelectorAll('[data-key]');
        buttons.forEach((button) => {
            const code = button.dataset.key;
            if (!code) return;
            const press = (event) => {
                if (this.controlMode === 'python') return;
                event.preventDefault();
                this.keys[code] = true;
                button.classList.add('active');
                if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
            };
            const release = (event) => {
                this.keys[code] = false;
                button.classList.remove('active');
                if (button.hasPointerCapture && button.hasPointerCapture(event.pointerId)) {
                    button.releasePointerCapture(event.pointerId);
                }
            };
            button.addEventListener('pointerdown', press);
            button.addEventListener('pointerup', release);
            button.addEventListener('pointerleave', release);
            button.addEventListener('pointercancel', release);
        });
    }

    setupLogin() {
        const input = this.ui.nicknameInput;
        const button = this.ui.connectButton;
        const consent = this.ui.consentCheckbox;
        const stored = localStorage.getItem('mirakuruverse_nickname');
        if (stored) input.value = stored;

        const updateState = () => {
            const sanitized = this.sanitizeNickname(input.value);
            if (input.value !== sanitized) input.value = sanitized;
            const hasConsent = !!(consent && consent.checked);
            button.disabled = !(sanitized && hasConsent);
            this.ui.nicknameDisplay.textContent = sanitized || 'GUEST';
        };

        input.addEventListener('input', updateState);
        if (consent) consent.addEventListener('change', updateState);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !button.disabled) button.click();
        });
        button.addEventListener('click', () => {
            const name = this.sanitizeNickname(input.value);
            if (!name) return;
            if (consent && !consent.checked) return;
            this.setNickname(name);
            this.network.connect();
        });

        updateState();
        input.focus();
    }

    sanitizeNickname(raw) {
        const condensed = raw.replace(/[\s\u3000]+/g, '');
        if (!condensed) return '';
        return condensed.slice(0, NAME_LIMIT);
    }

    setNickname(name) {
        this.myName = name;
        this.myNameKey = normalizeName(name);
        this.ui.nicknameDisplay.textContent = name;
        localStorage.setItem('mirakuruverse_nickname', name);
        this.refreshMentionList();
    }

    setupChat() {
        const input = this.ui.chatInput;
        const sendBtn = this.ui.chatSend;
        if (!input || !sendBtn) return;
        const sendChat = () => {
            if (this.controlMode === 'python') return;
            const text = input.value.trim();
            if (!text || !this.myAvatar) return;
            this.showChatBubble(this.myAvatar, text);
            this.network.send({ type: 'chat', text: text });
            this.applyMentions(text, this.myAvatar);
            if (this.npcManager) this.npcManager.handleChat(text);
            input.value = '';
        };
        sendBtn.addEventListener('click', sendChat);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChat(); });

        if (this.ui.reactionButtons) {
            this.ui.reactionButtons.addEventListener('click', (e) => {
                if (this.controlMode === 'python') return;
                const button = e.target.closest('button[data-reaction]');
                if (!button) return;
                this.sendReaction(button.dataset.reaction);
            });
        }

        if (this.ui.emoteButtons) {
            this.ui.emoteButtons.addEventListener('click', (e) => {
                if (this.controlMode === 'python') return;
                const button = e.target.closest('button[data-emote]');
                if (!button) return;
                this.sendEmote(button.dataset.emote);
            });
        }

        if (this.ui.mentionList) {
            this.ui.mentionList.addEventListener('click', (e) => {
                const button = e.target.closest('button[data-mention]');
                if (!button) return;
                this.insertMention(button.dataset.mention);
            });
        }
    }

    setupPythonConsole() {
        const panel = this.ui.pyPanel;
        if (!panel) return;
        const openPanel = () => {
            panel.classList.add('open');
            panel.classList.remove('hidden');
            panel.setAttribute('aria-hidden', 'false');
            if (!this.pyodide && !this.pyLoading) this.initPyodide();
            if (this.ui.pyCode) this.ui.pyCode.focus();
        };
        const closePanel = () => {
            panel.classList.remove('open');
            panel.classList.add('hidden');
            panel.setAttribute('aria-hidden', 'true');
        };
        if (this.ui.pyMenuButton) this.ui.pyMenuButton.addEventListener('click', openPanel);
        if (this.ui.pyClose) this.ui.pyClose.addEventListener('click', closePanel);
        panel.addEventListener('click', (event) => {
            if (event.target === panel) closePanel();
        });
        if (this.ui.pyRun) this.ui.pyRun.addEventListener('click', () => this.runPythonCode());
        if (this.ui.pyClear) {
            this.ui.pyClear.addEventListener('click', () => {
                if (this.ui.pyOutput) this.ui.pyOutput.textContent = '';
            });
        }
    }

    async initPyodide() {
        if (this.pyodide || this.pyLoading) return;
        if (typeof loadPyodide !== 'function') {
            this.setPyStatus('Pyodide: Unavailable');
            return;
        }
        this.pyLoading = true;
        this.setPyStatus('Pyodide: Loading...');
        try {
            this.pyodide = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' });
            this.pyodide.setStdout({ batched: (text) => this.appendPyOutput(text) });
            this.pyodide.setStderr({ batched: (text) => this.appendPyOutput(text) });
            const ready = this.setupPythonApi();
            this.setPyStatus(ready ? 'Pyodide: Ready' : 'Pyodide: API Error');
        } catch (err) {
            this.appendPyOutput(String(err));
            this.setPyStatus('Pyodide: Failed');
        } finally {
            this.pyLoading = false;
        }
    }

    setupPythonApi() {
        if (!this.pyodide) return false;
        this.pyApiReady = false;
        const toRad = (deg) => (Number(deg) || 0) * (Math.PI / 180);
        const api = {
            move: (forward = 0, right = 0, up = 0) => {
                if (!this.myAvatar) return 'Avatar not ready';
                const f = Number(forward) || 0;
                const r = Number(right) || 0;
                const u = Number(up) || 0;
                const yaw = this.myAvatar.rotation.y;
                const forwardVec = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
                const rightVec = new THREE.Vector3(Math.sin(yaw + Math.PI / 2), 0, Math.cos(yaw + Math.PI / 2));
                this.myAvatar.position.addScaledVector(forwardVec, f);
                this.myAvatar.position.addScaledVector(rightVec, r);
                this.myAvatar.position.y += u;
                this.network.broadcastMove(this.myAvatar.position, this.myAvatar.rotation, true);
                return `moved f=${f} r=${r} u=${u}`;
            },
            turn: (deg = 0) => {
                if (!this.myAvatar) return 'Avatar not ready';
                const delta = toRad(deg);
                this.myAvatar.rotation.y += delta;
                this.network.broadcastMove(this.myAvatar.position, this.myAvatar.rotation, true);
                return `turned ${deg}deg`;
            },
            look: (yawDeg = 0, pitchDeg = 0) => {
                this.view.yaw = clamp(this.view.yaw + toRad(yawDeg), -CONFIG.camera.yawLimit, CONFIG.camera.yawLimit);
                this.view.pitch = clamp(this.view.pitch + toRad(pitchDeg), CONFIG.camera.pitchMin, CONFIG.camera.pitchMax);
                return `view yaw=${yawDeg} pitch=${pitchDeg}`;
            },
            set_view: (yawDeg = 0, pitchDeg = 0) => {
                this.view.yaw = clamp(toRad(yawDeg), -CONFIG.camera.yawLimit, CONFIG.camera.yawLimit);
                this.view.pitch = clamp(toRad(pitchDeg), CONFIG.camera.pitchMin, CONFIG.camera.pitchMax);
                return `set view yaw=${yawDeg} pitch=${pitchDeg}`;
            },
            say: (text) => {
                if (!this.myAvatar) return 'Avatar not ready';
                const message = String(text ?? '').trim();
                if (!message) return 'Empty message';
                this.showChatBubble(this.myAvatar, message);
                this.network.send({ type: 'chat', text: message });
                this.applyMentions(message, this.myAvatar);
                if (this.npcManager) this.npcManager.handleChat(message);
                return 'sent';
            },
            magic: (type = 'snow', count = 200, color = '#ffffff', speed = 1.0, size = 0.12) => {
                if (!this.magicSystem) return 'Magic system not ready';
                return this.magicSystem.applyConfig({
                    type: String(type || 'snow'),
                    count: toNumber(count, this.magicSystem.count),
                    color: String(color || this.magicSystem.color),
                    speed: toNumber(speed, this.magicSystem.speed),
                    size: toNumber(size, this.magicSystem.size)
                });
            },
            treasure_distance: () => {
                if (!this.treasureSystem) return 'Treasure system not ready';
                const distance = this.treasureSystem.distanceToPlayer();
                if (distance === null) return 'Avatar not ready';
                return Number(distance.toFixed(2));
            },
            treasure_hint: (say = false) => {
                if (!this.treasureSystem) return 'Treasure system not ready';
                const info = this.treasureSystem.hint(!!say);
                return info ? info.message : 'Avatar not ready';
            },
            treasure_reset: () => {
                if (!this.treasureSystem) return 'Treasure system not ready';
                this.treasureSystem.reset();
                return 'treasure reset';
            },
            tag_config: (mode = 'chase', radius = 120, speed = 1.2, active = true) => {
                if (!this.tagBot) return 'Tag bot not ready';
                return this.tagBot.setConfig({
                    mode: String(mode || 'chase'),
                    radius: toNumber(radius, this.tagBot.radius),
                    speed: toNumber(speed, this.tagBot.speed),
                    active: Boolean(active)
                });
            },
            npc_config: (greeter = true, patrol = true, pet = true) => {
                if (!this.npcManager) return 'NPC system not ready';
                return this.npcManager.setConfig({
                    greeter: Boolean(greeter),
                    patrol: Boolean(patrol),
                    pet: Boolean(pet)
                });
            },
            react: (symbol) => {
                const icon = String(symbol ?? '').trim();
                if (!icon) return 'Empty reaction';
                this.sendReaction(icon);
                return 'reacted';
            },
            emote: (name) => {
                const type = String(name ?? '').trim();
                if (!type) return 'Empty emote';
                this.sendEmote(type);
                return 'emoted';
            },
            status: () => {
                if (!this.myAvatar) return { ready: false };
                return {
                    ready: true,
                    position: {
                        x: Number(this.myAvatar.position.x.toFixed(2)),
                        y: Number(this.myAvatar.position.y.toFixed(2)),
                        z: Number(this.myAvatar.position.z.toFixed(2))
                    },
                    rotationY: Number((this.myAvatar.rotation.y * 180 / Math.PI).toFixed(1)),
                    view: {
                        yaw: Number((this.view.yaw * 180 / Math.PI).toFixed(1)),
                        pitch: Number((this.view.pitch * 180 / Math.PI).toFixed(1))
                    }
                };
            }
        };
        this.pyApi = api;
        this.pyodide.globals.set('py_api', api);
        globalThis.py_api = api;
        const bootstrap = `
def move(forward=0, right=0, up=0):
    return py_api.move(forward, right, up)

def turn(deg=0):
    return py_api.turn(deg)

def look(yaw_deg=0, pitch_deg=0):
    return py_api.look(yaw_deg, pitch_deg)

def set_view(yaw_deg=0, pitch_deg=0):
    return py_api.set_view(yaw_deg, pitch_deg)

def say(text):
    return py_api.say(text)

def react(symbol):
    return py_api.react(symbol)

def emote(name):
    return py_api.emote(name)

def magic(type="snow", count=200, color="#ffffff", speed=1.0, size=0.12):
    return py_api.magic(type, count, color, speed, size)

def treasure_distance():
    return py_api.treasure_distance()

def treasure_hint(say=False):
    return py_api.treasure_hint(say)

def treasure_reset():
    return py_api.treasure_reset()

def tag_config(mode="chase", radius=120, speed=1.2, active=True):
    return py_api.tag_config(mode, radius, speed, active)

def npc_config(greeter=True, patrol=True, pet=True):
    return py_api.npc_config(greeter, patrol, pet)

def status():
    return py_api.status()

def help():
    return """MIRAKURU-VERSE Python API
move(forward=0, right=0, up=0)
turn(deg)
look(yaw_deg=0, pitch_deg=0)
set_view(yaw_deg=0, pitch_deg=0)
say(text)
react(symbol)
emote(name)
magic(type="snow", count=200, color="#ffffff", speed=1.0, size=0.12)
treasure_distance()
treasure_hint(say=False)
treasure_reset()
tag_config(mode="chase", radius=120, speed=1.2, active=True)
npc_config(greeter=True, patrol=True, pet=True)
status()
"""
`;
        try {
            this.pyodide.runPython(bootstrap);
            this.pyApiReady = true;
            return true;
        } catch (err) {
            this.appendPyOutput(String(err));
            return false;
        }
    }

    async runPythonCode() {
        if (!this.pyodide) {
            this.appendPyOutput('Pyodide not ready.');
            return;
        }
        if (!this.pyApiReady && !this.setupPythonApi()) {
            this.appendPyOutput('Python API not ready.');
            return;
        }
        const code = this.ui.pyCode ? this.ui.pyCode.value : '';
        if (!code.trim()) return;
        try {
            const result = await this.pyodide.runPythonAsync(code);
            if (result !== undefined) this.appendPyOutput(String(result));
        } catch (err) {
            this.appendPyOutput(String(err));
        }
    }

    appendPyOutput(text) {
        if (!this.ui.pyOutput || !text) return;
        const current = this.ui.pyOutput.textContent;
        this.ui.pyOutput.textContent = current ? `${current}\n${text}` : text;
        this.ui.pyOutput.scrollTop = this.ui.pyOutput.scrollHeight;
    }

    setPyStatus(text) {
        if (this.ui.pyStatus) this.ui.pyStatus.textContent = text;
    }

    systemSay(text, broadcast = false) {
        if (!this.myAvatar) return;
        const message = String(text ?? '').trim();
        if (!message) return;
        this.showChatBubble(this.myAvatar, message);
        if (broadcast) this.network.send({ type: 'chat', text: message });
    }

    sendReaction(symbol) {
        if (!symbol || !this.myAvatar) return;
        this.showChatBubble(this.myAvatar, symbol, { variant: 'symbol' });
        this.network.send({ type: 'reaction', symbol: symbol });
    }

    sendEmote(type) {
        if (!this.myAvatar) return;
        this.playEmote(this.myAvatar, type);
        this.network.send({ type: 'emote', emote: type });
    }

    insertMention(name) {
        if (!name || !this.ui.chatInput) return;
        const input = this.ui.chatInput;
        const cursor = input.selectionStart ?? input.value.length;
        const mentionText = `@${name} `;
        input.value = `${input.value.slice(0, cursor)}${mentionText}${input.value.slice(cursor)}`;
        input.focus();
        const nextPos = cursor + mentionText.length;
        input.setSelectionRange(nextPos, nextPos);
    }

    refreshMentionList() {
        const list = this.ui.mentionList;
        if (!list) return;
        list.innerHTML = '';
        const candidates = [];
        if (this.myName) candidates.push(this.myName);
        Object.values(this.remotePlayers).forEach((player) => {
            if (player.name) candidates.push(player.name);
        });
        if (this.tagBot && this.tagBot.active) candidates.push(this.tagBot.name);
        if (this.npcManager) this.npcManager.getNames().forEach((name) => candidates.push(name));
        const seen = new Set();
        candidates.forEach((name) => {
            const key = normalizeName(name);
            if (seen.has(key)) return;
            seen.add(key);
            const button = document.createElement('button');
            button.className = 'mention-btn';
            button.dataset.mention = name;
            button.textContent = `@${name}`;
            list.appendChild(button);
        });
        if (!list.childElementCount) {
            const empty = document.createElement('span');
            empty.className = 'tool-label';
            empty.textContent = '接続ユーザなし';
            list.appendChild(empty);
        }
    }

    extractMentions(text) {
        const mentions = [];
        const regex = /@([^\s@]+)/g;
        for (const match of text.matchAll(regex)) {
            const mention = match[1].slice(0, NAME_LIMIT);
            if (mention) mentions.push(normalizeName(mention));
        }
        return mentions;
    }

    applyMentions(text, senderMesh) {
        if (!text || !senderMesh) return;
        const mentionKeys = this.extractMentions(text);
        if (!mentionKeys.length) return;
        const unique = new Set(mentionKeys);
        unique.forEach((key) => {
            if (this.myNameKey && this.myNameKey === key && this.myAvatar) {
                this.pointAvatarTo(this.myAvatar, senderMesh);
            }
            Object.values(this.remotePlayers).forEach((player) => {
                if (player.nameKey === key) this.pointAvatarTo(player.mesh, senderMesh);
            });
            if (this.tagBot && this.tagBot.active && this.tagBot.nameKey === key) {
                this.pointAvatarTo(this.tagBot.mesh, senderMesh);
            }
            if (this.npcManager) {
                this.npcManager.getActiveNpcs().forEach((npc) => {
                    if (npc.nameKey === key) this.pointAvatarTo(npc.mesh, senderMesh);
                });
            }
        });
    }

    pointAvatarTo(targetMesh, sourceMesh) {
        if (!targetMesh || !sourceMesh || targetMesh === sourceMesh) return;
        const direction = new THREE.Vector3().subVectors(sourceMesh.position, targetMesh.position);
        const yaw = Math.atan2(direction.x, direction.z);
        targetMesh.userData.mention = { yaw: yaw, until: Date.now() + CONFIG.mention.duration };
        if (targetMesh.userData.playerId === MY_ID) {
            targetMesh.rotation.y = yaw;
            this.network.broadcastMove(targetMesh.position, targetMesh.rotation, true);
        }
    }

    attachNameTag(mesh, name, isMe) {
        const layer = document.getElementById('name-tags-layer');
        const tag = document.createElement('div');
        tag.className = `name-tag${isMe ? ' me' : ''}`;
        tag.textContent = name || 'GUEST';
        layer.appendChild(tag);
        mesh.userData.nameTag = tag;
    }

    updatePlayerName(player, name) {
        if (!player || !name) return;
        if (player.name === name) return;
        player.name = name;
        player.nameKey = normalizeName(name);
        if (player.mesh.userData.nameTag) {
            player.mesh.userData.nameTag.textContent = name;
        } else {
            this.attachNameTag(player.mesh, name, false);
        }
        this.refreshMentionList();
    }

    removeRemotePlayer(id) {
        if (this.remotePlayers[id]) {
            const player = this.remotePlayers[id];
            this.scene.remove(player.mesh);
            if (player.mesh.userData.bubbles) {
                player.mesh.userData.bubbles.forEach(b => b.el.remove());
            }
            if (player.mesh.userData.nameTag) player.mesh.userData.nameTag.remove();
            delete this.remotePlayers[id];
            this.refreshMentionList();
        }
    }

    handleNetworkMessage(data) {
        if (data.type === 'leave') {
            this.removeRemotePlayer(data.id);
            return;
        }
        if (!this.remotePlayers[data.id]) {
            const color = CONFIG.avatarColors[data.colorIdx] || CONFIG.avatarColors[0];
            const mesh = this.createAvatarMesh(color);
            this.scene.add(mesh);
            mesh.userData.playerId = data.id;
            this.remotePlayers[data.id] = { id: data.id, mesh: mesh, targetPos: new THREE.Vector3(), targetRot: 0, name: '', nameKey: '' };
            this.attachNameTag(mesh, data.name || 'GUEST', false);

            if (data.type === 'join') {
                this.network.send({ type: 'move', x: this.myAvatar.position.x, y: this.myAvatar.position.y, z: this.myAvatar.position.z, ry: this.myAvatar.rotation.y, colorIdx: MY_COLOR_IDX });
            }
            this.refreshMentionList();
        }
        const player = this.remotePlayers[data.id];
        if (data.name) this.updatePlayerName(player, data.name);
        if (data.type === 'move') {
            player.targetPos.set(data.x, data.y, data.z);
            player.targetRot = data.ry;
        }
        if (data.type === 'chat') {
            this.showChatBubble(player.mesh, data.text);
            this.applyMentions(data.text, player.mesh);
            if (this.npcManager) this.npcManager.handleChat(data.text);
        }
        if (data.type === 'reaction') {
            this.showChatBubble(player.mesh, data.symbol, { variant: 'symbol' });
        }
        if (data.type === 'emote') {
            this.playEmote(player.mesh, data.emote);
        }
    }

    showChatBubble(avatarMesh, text, options = {}) {
        if (!avatarMesh) return;
        const layer = document.getElementById('bubbles-layer');
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        if (options.variant) bubble.classList.add(options.variant);
        bubble.textContent = text;
        layer.appendChild(bubble);

        if (!avatarMesh.userData.bubbles) avatarMesh.userData.bubbles = [];
        avatarMesh.userData.bubbles.push({ el: bubble, time: Date.now() });

        requestAnimationFrame(() => bubble.classList.add('show'));
        setTimeout(() => {
            bubble.style.opacity = 0;
            setTimeout(() => {
                bubble.remove();
                if (avatarMesh.userData.bubbles) avatarMesh.userData.bubbles = avatarMesh.userData.bubbles.filter(b => b.el !== bubble);
            }, 500);
        }, 5000);
    }

    projectToScreen(worldPos) {
        const pos = worldPos.clone();
        pos.project(this.camera);
        if (pos.z < -1 || pos.z > 1) return null;
        return {
            x: (pos.x * 0.5 + 0.5) * window.innerWidth,
            y: (-pos.y * 0.5 + 0.5) * window.innerHeight
        };
    }

    updateNameTags() {
        const updateForAvatar = (mesh) => {
            if (!mesh.userData.nameTag) return;
            const screenPos = this.projectToScreen(mesh.position.clone().add(new THREE.Vector3(0, 2.9, 0)));
            if (!screenPos) {
                mesh.userData.nameTag.style.display = 'none';
                return;
            }
            mesh.userData.nameTag.style.display = 'block';
            mesh.userData.nameTag.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px) translate(-50%, -150%)`;
        };
        if (this.myAvatar) updateForAvatar(this.myAvatar);
        Object.values(this.remotePlayers).forEach(p => updateForAvatar(p.mesh));
        if (this.tagBot && this.tagBot.active) updateForAvatar(this.tagBot.mesh);
        if (this.npcManager) this.npcManager.getMeshes().forEach(mesh => updateForAvatar(mesh));
    }

    updateChatBubbles() {
        const updateForAvatar = (mesh) => {
            if (!mesh.userData.bubbles || mesh.userData.bubbles.length === 0) return;
            const screenPos = this.projectToScreen(mesh.position.clone().add(new THREE.Vector3(0, 2.5, 0)));
            if (!screenPos) {
                mesh.userData.bubbles.forEach(b => b.el.style.display = 'none');
                return;
            }
            mesh.userData.bubbles.forEach(b => {
                b.el.style.display = 'block';
                b.el.style.transform = `translate(${screenPos.x}px, ${screenPos.y}px) translate(-50%, -100%)`;
            });
        };
        if (this.myAvatar) updateForAvatar(this.myAvatar);
        Object.values(this.remotePlayers).forEach(p => updateForAvatar(p.mesh));
        if (this.tagBot && this.tagBot.active) updateForAvatar(this.tagBot.mesh);
        if (this.npcManager) this.npcManager.getMeshes().forEach(mesh => updateForAvatar(mesh));
    }

    playEmote(mesh, type) {
        const emote = CONFIG.emotes[type];
        if (!mesh || !emote) return;
        const visual = mesh.userData.visual || mesh;
        mesh.userData.emote = {
            type: type,
            start: Date.now(),
            duration: emote.duration,
            baseRotY: visual.rotation.y,
            baseRotZ: visual.rotation.z,
            baseScale: visual.scale.x
        };
        this.showChatBubble(mesh, emote.icon, { variant: 'emote' });
    }

    applyEmote(mesh) {
        const emote = mesh.userData.emote;
        if (!emote) return;
        const visual = mesh.userData.visual || mesh;
        const progress = (Date.now() - emote.start) / emote.duration;
        if (progress >= 1) {
            visual.rotation.y = emote.baseRotY;
            visual.rotation.z = emote.baseRotZ;
            visual.scale.setScalar(emote.baseScale);
            delete mesh.userData.emote;
            return;
        }
        const pulse = Math.sin(progress * Math.PI);
        visual.scale.setScalar(emote.baseScale + pulse * 0.12);
        if (emote.type === 'spin') {
            visual.rotation.y = emote.baseRotY + progress * Math.PI * 2;
            visual.rotation.z = emote.baseRotZ;
        } else if (emote.type === 'wave') {
            visual.rotation.y = emote.baseRotY + Math.sin(progress * Math.PI * 4) * 0.35;
            visual.rotation.z = emote.baseRotZ;
        } else if (emote.type === 'cheer') {
            visual.rotation.y = emote.baseRotY;
            visual.rotation.z = emote.baseRotZ + Math.sin(progress * Math.PI * 4) * 0.2;
        } else {
            visual.rotation.y = emote.baseRotY;
            visual.rotation.z = emote.baseRotZ;
        }
    }

    applyMentionLook(mesh, allowOverride = true) {
        const mention = mesh.userData.mention;
        if (!mention) return false;
        if (Date.now() > mention.until) {
            delete mesh.userData.mention;
            return false;
        }
        if (allowOverride) {
            mesh.rotation.y = lerpAngle(mesh.rotation.y, mention.yaw, 0.2);
        }
        return true;
    }

    updateCamera() {
        const target = this.myAvatar.position.clone();
        target.y += 1.6;
        const yaw = this.myAvatar.rotation.y + Math.PI + this.view.yaw;
        const pitch = this.view.pitch;
        const horizontal = Math.cos(pitch) * CONFIG.camera.distance;
        const offset = new THREE.Vector3(
            Math.sin(yaw) * horizontal,
            CONFIG.camera.height + Math.sin(pitch) * CONFIG.camera.distance,
            Math.cos(yaw) * horizontal
        );
        const desired = this.myAvatar.position.clone().add(offset);
        this.camera.position.lerp(desired, 0.1);
        this.camera.lookAt(target);
    }

    animate() {
        if (!this.isGameActive) return;
        requestAnimationFrame(() => this.animate());
        const delta = this.clock ? this.clock.getDelta() : 0.016;

        if (this.magicSystem) this.magicSystem.update(delta);

        if (this.myAvatar) {
            const speed = CONFIG.movement.speed;
            const rotSpeed = CONFIG.movement.rotSpeed;
            const verticalSpeed = CONFIG.movement.verticalSpeed;
            let moved = false;
            const rotating = this.keys['KeyA'] || this.keys['ArrowLeft'] || this.keys['KeyD'] || this.keys['ArrowRight'];
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) { this.myAvatar.rotation.y += rotSpeed; moved = true; }
            if (this.keys['KeyD'] || this.keys['ArrowRight']) { this.myAvatar.rotation.y -= rotSpeed; moved = true; }
            if (this.keys['KeyW'] || this.keys['ArrowUp']) { this.myAvatar.position.x += Math.sin(this.myAvatar.rotation.y) * speed; this.myAvatar.position.z += Math.cos(this.myAvatar.rotation.y) * speed; moved = true; }
            if (this.keys['KeyS'] || this.keys['ArrowDown']) { this.myAvatar.position.x -= Math.sin(this.myAvatar.rotation.y) * speed; this.myAvatar.position.z -= Math.cos(this.myAvatar.rotation.y) * speed; moved = true; }
            if (this.keys['Space']) { this.myAvatar.position.y += verticalSpeed; moved = true; }
            if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) { this.myAvatar.position.y -= verticalSpeed; moved = true; }

            this.applyMentionLook(this.myAvatar, !rotating);
            if (this.myAvatar.userData.visual) {
                this.myAvatar.userData.visual.position.y = Math.sin(Date.now() * 0.005) * 0.04;
            }
            this.applyEmote(this.myAvatar);
            this.updateCamera();
            if (moved) this.network.broadcastMove(this.myAvatar.position, this.myAvatar.rotation);
        }

        if (this.tagBot) this.tagBot.update(delta);
        if (this.npcManager) this.npcManager.update(delta);
        if (this.treasureSystem) this.treasureSystem.update(delta);
        if (this.tagBot && this.tagBot.active) this.applyMentionLook(this.tagBot.mesh, true);
        if (this.npcManager) this.npcManager.getMeshes().forEach(mesh => this.applyMentionLook(mesh, true));

        Object.values(this.remotePlayers).forEach(p => {
            p.mesh.position.lerp(p.targetPos, 0.1);
            const mentionActive = this.applyMentionLook(p.mesh, false);
            const targetYaw = mentionActive ? p.mesh.userData.mention.yaw : p.targetRot;
            p.mesh.rotation.y = lerpAngle(p.mesh.rotation.y, targetYaw, 0.12);
            if (p.mesh.userData.visual) {
                p.mesh.userData.visual.position.y = Math.sin(Date.now() * 0.005) * 0.05;
            }
            this.applyEmote(p.mesh);
        });

        this.updateChatBubbles();
        this.updateNameTags();
        if (this.floatingTitle && this.floatingTitle.userData.float) {
            const float = this.floatingTitle.userData.float;
            this.floatingTitle.position.y = float.baseY + Math.sin(Date.now() * float.speed) * float.amplitude;
        }
        this.renderer.render(this.scene, this.camera);
    }
}

new MirakuruVerse();
