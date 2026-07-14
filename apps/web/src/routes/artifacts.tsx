import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * /artifacts — deprecated.
 *
 * The browse-everything gallery was retired: the editorial home now covers
 * projects (Selected Work) and writing (Substack), so a separate index is
 * redundant. Individual `/artifact/$kind/$slug` pages still exist (the home's
 * "View case →" links). This route just redirects any lingering bookmark or
 * inbound link to the home.
 */
export const Route = createFileRoute("/artifacts")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
