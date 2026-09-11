import {
    tsParticles,
    getPosition,
    type Container,
    type IDelta,
    type Particle,
    type IShapeDrawer,
    type IShapeDrawData,
    type ICoordinates,
} from "@tsparticles/engine";

import {
    ExternalInteractorBase,
    loadInteractivityPlugin,
    type IInteractivityData,
} from "@tsparticles/plugin-interactivity";

import { loadFull } from "tsparticles";

interface ProjectData {
    id: string;
    title: string;
    description: string;
    href: string;
    thumbnail?: string;
    x: number;
    y: number;
}

// Viewport occupies the center quarter of the 200vw×200vh canvas (25–75% on each axis).
// These percentages map the "center" region to canvas-% coordinates:
//   46% → (0.46 × 200vw) − 50vw = 42vw,  70% → 90vw
//   30% → (0.30 × 200vh) − 50vh = 10vh,  70% → 90vh
const STAR_ZONE = {
    xMin: 46,
    xMax: 70,
    yMin: 30,
    yMax: 70,
} as const;

const MIN_SPACING_PCT = 12;

const PROJECT_STAR_SIZE = 18;

let featuredProjects: ProjectData[] = [];

// index.astro injects a <script type="application/json" id="star-projects"> at build time.
// On pages without it we return [] gracefully.
const loadFeaturedProjects = (): Omit<ProjectData, "x" | "y">[] => {
    const el = document.getElementById("star-projects");

    if (!el) {
        return [];
    }

    try {
        return JSON.parse(el.textContent ?? "[]");
    } catch {
        console.error("[stars] Could not parse #star-projects JSON");
        return [];
    }
};

// Rejection sampling: up to 50 attempts per star, falls back to last candidate so init never blocks.
const generatePositions = (count: number): { x: number; y: number }[] => {
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
};

const projectHitRadius = 35;

const findProjectAtPoint = (
    pointer: { x: number; y: number },
    canvasSize: { width: number; height: number },
): ProjectData | undefined => {
    let closestProject: ProjectData | undefined;
    let closestDistance = Infinity;

    for (const project of featuredProjects) {
        const position = {
            x: (project.x / 100) * canvasSize.width,
            y: (project.y / 100) * canvasSize.height,
        };

        const dx = pointer.x - position.x;
        const dy = pointer.y - position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= projectHitRadius && distance < closestDistance) {
            closestProject = project;
            closestDistance = distance;
        }
    }

    return closestProject;
};

class ProjectRepulseInteractor extends ExternalInteractorBase {
    private readonly repulseRadius = 170;
    private readonly pushPixelsPerFrame = 3;
    private readonly maxEffectivePixelsPerFrame = 9;

    clear(): void { }
    init(): void { }
    reset(): void { }

    isEnabled(interactivityData: IInteractivityData): boolean {
        return Boolean(interactivityData.mouse.position);
    }

    interact(interactivityData: IInteractivityData, delta: IDelta): void {
        const pointer = interactivityData.mouse.position;

        if (!pointer) {
            return;
        }

        const container = this.container;
        const hoveredProject = findProjectAtPoint(pointer, container.canvas.size);

        if (!hoveredProject) {
            return;
        }

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
            if (this.isProjectParticle(particle)) {
                continue;
            }

            if (particle.destroyed || particle.spawning) {
                continue;
            }

            this.pushParticle(particle, projectPosition, delta);
        }
    }

    private isProjectParticle(particle: Particle): boolean {
        return particle.group === "projects";
    }

    private pushParticle(
        particle: Particle,
        center: { x: number; y: number },
        delta: IDelta,
    ): void {
        const dx = particle.position.x - center.x;
        const dy = particle.position.y - center.y;
        const distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < 0.0001) {
            return;
        }

        const distance = Math.sqrt(distanceSquared);

        if (distance >= this.repulseRadius) {
            return;
        }

        const normalizedDistance = distance / this.repulseRadius;
        const strength =
            Math.pow(1 - normalizedDistance, 2) *
            this.pushPixelsPerFrame *
            delta.factor;

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

        // `move.straight: true` is the reliable discriminator for comets in this file.
        if (particle.options.move?.straight) {
            cometReturnTargets.set(particle, { x: center.x, y: center.y });
        }
    }
}

