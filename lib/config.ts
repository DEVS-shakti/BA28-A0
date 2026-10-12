export type AppMode = "demo" | "production";

// Production is the safe default. Demo mode must be opted into locally with
// CLASSRANK_MODE=demo and must never be configured for the production project.
export const appMode: AppMode = process.env.CLASSRANK_MODE === "demo" ? "demo" : "production";
export const demoEnabled = appMode === "demo" && process.env.CLASSRANK_DEMO_ENABLED === "true";
export const isProductionMode = !demoEnabled;
