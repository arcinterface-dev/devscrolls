import {
  PROCESS_NAMES,
  INITIAL_SERVERS_COUNT,
  MAX_SERVERS_COUNT,
  SCALE_UP_DURATION_S,
  SCALE_UP_COOLDOWN_S,
  REBOOT_DURATION_S,
  CACHE_FLUSH_RAM_REDUCTION,
  CACHE_FLUSH_CPU_PENALTY,
} from './constants';

export interface ProcessState {
  pid: number;
  name: string;
  ramUsage: number;
  isZombie: boolean;
  isLeaking: boolean;
  leakRate: number;
}

export interface ServerState {
  id: number;
  name: string;
  cpu: number;
  ram: number;
  disk: number;
  temp: number;
  processes: ProcessState[];
  isOnline: boolean;
  rebootTimer: number;
  isTemporary?: boolean;
  tempTimeLeft?: number;
}

export interface SimEvent {
  id: string;
  time: string;
  text: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface SimState {
  servers: ServerState[];
  tick: number;
  uptime: number; // in seconds
  requestsServed: number;
  processesKilled: number;
  currentRps: number;
  peakRps: number;
  scaleUpCooldown: number;
  events: SimEvent[];
  isGameOver: boolean;
  difficulty: number;
}

export type PlayerAction =
  | { type: 'KILL_PROCESS'; serverId: number; pid: number }
  | { type: 'REBOOT_NODE'; serverId: number }
  | { type: 'FLUSH_CACHE'; serverId: number }
  | { type: 'SCALE_UP' };

export class SimulationEngine {
  private state: SimState;
  private nextPid: number = 101;
  private nextEventId: number = 1;
  private prngState: number;

  constructor(seed: number = Date.now()) {
    this.prngState = seed;
    this.state = this.createInitialState();
  }

  private random(): number {
    // Lightweight fast xorshift32 PRNG
    let x = this.prngState;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.prngState = x;
    return (x >>> 0) / 4294967296;
  }