const cometReturnTargets = new WeakMap<Particle, { x: number; y: number }>();

const restoreSpeedRate = 0.035;

const decayExcessSpeed = (particle: Particle, delta: IDelta): void => {
    const naturalLength = particle.initialVelocity?.length || 1;
    const currentLength = particle.velocity.length;

    if (currentLength > naturalLength) {
        particle.velocity.length =
            currentLength +
            (naturalLength - currentLength) * restoreSpeedRate * delta.factor;
    }
};

class CometReturnUpdater {
    private readonly pullPixelsPerFrame = 0.00045;
    private readonly arriveDistance = 24;

    init(): void { }

    isEnabled(particle: Particle): boolean {
        return cometReturnTargets.has(particle) && !particle.destroyed;
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) {
            return;
        }

        decayExcessSpeed(particle, delta);

        const target = cometReturnTargets.get(particle);

        if (!target) {
            return;
        }

        const dx = target.x - particle.position.x;
        const dy = target.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.arriveDistance) {
            cometReturnTargets.delete(particle);
            return;
        }

        const nx = dx / distance;
        const ny = dy / distance;
        const moveSpeed = particle.retina.moveSpeed || 1;

        particle.velocity.x +=
            (nx * this.pullPixelsPerFrame * distance * delta.factor) / moveSpeed;

        particle.velocity.y +=
            (ny * this.pullPixelsPerFrame * distance * delta.factor) / moveSpeed;
    }
}

const loadCometReturn = async () => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addParticleUpdater) {
            console.error("[comet-return] addParticleUpdater not available");
            return;
        }

        engine.pluginManager.addParticleUpdater(
            "comet-return",
            () => Promise.resolve(new CometReturnUpdater()),
        );
    });
};

// Trail dots are spawned as separate particles in the "comet-trail" group.
// We do it manually (rather than @tsparticles/plugin-trail) so the fade
// effect only applies to comets, not to the entire canvas.
const cometTrailTimers = new WeakMap<Particle, number>();

class CometTrailUpdater {
    private readonly spawnIntervalMs = 15;
    private readonly trailDuration = 0.55;

    constructor(private readonly container: Container) { }

    init(): void { }

    isEnabled(particle: Particle): boolean {
        return (
            Boolean(particle.options.move?.straight) &&
            !particle.destroyed &&
            !particle.spawning
        );
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) {
            return;
        }

        const elapsed = (cometTrailTimers.get(particle) ?? 0) + delta.value;

        if (elapsed < this.spawnIntervalMs) {
            cometTrailTimers.set(particle, elapsed);
            return;
        }

        cometTrailTimers.set(particle, 0);

        const cometSize = (particle.size as { value?: number })?.value ?? 3;
        const cometColor =
            (particle.options.color as { value?: unknown })?.value ?? "#ffffff";

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
            "comet-trail",
        );
    }
}

const loadCometTrail = async () => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addParticleUpdater) {
            console.error("[comet-trail] addParticleUpdater not available");
            return;
        }

        engine.pluginManager.addParticleUpdater(
            "comet-trail",
            (container: Container) =>
                Promise.resolve(new CometTrailUpdater(container)),
        );
    });
};

const ambientHomePositions = new WeakMap<Particle, { x: number; y: number }>();

class AmbientReturnUpdater {
    // Stars wander freely within this radius from their spawn point.
    // Only stars pushed beyond it get pulled back — keeps the field looking natural.
    private readonly deadZoneRadius = 90;
    private readonly pullStrength = 0.00035;

    init(particle: Particle): void {
        if (
            particle.group === "projects" ||
            particle.group === "comet-trail" ||
            particle.options.move?.straight
        ) {
            return;
        }

        ambientHomePositions.set(particle, {
            x: particle.position.x,
            y: particle.position.y,
        });
    }

    isEnabled(particle: Particle): boolean {
        return (
            !particle.destroyed &&
            !particle.spawning &&
            particle.group !== "projects" &&
            particle.group !== "comet-trail" &&
            !particle.options.move?.straight
        );
    }

