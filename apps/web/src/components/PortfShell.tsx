import type { PropsWithChildren } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * PortfShell - the never-unmounting outer wrapper for every route.
 *
 * Transitional bridge for the editorial redesign (ADR-0001/0002): the new
 * editorial home at `/` is full-bleed (fixed nav, 100vh hero, no device
 * chrome), so the shell drops the `.frame frame-desktop` device-frame wrapper
 * on that route. The legacy `data-theme="press"` routes (/chat, /artifacts)
 * still render inside the framed shell until their own re-skin phase.
 *
 * `data-theme="press"` stays on <html> (set in __root) for the legacy routes;
 * the editorial home scopes its own tokens under `.ed`, independent of it.
 */
export function PortfShell({ children }: PropsWithChildren) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isEditorial = pathname === "/";

  if (isEditorial) {
    return <div data-portf-shell="editorial">{children}</div>;
  }

  return (
    <div className="frame frame-desktop" data-portf-shell>
      {children}
    </div>
  );
}
