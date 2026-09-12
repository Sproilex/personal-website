export interface ProjectData {
    id: string;
    title: string;
    description: string;
    href: string;
    thumbnail?: string;
    x: number;
    y: number;
}

export type CometDirection =
    | "right"
    | "left"
    | "bottom"
    | "bottom-right"
    | "bottom-left"
    | "top"
    | "top-right"
    | "top-left";

export interface SpeedRange {
    min: number;
    max: number;
}

export interface SizeRange {
    min: number;
    max: number;
}