    update(particle: Particle, delta: IDelta): void {
        if (!this.isEnabled(particle)) {
            return;
        }

        decayExcessSpeed(particle, delta);

        const home = ambientHomePositions.get(particle);

        if (!home) {
            return;
        }

        const dx = home.x - particle.position.x;
        const dy = home.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.deadZoneRadius) {
            return;
        }

        const excess = distance - this.deadZoneRadius;
        const nx = dx / distance;
        const ny = dy / distance;
        const moveSpeed = particle.retina.moveSpeed || 1;

        particle.velocity.x +=
            (nx * this.pullStrength * excess * delta.factor) / moveSpeed;

        particle.velocity.y +=
            (ny * this.pullStrength * excess * delta.factor) / moveSpeed;
    }
}

const loadAmbientReturn = async () => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addParticleUpdater) {
            console.error("[ambient-return] addParticleUpdater not available");
            return;
        }

        engine.pluginManager.addParticleUpdater(
            "ambient-return",
            () => Promise.resolve(new AmbientReturnUpdater()),
        );
    });
};

// 4-point sparkle shape drawn as cubic Bézier curves.
// Control points sit on each tip's own axis, pulled toward center by `sparkleInset`,
// which creates the concave pinch between tips instead of straight edges.
const sparkleInset = 0.25;

class SparkleDrawer implements IShapeDrawer {
    draw(data: IShapeDrawData): void {
        const { context, radius } = data;
        const innerRadius = radius * sparkleInset;

        const tips: ICoordinates[] = [
            { x: 0, y: -radius },
            { x: radius, y: 0 },
            { x: 0, y: radius },
            { x: -radius, y: 0 },
        ];

        context.moveTo(tips[0].x, tips[0].y);

        for (let i = 0; i < tips.length; i++) {
            const current = tips[i];
            const next = tips[(i + 1) % tips.length];

            const controlCurrent = {
                x: (current.x / radius) * innerRadius,
                y: (current.y / radius) * innerRadius,
            };

            const controlNext = {
                x: (next.x / radius) * innerRadius,
                y: (next.y / radius) * innerRadius,
            };

            context.bezierCurveTo(
                controlCurrent.x,
                controlCurrent.y,
                controlNext.x,
                controlNext.y,
                next.x,
                next.y,
            );
        }
    }

    getSidesCount(): number {
        return 4;
    }
}

const loadSparkleShape = async () => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addShape) {
            console.error("[sparkle-shape] addShape not available");
            return;
        }

        engine.pluginManager.addShape(["sparkle"], () =>
            Promise.resolve(new SparkleDrawer()),
        );
    });
};

// canvas.size uses retina (physical) pixels; clientX/Y are CSS pixels.
// getBoundingClientRect() converts between them so hit detection is correct on HiDPI screens.
const setupProjectInteraction = (container: Container) => {
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
        const project = findProjectAtPoint(point, container.canvas.size);

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
        const project = findProjectAtPoint(point, container.canvas.size);

        if (!project) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent("project-click", {
                detail: { id: project.id, title: project.title },
            }),
        );
    });
};

const projectHomePositions = new WeakMap<Particle, { x: number; y: number }>();

class ProjectOrbitUpdater {
    private readonly maxOrbitRadius = 14;
    private readonly springStrength = 0.006;
    private readonly jitterStrength = 0.05;
    private readonly damping = 0.92;

    constructor(private readonly container: Container) { }

    init(particle: Particle): void {
        if (particle.group !== "projects") {
            return;
        }

        projectHomePositions.set(particle, {
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
        if (!this.isEnabled(particle)) {
            return;
        }

        const home = projectHomePositions.get(particle);

        if (!home) {
            return;
        }

        particle.velocity.x +=
            (Math.random() - 0.5) * this.jitterStrength * delta.factor;

        particle.velocity.y +=
            (Math.random() - 0.5) * this.jitterStrength * delta.factor;

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

        particle.position.x = Math.min(
            Math.max(particle.position.x, 0),
            canvasSize.width,
        );

        particle.position.y = Math.min(
            Math.max(particle.position.y, 0),
            canvasSize.height,
        );
    }
}

const loadProjectOrbit = async () => {
    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addParticleUpdater) {
            console.error("[project-orbit] addParticleUpdater not available");
            return;
        }

        engine.pluginManager.addParticleUpdater(
            "project-orbit",
            (container: Container) => {
                return Promise.resolve(new ProjectOrbitUpdater(container));
            },
        );
    });
};

