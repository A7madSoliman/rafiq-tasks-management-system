export function getActiveProjectId(pathname: string) {
  const match = pathname.match(/^\/project\/([^/]+)\/(?:epics|tasks|members|details)(?:\/|$)/);

  return match?.[1] ?? null;
}
