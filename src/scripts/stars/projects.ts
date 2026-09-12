import {
    tsParticles,
    getPosition,
    type Container,
    type IDelta,
    type Particle,
} from "@tsparticles/engine";

import {
    ExternalInteractorBase,
    loadInteractivityPlugin,
    type IInteractivityData,
} from "@tsparticles/plugin-interactivity";

import { MIN_SPACING_PCT, PROJECT_HIT_RADIUS, PROJECT_STAR_SIZE, STAR_ZONE } from "./constants";
import type { ProjectData } from "./types";
import type { CometManager } from "./comets";

// ---------------------------------------------------------------------------
// ProjectManager
// ---------------------------------------------------------------------------

export class ProjectManager {
    private projects: ProjectData[] = [];
    private initialized = false;

    get all(): readonly ProjectData[] {
        return this.projects;
    }

    get isInitialized(): boolean {
        return this.initialized;
    }

    tryInit(container: Container): void {
        if (this.initialized) return;

        const raw = this.loadRaw();
        if (raw.length === 0) return;

        const positions = this.generatePositions(raw.length);

        this.projects = raw.map((p, i) => ({
            ...p,
            x: positions[i].x,
            y: positions[i].y,
        }));

        this.addParticles(container);
        this.setupInteraction(container);
        this.initialized = true;
    }

    findAtPoint(
        pointer: { x: number; y: number },
        canvasSize: { width: number; height: number },
    ): ProjectData | undefined {
        let closest: ProjectData | undefined;
        let closestDistance = Infinity;

        for (const project of this.projects) {
            const px = (project.x / 100) * canvasSize.width;
            const py = (project.y / 100) * canvasSize.height;
            const dx = pointer.x - px;
            const dy = pointer.y - py;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= PROJECT_HIT_RADIUS && distance < closestDistance) {
                closest = project;
                closestDistance = distance;
            }
        }