const loadProjectRepulse = async () => {
    await loadInteractivityPlugin(tsParticles);

    await tsParticles.pluginManager.register((engine) => {
        if (!engine.pluginManager.addInteractor) {
            console.error("[project-repulse] addInteractor not available");
            return;
        }

        engine.pluginManager.addInteractor(
            "project-repulse",
            (container: Container) => {
                return Promise.resolve(
                    new ProjectRepulseInteractor(container),
                );
            },
        );
    });
};

// Project particles are added imperatively after tsParticles.load() in their own
// "projects" group with density.enable: false, so setDensity() (called on every resize)
// never purges them. Declaring them as manualParticles would put them in index 0
// of the default group and they'd be the first to be removed on density recalculation.
const createProjectParticlesOptions = (_project: ProjectData) => ({
    shape: {
        type: "sparkle",
    },

    size: {
        value: PROJECT_STAR_SIZE,
    },

    color: {
        value: "#ffffff",
    },

    opacity: {
        value: 1,
    },

    stroke: {
        width: 1,
        color: "#ffffff",
        opacity: 0.4,
    },

    move: {
        enable: false,
    },

    twinkle: {
        particles: {
            enable: true,
            frequency: 0.04,
            opacity: 0.9,
        },
    },

    links: {
        enable: true,
        distance: 145,
        opacity: 0.35,
        width: 0.8,
        color: "#a78bfa",
    },
});

const addProjectParticles = (container: Container) => {
    for (const project of featuredProjects) {
        container.particles.addParticle(
            getPosition(
                { x: project.x, y: project.y, mode: "percent" },
                container.canvas.size,
            ),
            createProjectParticlesOptions(project),
            "projects",
        );
    }
};

// Two rAF ticks ensure layout is settled before tsParticles reads the canvas size.
const waitForLayout = () =>
    new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });

