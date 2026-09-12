import {
    tsParticles,
    type Container,
    type IDelta,
    type ICoordinates,
    type Particle,
} from "@tsparticles/engine";

import { decayExcessSpeed, getViewportEdges, isComet } from "./utils";
import { COMET_PALETTE } from "./constants";
import type { CometDirection, SizeRange, SpeedRange } from "./types";

// ---------------------------------------------------------------------------
// CometManager
// ---------------------------------------------------------------------------

export class CometManager {
    private readonly particles: Particle[] = [];
    private readonly returnTargets = new WeakMap<Particle, ICoordinates>();
    private spawnerStarted = false;

    // --- Return-target API (consumed by ProjectRepulseInteractor in projects.ts) ---

    setReturnTarget(particle: Particle, target: ICoordinates): void {
        this.returnTargets.set(particle, target);
    }

    getReturnTarget(particle: Particle): ICoordinates | undefined {
        return this.returnTargets.get(particle);
    }

    deleteReturnTarget(particle: Particle): void {
        this.returnTargets.delete(particle);
    }

    hasReturnTarget(particle: Particle): boolean {
        return this.returnTargets.has(particle);
    }

    // --- Spawning ---

    add(
        container: Container,
        x: number,
        y: number,
        direction: CometDirection,
        speed: SpeedRange,
        size: SizeRange = { min: 1.5, max: 3.5 },
    ): void {
        const color = COMET_PALETTE[Math.floor(Math.random() * COMET_PALETTE.length)];

        const p = container.particles.addParticle({ x, y }, {
            shape: { type: "circle" },
            color: { value: color },
            size: { value: size },
            opacity: { value: { min: 0.7, max: 1 } },
            move: {
                enable: true,
                direction: direction as never,
                speed,
                straight: true,
                outModes: { default: "destroy" },
            },
            links: { enable: false },
            twinkle: { particles: { enable: false } },
        });

        if (p) {
            this.particles.push(p as unknown as Particle);
        }
    }

    sweep(container: Container): void {
        if (this.particles.length === 0) return;

        const edges = getViewportEdges(container);
        if (!edges) return;

        const { toX, toY } = edges;
        const minX = toX(-10);
        const maxX = toX(window.innerWidth + 10);
        const minY = toY(-10);
        const maxY = toY(window.innerHeight + 10);

        let i = this.particles.length;

        while (i--) {
            const p = this.particles[i];
            const { x, y } = p.position;

            if (x < minX || x > maxX || y < minY || y > maxY) {
                container.particles.remove(p);
                p.destroy();
                this.particles.splice(i, 1);
            }
        }
    }

    spawnSingle(container: Container): void {
        const edges = getViewportEdges(container);
        if (!edges) return;

        const { toX, toY } = edges;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const side = Math.floor(Math.random() * 3);

        if (side === 0) {
            this.add(container, toX(-5), toY(Math.random() * vh), "right", { min: 7, max: 11 }, { min: 1.5, max: 3 });
        } else if (side === 1) {
            this.add(container, toX(vw + 5), toY(Math.random() * vh), "left", { min: 8, max: 12 }, { min: 1.5, max: 3 });
        } else {
            const dir: CometDirection = Math.random() > 0.5 ? "bottom-right" : "bottom";
            this.add(container, toX(Math.random() * vw), toY(-5), dir, { min: 6, max: 9 }, { min: 1, max: 2.5 });
        }
    }

    // Logo-hover burst: 6 comets from all viewport edges at once.
    spawnBurst(container: Container): void {
        const edges = getViewportEdges(container);
        if (!edges) return;

        const { toX, toY } = edges;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        this.add(container, toX(-5), toY(vh * (0.15 + Math.random() * 0.3)), "right", { min: 8, max: 13 });
        this.add(container, toX(vw + 5), toY(vh * (0.15 + Math.random() * 0.3)), "left", { min: 9, max: 14 });
        this.add(container, toX(vw * (0.1 + Math.random() * 0.2)), toY(-5), "bottom-right", { min: 7, max: 11 });
        this.add(container, toX(-5), toY(vh * (0.50 + Math.random() * 0.2)), "right", { min: 7, max: 12 });
        this.add(container, toX(vw * (0.3 + Math.random() * 0.2)), toY(-5), "bottom", { min: 6, max: 10 });
        this.add(container, toX(vw + 5), toY(vh * (0.55 + Math.random() * 0.2)), "left", { min: 8, max: 12 });
    }

