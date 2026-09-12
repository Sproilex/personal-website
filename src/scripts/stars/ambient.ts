import { tsParticles, type IDelta, type Particle } from "@tsparticles/engine";
import { decayExcessSpeed } from "./utils";

const homePositions = new WeakMap<Particle, { x: number; y: number }>();

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

        homePositions.set(particle, {
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
        if (!this.isEnabled(particle)) return;

        decayExcessSpeed(particle, delta);

        const home = homePositions.get(particle);

        if (!home) return;

        const dx = home.x - particle.position.x;
        const dy = home.y - particle.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.deadZoneRadius) return;

        const excess = distance - this.deadZoneRadius;
        const nx = dx / distance;
        const ny = dy / distance;
        const moveSpeed = particle.retina.moveSpeed || 1;

        particle.velocity.x += (nx * this.pullStrength * excess * delta.factor) / moveSpeed;
        particle.velocity.y += (ny * this.pullStrength * excess * delta.factor) / moveSpeed;
    }
}

export const loadAmbientReturn = async (): Promise<void> => {
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
