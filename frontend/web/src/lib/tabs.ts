// La maqueta navegaba con ids de pestaña; acá cada pestaña es una ruta real.
export const TAB_PATHS = {
  avisos: '/',
  mapa: '/mapa',
  eventos: '/eventos',
  galeria: '/galeria',
  catalogo: '/especies',
  apps: '/apps',
  sugerencias: '/buzon',
  admin: '/admin',
  perfil: '/perfil',
} as const;

export type TabId = keyof typeof TAB_PATHS;

export function pathForTab(tab: string): string {
  return TAB_PATHS[tab as TabId] ?? '/';
}

export function tabForPath(pathname: string): TabId {
  const entry = Object.entries(TAB_PATHS).find(
    ([, path]) => path !== '/' && pathname.startsWith(path)
  );
  return (entry?.[0] as TabId) ?? 'avisos';
}
