const exit = (name: string) => ({
    name,
    duration: "0.3s",
    easing: "ease-in",
    fillMode: "both",
});

const entry = (name: string) => ({
    name,
    duration: "0.4s",
    delay: "0.05s",
    easing: "ease-out",
    fillMode: "both",
});

const make = (exitName: string, entryName: string) => ({
    forwards: { old: exit(exitName), new: entry(entryName) },
    backwards: { old: exit(exitName), new: entry(entryName) },
});

export const homeTransition = make("space-exit-tl", "space-entry-tl");
export const projectsTransition = make("space-exit-br", "space-entry-br");
export const aboutTransition = make("space-exit-bl", "space-entry-bl");
export const contactTransition = make("space-exit-tr", "space-entry-tr");
export const detailTransition = make("space-exit-down", "space-entry-down");

/**
 * Maps each page path to its exit direction name.
 * Detail pages (/projects/*) fall under "down" — handled by the
 * consumer with a prefix check.
 * Used by space-pan.ts to determine which way to translate #stars.
 */
export const PAGE_EXIT_DIRECTION: Record<string, string> = {
    "/": "tl",
    "/projects": "br",
    "/about": "bl",
    "/contact": "tr",
};