        return closest;
    }

    // index.astro injects a <script type="application/json" id="star-projects"> at build time.
    private loadRaw(): Omit<ProjectData, "x" | "y">[] {
        const el = document.getElementById("star-projects");

        if (!el) return [];

        try {
            return JSON.parse(el.textContent ?? "[]");
        } catch {
            console.error("[stars] Could not parse #star-projects JSON");
            return [];
        }
    }

    // Rejection sampling: up to 50 attempts per star, falls back to last candidate so init never blocks.
    private generatePositions(count: number): { x: number; y: number }[] {
        const placed: { x: number; y: number }[] = [];
        const { xMin, xMax, yMin, yMax } = STAR_ZONE;

        for (let i = 0; i < count; i++) {
            let candidate = {
                x: xMin + Math.random() * (xMax - xMin),
                y: yMin + Math.random() * (yMax - yMin),
            };

            for (let attempt = 0; attempt < 50; attempt++) {
                const c = {
                    x: xMin + Math.random() * (xMax - xMin),
                    y: yMin + Math.random() * (yMax - yMin),
                };

                const tooClose = placed.some((p) => {
                    const dx = c.x - p.x;
                    const dy = c.y - p.y;
                    return Math.sqrt(dx * dx + dy * dy) < MIN_SPACING_PCT;
                });

                if (!tooClose) {
                    candidate = c;
                    break;
                }
            }

            placed.push(candidate);
        }

        return placed;
    }

    // Project particles are added imperatively after tsParticles.load() in their own
    // "projects" group with density.enable: false, so setDensity() (called on every resize)
    // never purges them. Declaring them as manualParticles would put them in index 0
    // of the default group and they'd be the first to be removed on density recalculation.
    private addParticles(container: Container): void {
        for (const project of this.projects) {
            container.particles.addParticle(
                getPosition(
                    { x: project.x, y: project.y, mode: "percent" },
                    container.canvas.size,
                ),
                this.particleOptions(),
                "projects",
            );
        }
    }

    private particleOptions() {
        return {
            shape: { type: "sparkle" },
            size: { value: PROJECT_STAR_SIZE },
            color: { value: "#ffffff" },
            opacity: { value: 1 },
            stroke: { width: 1, color: "#ffffff", opacity: 0.4 },
            move: { enable: false },
            twinkle: {
                particles: { enable: true, frequency: 0.04, opacity: 0.9 },
            },
            links: {
                enable: true,
                distance: 145,
                opacity: 0.35,
                width: 0.8,
                color: "#a78bfa",
            },
        };
    }

    // canvas.size uses retina (physical) pixels; clientX/Y are CSS pixels.
    // getBoundingClientRect() converts between them so hit detection is correct on HiDPI screens.
    private setupInteraction(container: Container): void {
        const canvasElement = container.canvas.domElement;

        if (!canvasElement) {
            console.warn("[projects] <canvas> not found; project interaction disabled");
            return;
        }

        const toCanvasPoint = (clientX: number, clientY: number) => {
            const rect = canvasElement.getBoundingClientRect();
            const canvasSize = container.canvas.size;

            return {
                x: ((clientX - rect.left) / rect.width) * canvasSize.width,
                y: ((clientY - rect.top) / rect.height) * canvasSize.height,
            };
        };

        let lastHoveredId: string | undefined;

        window.addEventListener("mousemove", (event) => {
            const point = toCanvasPoint(event.clientX, event.clientY);
            const project = this.findAtPoint(point, container.canvas.size);

            if (project) {
                canvasElement.style.cursor = "pointer";

                if (project.id !== lastHoveredId) {
                    lastHoveredId = project.id;

                    // Anchor card to the star position (canvas %), not to the cursor.
                    const rect = canvasElement.getBoundingClientRect();
                    const cssX = rect.left + (project.x / 100) * rect.width;
                    const cssY = rect.top + (project.y / 100) * rect.height;

                    window.dispatchEvent(
                        new CustomEvent("project-hover", {
                            detail: { project, cssX, cssY },
                        }),
                    );
                }
            } else {
                canvasElement.style.cursor = "";

                if (lastHoveredId !== undefined) {
                    lastHoveredId = undefined;
                    window.dispatchEvent(new CustomEvent("project-hover-end"));
                }
            }
        });

        window.addEventListener("click", (event) => {
            const point = toCanvasPoint(event.clientX, event.clientY);
            const project = this.findAtPoint(point, container.canvas.size);

            if (!project) return;

            window.dispatchEvent(
                new CustomEvent("project-click", {
                    detail: { id: project.id, title: project.title },
                }),
            );
        });
    }
}

// ---------------------------------------------------------------------------
// ProjectOrbitUpdater
// ---------------------------------------------------------------------------

const orbitHomePositions = new WeakMap<Particle, { x: number; y: number }>();

class ProjectOrbitUpdater {
    private readonly maxOrbitRadius = 14;
    private readonly springStrength = 0.006;
    private readonly jitterStrength = 0.05;
    private readonly damping = 0.92;

    constructor(private readonly container: Container) {}

    init(particle: Particle): void {
        if (particle.group !== "projects") return;

        orbitHomePositions.set(particle, {
            x: particle.position.x,
            y: particle.position.y,
        });
    }

    isEnabled(particle: Particle): boolean {
        return (
            particle.group === "projects" &&
            !particle.destroyed &&
            !particle.spawning
        );
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) return;

        const home = orbitHomePositions.get(particle);
        if (!home) return;

        particle.velocity.x += (Math.random() - 0.5) * this.jitterStrength * delta.factor;
        particle.velocity.y += (Math.random() - 0.5) * this.jitterStrength * delta.factor;

        const dx = home.x - particle.position.x;
        const dy = home.y - particle.position.y;

        particle.velocity.x += dx * this.springStrength * delta.factor;
        particle.velocity.y += dy * this.springStrength * delta.factor;

        particle.velocity.x *= this.damping;
        particle.velocity.y *= this.damping;

        particle.position.x += particle.velocity.x * delta.factor;
        particle.position.y += particle.velocity.y * delta.factor;

        const offsetX = particle.position.x - home.x;
        const offsetY = particle.position.y - home.y;
        const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