    // Uses setInterval instead of tsParticles emitters so it survives page transitions.
    startSpawner(container: Container): void {
        if (this.spawnerStarted) return;
        this.spawnerStarted = true;
        setInterval(() => this.spawnSingle(container), 1700);
        setInterval(() => this.sweep(container), 200);
    }
}

// ---------------------------------------------------------------------------
// CometReturnUpdater
// ---------------------------------------------------------------------------

class CometReturnUpdater {
    private readonly pullPixelsPerFrame = 0.00045;
    private readonly arriveDistance = 24;

    constructor(private readonly manager: CometManager) { }

    init(): void { }

    isEnabled(particle: Particle): boolean {
        return this.manager.hasReturnTarget(particle) && !particle.destroyed;
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) return;

        decayExcessSpeed(particle, delta);

        const target = this.manager.getReturnTarget(particle);
        if (!target) return;

        const dx = target.x - particle.position.x;
        const dy = target.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.arriveDistance) {
            this.manager.deleteReturnTarget(particle);
            return;
        }

        const nx = dx / distance;
        const ny = dy / distance;
        const moveSpeed = particle.retina.moveSpeed || 1;

        particle.velocity.x += (nx * this.pullPixelsPerFrame * distance * delta.factor) / moveSpeed;
        particle.velocity.y += (ny * this.pullPixelsPerFrame * distance * delta.factor) / moveSpeed;
    }
}

// ---------------------------------------------------------------------------
// CometTrailUpdater
// ---------------------------------------------------------------------------

// Trail dots are spawned as separate particles in the "comet-trail" group.
// We do it manually (rather than @tsparticles/plugin-trail) so the fade
// effect only applies to comets, not to the entire canvas.
const trailTimers = new WeakMap<Particle, number>();

class CometTrailUpdater {
    private readonly spawnIntervalMs = 15;
    private readonly trailDuration = 0.55;

    constructor(private readonly container: Container) { }

    init(): void { }

    isEnabled(particle: Particle): boolean {
        return isComet(particle) && !particle.destroyed && !particle.spawning;
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) return;

        const elapsed = (trailTimers.get(particle) ?? 0) + delta.value;

        if (elapsed < this.spawnIntervalMs) {
            trailTimers.set(particle, elapsed);
            return;
        }

        trailTimers.set(particle, 0);

        const cometSize = (particle.size as { value?: number })?.value ?? 3;
        const cometColor = (particle.options.color as { value?: unknown })?.value ?? "#ffffff";

        this.container.particles.addParticle(
            { x: particle.position.x, y: particle.position.y },
            {
                shape: { type: "circle" },
                move: { enable: false },
                color: { value: cometColor },

                // Without this, trail dots inherit links from the base config and
                // connect to each other — rendering as a solid ray instead of dots.
                links: { enable: false },

                twinkle: { particles: { enable: false } },

                size: {
                    value: { min: 0, max: cometSize * 0.6 },
                    animation: {
                        enable: true,
                        speed: 4,
                        sync: false,
                        startValue: "max",
                        destroy: "min",
                    },
                },

                opacity: {
                    value: { min: 0, max: 0.85 },
                    animation: {
                        enable: true,
                        speed: 3,
                        sync: false,
                        startValue: "max",
                        destroy: "min",
                    },
                },

                life: {
                    count: 1,
                    duration: { value: this.trailDuration },
                },
            },
        );
    }
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

export const loadCometPlugins = async (manager: CometManager): Promise<void> => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addParticleUpdater) {
            console.error("[comet] addParticleUpdater not available");
            return;
        }

        engine.pluginManager.addParticleUpdater(
            "comet-return",
            () => Promise.resolve(new CometReturnUpdater(manager)),
        );

        engine.pluginManager.addParticleUpdater(
            "comet-trail",
            (container: Container) => Promise.resolve(new CometTrailUpdater(container)),
        );
    });
};
