const STUDIO_PATHS = new Set(['/', '/billing', '/settings']);

export const isStudioPath = (pathname: string) => STUDIO_PATHS.has(pathname);