        if (distance > this.maxOrbitRadius) {
            const scale = this.maxOrbitRadius / distance;
            particle.position.x = home.x + offsetX * scale;
            particle.position.y = home.y + offsetY * scale;
        }

        const canvasSize = this.container.canvas.size;
        particle.position.x = Math.min(Math.max(particle.position.x, 0), canvasSize.width);
        particle.position.y = Math.min(Math.max(particle.position.y, 0), canvasSize.height);
    }
}

// ---------------------------------------------------------------------------
// ProjectRepulseInteractor
// ---------------------------------------------------------------------------

class ProjectRepulseInteractor extends ExternalInteractorBase {
    private readonly repulseRadius = 170;
    private readonly pushPixelsPerFrame = 3;
    private readonly maxEffectivePixelsPerFrame = 9;

    constructor(
        container: Container,
        private readonly projectManager: ProjectManager,
        private readonly cometManager: CometManager,
    ) {
        super(container);
    }

    get maxDistance(): number {
        return this.repulseRadius;
    }

    clear(): void {}
    init(): void {}
    reset(): void {}

    isEnabled(interactivityData: IInteractivityData): boolean {
        return Boolean(interactivityData.mouse.position);
    }

    interact(interactivityData: IInteractivityData, delta: IDelta): void {
        const pointer = interactivityData.mouse.position;
        if (!pointer) return;

        const container = this.container;
        const hoveredProject = this.projectManager.findAtPoint(pointer, container.canvas.size);
        if (!hoveredProject) return;

        const projectPosition = {
            x: (hoveredProject.x / 100) * container.canvas.size.width,
            y: (hoveredProject.y / 100) * container.canvas.size.height,
        };

        // The engine uses a SpatialHashGrid exposed as `.grid`, not `.quadTree`.
        const affectedParticles = container.particles.grid.queryCircle(
            projectPosition,
            this.repulseRadius,
        );

        for (const particle of affectedParticles) {
            if (particle.group === "projects") continue;
            if (particle.destroyed || particle.spawning) continue;

            this.pushParticle(particle, projectPosition, delta);
        }
    }

    private pushParticle(
        particle: Particle,
        center: { x: number; y: number },
        delta: IDelta,
    ): void {
        const dx = particle.position.x - center.x;
        const dy = particle.position.y - center.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < 0.0001) return;

        const distance = Math.sqrt(distanceSquared);

        if (distance >= this.repulseRadius) return;

        const normalizedDistance = distance / this.repulseRadius;
        const strength =
            Math.pow(1 - normalizedDistance, 2) * this.pushPixelsPerFrame * delta.factor;

        const nx = dx / distance;
        const ny = dy / distance;

        // `velocity` is a direction vector (~length 1); `moveSpeed` scales it to real pixels/frame.
        // Push in real-pixel units and divide by moveSpeed so the force feels equal on fast and slow particles.
        const moveSpeed = particle.retina.moveSpeed || 1;

        particle.velocity.x += (nx * strength) / moveSpeed;
        particle.velocity.y += (ny * strength) / moveSpeed;

        const effectiveSpeed = particle.velocity.length * moveSpeed;

        if (effectiveSpeed > this.maxEffectivePixelsPerFrame) {
            particle.velocity.length = this.maxEffectivePixelsPerFrame / moveSpeed;
        }

        if (particle.options.move?.straight) {
            this.cometManager.setReturnTarget(particle, center);
        }
    }
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

export const loadProjectPlugins = async (
    projectManager: ProjectManager,
    cometManager: CometManager,
): Promise<void> => {
    await loadInteractivityPlugin(tsParticles);

    await tsParticles.pluginManager.register((engine) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pm = engine.pluginManager as any;

        if (!pm.addParticleUpdater || !pm.addInteractor) {
            console.error("[projects] addParticleUpdater or addInteractor not available");
            return;
        }

        pm.addParticleUpdater(
            "project-orbit",
            (container: Container) => Promise.resolve(new ProjectOrbitUpdater(container)),
        );

        pm.addInteractor(
            "project-repulse",
            (container: Container) =>
                Promise.resolve(new ProjectRepulseInteractor(container, projectManager, cometManager)),
        );
    });
};
