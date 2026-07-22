export const APP_VERSION = '1.1.0';

// Git short hash and build timestamp, injected at build time (see vite.config.ts).
// Guarded with typeof so the module is safe if the constants aren't defined.
export const GIT_HASH = typeof __GIT_HASH__ !== 'undefined' ? __GIT_HASH__ : 'dev';
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : '';