const initSpace = async () => {
    await waitForLayout();

    await loadFull(tsParticles);
    await loadSparkleShape();
    await loadProjectRepulse();
    await loadProjectOrbit();
    await loadCometReturn();
    await loadCometTrail();
    await loadAmbientReturn();

    const container = await tsParticles.load({
        id: "stars",

        options: {
            fullScreen: {
                enable: false,
            },

            background: {
                color: "#020204",
            },

            fpsLimit: 60,

            detectRetina: true,

            motion: {
                disable: false,
                reduce: true,
            },

            particles: {
                number: {
                    // Fixed total: density scaling OFF so this never multiplies by canvas area.
                    // 800 across 4× viewport ≈ 200 visible at any time.
                    value: 800,

                    density: {
                        enable: false,
                    },
                },

                shape: {
                    type: "sparkle",
                },

                size: {
                    value: {
                        min: 0.8,
                        max: 3.5,
                    },
                },

                opacity: {
                    value: {
                        min: 0.15,
                        max: 0.75,
                    },
                },

                color: {
                    value: [
                        "#ffffff",
                        "#e9d5ff",
                        "#c4b5fd",
                        "#a78bfa",
                        "#818cf8",
                        "#93c5fd",
                    ],
                },

                move: {
                    enable: true,

                    speed: {
                        min: 0.03,
                        max: 0.18,
                    },

                    direction: "none",
                    random: true,
                    straight: false,

                    outModes: {
                        default: "bounce",
                    },
                },

                links: {
                    enable: true,
                    distance: 105,
                    opacity: 0.075,
                    width: 0.5,
                    color: "#8b7cff",
                },

                twinkle: {
                    particles: {
                        enable: true,
                        frequency: 0.025,
                        opacity: 1,
                    },
                },

                bounce: {
                    horizontal: { value: 1 },
                    vertical: { value: 1 },
                },

                groups: {
                    // density.enable: false keeps setDensity() from purging project particles on resize.
                    projects: {
                        number: {
                            value: 0,
                            density: { enable: false },
                        },
                    },

                    dots: {
                        number: {
                            value: 320,
                            density: { enable: false },
                        },

                        shape: {
                            type: "circle",
                        },

                        size: {
                            value: {
                                min: 0.2,
                                max: 1.2,
                            },
                        },
                    },

                    "comet-trail": {
                        number: {
                            value: 0,
                            density: { enable: false },
                        },
                    },
                },
            },

            interactivity: {
                // Required when canvas is offset from viewport origin (left: -50vw, top: -50vh)
                // so mouse coords are converted via getBoundingClientRect(), not assumed to be window-relative.
                detectsOn: "canvas",

                events: {
                    onHover: {
                        enable: true,
                        mode: "project-repulse",
                    },

                    resize: {
                        enable: true,
                    },
                },

                modes: {
                    "project-repulse": {},
                },
            },

            emitters: [
                {
                    name: "comet-right",

                    position: { x: 0, y: 25 },
                    direction: "right",

                    size: {
                        width: 0,
                        height: 25,
                        mode: "percent",
                    },

                    rate: {
                        quantity: 1,
                        delay: 3.5,
                    },

                    particles: {
                        shape: { type: "circle" },

                        color: {
                            value: ["#ffffff", "#c4b5fd", "#93c5fd"],
                        },

                        size: {
                            value: { min: 1.5, max: 3 },
                        },

                        opacity: {
                            value: { min: 0.7, max: 1 },
                        },

                        move: {
                            enable: true,
                            direction: "right",
                            speed: { min: 7, max: 11 },
                            straight: true,
                            outModes: { default: "destroy" },
                        },
                    },
                },

                {
                    name: "comet-left",

                    position: { x: 100, y: 70 },
                    direction: "left",

                    size: {
                        width: 0,
                        height: 20,
                        mode: "percent",
                    },

                    rate: {
                        quantity: 1,
                        delay: 5,
                    },

                    particles: {
                        shape: { type: "circle" },

                        color: {
                            value: ["#ffffff", "#a78bfa", "#818cf8"],
                        },

                        size: {
                            value: { min: 1.5, max: 3 },
                        },

                        opacity: {
                            value: { min: 0.7, max: 1 },
                        },

                        move: {
                            enable: true,
                            direction: "left",
                            speed: { min: 8, max: 12 },
                            straight: true,
                            outModes: { default: "destroy" },
                        },
                    },
                },

                {
                    name: "comet-diagonal",

                    position: { x: 15, y: 0 },
                    direction: "bottom-right",

                    size: {
                        width: 25,
                        height: 0,
                        mode: "percent",
                    },

                    rate: {
                        quantity: 1,
                        delay: 7,
                    },

                    particles: {
                        shape: { type: "circle" },

                        color: { value: "#ffffff" },

                        size: {
                            value: { min: 1, max: 2.5 },
                        },

                        opacity: { value: 0.9 },

                        move: {
                            enable: true,
                            direction: "bottom-right",
                            speed: { min: 6, max: 9 },
                            straight: true,
                            outModes: { default: "destroy" },
                        },
                    },
                },
            ],
        },
    });

    if (container) {
        starsContainer = container;
        tryInitProjects(container);
    }
};

// Stored so astro:page-load can retry project init after navigating to home.
let starsContainer: Container | undefined;
let projectsInitialized = false;

const tryInitProjects = (container: Container): void => {
    if (projectsInitialized) return;

    const raw = loadFeaturedProjects();
    if (raw.length === 0) return;

    const positions = generatePositions(raw.length);

    featuredProjects = raw.map((p, i) => ({
        ...p,
        x: positions[i].x,
        y: positions[i].y,
    }));

    addProjectParticles(container);
    setupProjectInteraction(container);
    projectsInitialized = true;
};

// On every navigation, retry in case the user just arrived at home for the first time.
document.addEventListener("astro:page-load", () => {
    if (starsContainer) tryInitProjects(starsContainer);
});

initSpace().catch(console.error);
