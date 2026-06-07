/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_NODE_ENV: string;
    // Add other custom env variables here
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
declare module 'mapbox-gl/dist/mapbox-gl.css' {
    const content: unknown;
    export default content;
}