  private randomRange(min: number, max: number): number {
    return min + this.random() * (max - min);
  }

  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(this.random() * arr.length)];
  }

  private createInitialState(): SimState {
    const servers: ServerState[] = [];
    for (let i = 1; i <= INITIAL_SERVERS_COUNT; i++) {
      servers.push(this.createNode(i, false));
    }

    return {
      servers,
      tick: 0,
      uptime: 0,
      requestsServed: 0,
      processesKilled: 0,
      currentRps: 180,
      peakRps: 180,
      scaleUpCooldown: 0,
      events: [
        {
          id: 'ev-0',
          time: '00:00',
          text: 'Cluster initialized. 3 worker nodes healthy in us-east-1.',
          level: 'info',
        },
      ],
      isGameOver: false,
      difficulty: 1.0,
    };
  }

  private createNode(id: number, isTemporary: boolean = false): ServerState {
    const processes: ProcessState[] = [];
    const count = 3;
    let totalRam = 0;

    for (let i = 0; i < count; i++) {
      const ram = Math.round(this.randomRange(6, 14));
      totalRam += ram;
      processes.push({
        pid: this.nextPid++,
        name: this.pickRandom(PROCESS_NAMES),
        ramUsage: ram,
        isZombie: false,
        isLeaking: false,
        leakRate: 0,
      });
    }

    return {
      id,
      name: `node-0${id}.${isTemporary ? 'spot-burst' : 'us-east'}`,
      cpu: Math.round(this.randomRange(20, 35)),
      ram: totalRam + 10, // OS baseline RAM
      disk: Math.round(this.randomRange(25, 45)),
      temp: 35,
      processes,
      isOnline: true,
      rebootTimer: 0,
      isTemporary,
      tempTimeLeft: isTemporary ? SCALE_UP_DURATION_S : 0,
    };
  }

  public getState(): SimState {
    return this.state;
  }

  public addEvent(text: string, level: SimEvent['level']): void {
    const mm = Math.floor(this.state.uptime / 60).toString().padStart(2, '0');
    const ss = (this.state.uptime % 60).toString().padStart(2, '0');
    const newEvent: SimEvent = {
      id: `ev-${this.nextEventId++}`,
      time: `${mm}:${ss}`,
      text,
      level,
    };

    this.state.events = [newEvent, ...this.state.events.slice(0, 39)];
  }

  public applyAction(action: PlayerAction): void {
    if (this.state.isGameOver) return;

    switch (action.type) {
      case 'KILL_PROCESS': {
        const server = this.state.servers.find((s) => s.id === action.serverId);
        if (!server || !server.isOnline) return;

        const pIndex = server.processes.findIndex((p) => p.pid === action.pid);
        if (pIndex !== -1) {
          const p = server.processes[pIndex];
          server.ram = Math.max(10, server.ram - p.ramUsage);
          server.processes.splice(pIndex, 1);
          this.state.processesKilled += 1;
          this.addEvent(`SIGKILL executed on PID ${p.pid} (${p.name}) on ${server.name}. Freed ${p.ramUsage}% RAM.`, 'success');
        }
        break;
      }

      case 'REBOOT_NODE': {
        const server = this.state.servers.find((s) => s.id === action.serverId);
        if (!server || !server.isOnline) return;

        server.isOnline = false;
        server.rebootTimer = REBOOT_DURATION_S;
        server.cpu = 0;
        server.ram = 10;
        server.processes = [];
        this.addEvent(`Initiated hard reboot on ${server.name}. Traffic failing over to peers.`, 'warn');
        break;
      }

      case 'FLUSH_CACHE': {
        const server = this.state.servers.find((s) => s.id === action.serverId);
        if (!server || !server.isOnline) return;

        const ramFreed = Math.min(server.ram - 12, CACHE_FLUSH_RAM_REDUCTION);
        server.ram = Math.max(12, server.ram - ramFreed);
        server.cpu = Math.min(100, server.cpu + CACHE_FLUSH_CPU_PENALTY);
        this.addEvent(`Cache flushed on ${server.name}. -${ramFreed}% RAM, +${CACHE_FLUSH_CPU_PENALTY}% CPU load.`, 'info');
        break;
      }

      case 'SCALE_UP': {
        if (this.state.scaleUpCooldown > 0) return;
        if (this.state.servers.length >= MAX_SERVERS_COUNT) return;

        const nextId = this.state.servers.length + 1;
        const newServer = this.createNode(nextId, true);
        this.state.servers.push(newServer);
        this.state.scaleUpCooldown = SCALE_UP_COOLDOWN_S;
        this.addEvent(`Auto-scaled temporary node ${newServer.name} (TTL: ${SCALE_UP_DURATION_S}s). Traffic rebalanced.`, 'success');
        break;
      }
    }
  }

  public tick(): SimState {
    if (this.state.isGameOver) return this.state;

    this.state.tick += 1;

    // Simulation ticks every 500ms -> 2 ticks = 1 second
    if (this.state.tick % 2 === 0) {
      this.state.uptime += 1;

      // Difficulty ramp every 30 seconds
      if (this.state.uptime % 30 === 0) {
        this.state.difficulty += 0.15;
        this.addEvent(`Traffic pressure elevated! Difficulty multiplier at x${this.state.difficulty.toFixed(1)}.`, 'warn');
      }

      // Decrement scale-up cooldown
      if (this.state.scaleUpCooldown > 0) {
        this.state.scaleUpCooldown -= 1;
      }
    }

    // Active online servers
    const onlineServers = this.state.servers.filter((s) => s.isOnline);

    // Check game over condition: ALL servers dead or at 100% RAM
    if (
      onlineServers.length === 0 ||
      this.state.servers.every((s) => !s.isOnline || s.ram >= 100 || s.cpu >= 100)
    ) {
      this.state.isGameOver = true;
      this.addEvent('🚨 CRITICAL OUTAGE: All servers exhausted RAM/CPU. Cascading cluster blackout!', 'error');
      return this.state;
    }

    // Calculate traffic
    const baseRps = Math.round((160 + this.state.uptime * 3.5) * this.state.difficulty);
    // Random fluctuation
    const fluctuation = this.randomRange(-20, 20);
    this.state.currentRps = Math.max(50, Math.round(baseRps + fluctuation));
    if (this.state.currentRps > this.state.peakRps) {
      this.state.peakRps = this.state.currentRps;
    }
    this.state.requestsServed += Math.round(this.state.currentRps / 2);

    // Distribute traffic across online servers
    const rpsPerServer = this.state.currentRps / Math.max(1, onlineServers.length);

    // Update each server
    this.state.servers.forEach((server) => {
      // Handle reboot countdown
      if (!server.isOnline) {
        if (server.rebootTimer > 0) {
          server.rebootTimer -= 0.5;
          if (server.rebootTimer <= 0) {
            server.isOnline = true;
            server.cpu = 20;
            server.ram = 15;
            server.temp = 32;
            // Spawn 2 clean default processes
            server.processes = [
              { pid: this.nextPid++, name: 'api-worker', ramUsage: 8, isZombie: false, isLeaking: false, leakRate: 0 },
              { pid: this.nextPid++, name: 'db-conn-pool', ramUsage: 10, isZombie: false, isLeaking: false, leakRate: 0 },
            ];
            this.addEvent(`Node ${server.name} reboot completed and healthy. Resumed request ingestion.`, 'success');
          }
        }
        return;
      }

      // Handle temporary scale-up node expiration
      if (server.isTemporary && server.tempTimeLeft !== undefined) {
        server.tempTimeLeft -= 0.5;
        if (server.tempTimeLeft <= 0) {
          server.isOnline = false;
          this.addEvent(`Spot instance ${server.name} reached max lease time and decommissioned.`, 'info');
          // Remove from list after short delay
          this.state.servers = this.state.servers.filter((s) => s.id !== server.id);
          return;
        }
      }

      // Compute CPU load from traffic
      const targetCpu = Math.min(100, Math.round((rpsPerServer / 120) * 55 + this.randomRange(-5, 8)));
      server.cpu = Math.round(server.cpu * 0.7 + targetCpu * 0.3);

      // Process updates
      let calculatedProcessRam = 0;
      server.processes.forEach((proc) => {
        // Leaking process increases RAM
        if (proc.isLeaking) {
          proc.ramUsage = Math.min(80, proc.ramUsage + proc.leakRate);
        }
        calculatedProcessRam += proc.ramUsage;
      });

      // Passive RAM creep (kernel buffers + socket pools)
      server.ram = Math.min(100, Math.round(12 + calculatedProcessRam));

      // Thermal calculations
      const targetTemp = Math.round(30 + (server.cpu * 0.4) + (server.ram * 0.3));
      server.temp = Math.round(server.temp * 0.8 + targetTemp * 0.2);

      // Random chance for a process to become zombie
      if (this.random() < 0.04 * this.state.difficulty) {
        const eligible = server.processes.filter((p) => !p.isZombie && !p.isLeaking);
        if (eligible.length > 0) {
          const target = this.pickRandom(eligible);
          target.isZombie = true;
          this.addEvent(`Zombie thread detected: ${target.name} (PID ${target.pid}) on ${server.name}. Non-responsive.`, 'warn');
        }
      }

      // Random chance for spawn new background worker if process count low
      if (server.processes.length < 5 && this.random() < 0.08) {
        const pRam = Math.round(this.randomRange(6, 12));
        server.processes.push({
          pid: this.nextPid++,
          name: this.pickRandom(PROCESS_NAMES),
          ramUsage: pRam,
          isZombie: false,
          isLeaking: false,
          leakRate: 0,
        });
      }
    });

    // Random Global Events (every 12-25 seconds)
    if (this.state.tick > 10 && this.random() < 0.035 * this.state.difficulty) {
      this.triggerRandomEvent();
    }

    return this.state;
  }

  private triggerRandomEvent(): void {
    const roll = this.random();
    const online = this.state.servers.filter((s) => s.isOnline);
    if (online.length === 0) return;

    if (roll < 0.5) {
      // Memory Leak Incident
      const server = this.pickRandom(online);
      if (server.processes.length > 0) {
        const proc = this.pickRandom(server.processes);
        if (!proc.isLeaking) {
          proc.isLeaking = true;
          proc.leakRate = Number(this.randomRange(1.8, 3.5).toFixed(1));
          this.addEvent(`⚠️ MEMORY LEAK: ${proc.name} (PID ${proc.pid}) on ${server.name} leaking +${proc.leakRate}%/tick! Kill it fast!`, 'error');
        }
      }
    } else if (roll < 0.8) {
      // Traffic Surge
      this.state.currentRps = Math.round(this.state.currentRps * 2.2);
      this.addEvent('🚨 TRAFFIC SPIKE: Upstream ingress surge (+120% RPS)! CPU utilization spiking across all nodes.', 'warn');
    } else {
      // Garbage Collection Stall
      const server = this.pickRandom(online);
      server.cpu = Math.min(100, server.cpu + 25);
      this.addEvent(`⚠️ JVM/V8 Major GC Pause on ${server.name}: STW event frozen worker threads for 400ms.`, 'warn');
    }
  }
}
