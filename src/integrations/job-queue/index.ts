import { createJobRegistry } from "./implementation";
import type { JobRegistry } from "./implementation";

const globalWithJobRegistry = globalThis as typeof globalThis & {
  __jobQueueRegistry?: JobRegistry;
};

export const jobs = import.meta.hot
  ? (globalWithJobRegistry.__jobQueueRegistry ??= createJobRegistry())
  : createJobRegistry();
