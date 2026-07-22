/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional override for the Gemini model id used by aiService. */
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Injected at build time by vite.config.ts `define`.
declare const __GIT_HASH__: string;
declare const __BUILD_TIME__: string;
