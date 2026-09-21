export function getActiveProjectId(pathname: string) {
  const match = pathname.match(/^\/project\/([^/]+)\/(?:epics|tasks|members|edit)(?:\/|$)/);

  return match?.[1] ?? null;
}
