import { tsParticles, type ICoordinates, type IShapeDrawData, type IShapeDrawer } from "@tsparticles/engine";

// 4-point sparkle shape drawn as cubic Bézier curves.
// Control points sit on each tip's own axis, pulled toward center by `SPARKLE_INSET`,
// which creates the concave pinch between tips instead of straight edges.
const SPARKLE_INSET = 0.25;

class SparkleDrawer implements IShapeDrawer {
    draw(data: IShapeDrawData): void {
        const { context, radius } = data;
        const innerRadius = radius * SPARKLE_INSET;

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

export const loadSparkleShape = async (): Promise<void> => {
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
