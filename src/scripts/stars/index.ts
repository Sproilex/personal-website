import { tsParticles, type Container } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import { loadTwinkleUpdater } from "@tsparticles/updater-twinkle";
import { loadDestroyUpdater } from "@tsparticles/updater-destroy";

import { waitForLayout } from "./utils";
import { loadSparkleShape } from "./shape";
import { loadAmbientReturn } from "./ambient";
import { CometManager, loadCometPlugins } from "./comets";
import { ProjectManager, loadProjectPlugins } from "./projects";

const projectManager = new ProjectManager();
const cometManager = new CometManager();

const initSpace = async (): Promise<void> => {
    await waitForLayout();

    const isMobile = window.innerWidth < 768;

    await loadSlim(tsParticles);
    await Promise.all([
        loadTwinkleUpdater(tsParticles),
        loadDestroyUpdater(tsParticles),
        loadSparkleShape(),
        loadAmbientReturn(),
        loadCometPlugins(cometManager),
        loadProjectPlugins(projectManager, cometManager),
    ]);

    // Mobile canvas (~750×1624px) is ~7× smaller than desktop (~3840×2160px),
    // so reduce particle counts proportionally to avoid overcrowding.
    const starCount = isMobile ? 300 : 800;
    const dotCount = isMobile ? 120 : 320;

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

            detectRetina: !isMobile,

            motion: {
                disable: false,
                reduce: true,
            },

            particles: {
                number: {
                    // Fixed total: density scaling OFF so this never multiplies by canvas area.
                    // starCount scales the visible field to the viewport size (mobile vs desktop).
                    value: starCount,
                    density: { enable: false },
                },

                shape: {
                    type: "sparkle",
                },

                size: {
                    value: { min: 0.8, max: 3.5 },
                },

                opacity: {
                    value: { min: 0.15, max: 0.75 },
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
                    speed: { min: 0.03, max: 0.18 },
                    direction: "none",
                    random: true,
                    straight: false,
                    outModes: { default: "bounce" },
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
                        number: { value: 0, density: { enable: false } },
                    },

                    dots: {
                        number: { value: dotCount, density: { enable: false } },
                        shape: { type: "circle" },
                        size: { value: { min: 0.2, max: 1.2 } },
                    },

                    "comet-trail": {
                        number: { value: 0, density: { enable: false } },
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
                    resize: { enable: true },
                },

                modes: {
                    "project-repulse": {},
                },
            },

            emitters: [],
        },
    });

    if (!container) return;

    starsContainer = container;
    projectManager.tryInit(container);
    cometManager.startSpawner(container);
};

let starsContainer: Container | undefined;

// On every navigation, resume the animation loop and retry project init.
document.addEventListener("astro:page-load", () => {
    if (starsContainer) {
        starsContainer.play();
        projectManager.tryInit(starsContainer);
    }
});

window.addEventListener("logo-comet", () => {
    if (starsContainer) cometManager.spawnBurst(starsContainer);
});

initSpace().catch(console.error);
