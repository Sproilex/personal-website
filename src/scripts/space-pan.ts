// Fixed canvas offsets per page. Home = canvas center (0, 0).
// All other pages pan away from that reference point.
const PAN_X = () => window.innerWidth * 0.15;
const PAN_Y = () => window.innerHeight * 0.15;

function getPageTarget(pathname: string): { x: number; y: number } {
    const px = PAN_X();
    const py = PAN_Y();

    if (pathname === "/") return { x: 0, y: 0 };
    if (pathname === "/projects") return { x: px, y: py };
    if (pathname === "/about") return { x: -px, y: py };
    if (pathname === "/contact") return { x: px, y: -py };
    if (pathname.startsWith("/projects/")) return { x: 0, y: py };

    return { x: 0, y: 0 };
}

let currentX = 0;
let currentY = 0;
let animId: number | null = null;

function easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function animatePan(targetX: number, targetY: number, duration: number): void {
    if (animId !== null) {
        cancelAnimationFrame(animId);
        animId = null;
    }

    const startX = currentX;
    const startY = currentY;
    const startTime = performance.now();

    const tick = (now: number): void => {
        const t = Math.min((now - startTime) / duration, 1);
        const eased = easeInOut(t);

        currentX = startX + (targetX - startX) * eased;
        currentY = startY + (targetY - startY) * eased;

        const stars = document.getElementById("stars");
        if (stars) {
            stars.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }

        if (t < 1) {
            animId = requestAnimationFrame(tick);
        } else {
            currentX = targetX;
            currentY = targetY;
            animId = null;
        }
    };

    animId = requestAnimationFrame(tick);
}

// astro:page-load fires on the very first load (astro:after-swap does not).
// Snap to the initial page position without animation.
let initialized = false;

document.addEventListener("astro:page-load", () => {
    if (initialized) return;
    initialized = true;

    const target = getPageTarget(window.location.pathname);
    currentX = target.x;
    currentY = target.y;

    const stars = document.getElementById("stars");
    if (stars) {
        stars.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }
});

// astro:after-swap fires on every navigation after the DOM is swapped.
// Start the rAF pan here so it overlaps with the content entry animation.
document.addEventListener("astro:after-swap", () => {
    if (!initialized) return;

    const target = getPageTarget(window.location.pathname);
    animatePan(target.x, target.y, 450);
});
