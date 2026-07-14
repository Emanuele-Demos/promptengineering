/// <reference types="vite/client" />

declare module 'express' {
  const express: any
  export default express
}

declare module './api/api.js' {
  export function createApiRouter(): any
}
