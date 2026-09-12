import type { Container, IDelta, Particle } from "@tsparticles/engine";

export const waitForLayout = (): Promise<void> =>
    new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => resolve());
        });
    });

// canvas.size uses retina (physical) pixels; clientX/Y are CSS pixels.
// getBoundingClientRect() converts between them so hit detection is correct on HiDPI screens.
export const getViewportEdges = (container: Container) => {
    const el = container.canvas.domElement;

    if (!el) return null;

    const rect = el.getBoundingClientRect();
    const w = container.canvas.size.width;
    const h = container.canvas.size.height;

    return {
        toX: (vx: number) => ((vx - rect.left) / rect.width) * w,
        toY: (vy: number) => ((vy - rect.top) / rect.height) * h,
    };
};

export const decayExcessSpeed = (particle: Particle, delta: IDelta): void => {
    const naturalLength = particle.initialVelocity?.length ?? 1;
    const currentLength = particle.velocity.length;

    if (currentLength > naturalLength) {
        particle.velocity.length =
            currentLength + (naturalLength - currentLength) * 0.035 * delta.factor;
    }
};

// `move.straight: true` is the reliable discriminator for comet particles.
export const isComet = (particle: Particle): boolean =>
    Boolean(particle.options.move?.straight);
