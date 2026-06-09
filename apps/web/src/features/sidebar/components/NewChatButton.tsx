import { useNavigate } from "@tanstack/react-router";
import { useThreadsStore } from "@/store/threads";
import { useUiStore } from "@/store/ui";

/**
 * Sidebar "+ NEW CHAT" CTA. Mints a fresh thread (eager registration -
 * operator pick) and navigates. Closes the mobile drawer if open.
 *
 * Eager registration here intentionally diverges from the bare-/chat
 * deferred-registration rule: the visitor explicitly clicked New Chat,
 * so a row should appear. If the visitor bounces without sending,
 * `threads.remove` is one click away.
 */
/** Mint a fresh thread, close the mobile drawer, navigate to it. Shared by the
 * sidebar CTA and the compact mobile-topbar button so the behavior can't drift. */
function useNewChat(): () => void {
  const navigate = useNavigate();
  const create = useThreadsStore((s) => s.create);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  return () => {
    const id = create();
    setSidebarOpen(false);
    void navigate({
      to: "/chat/$threadId",
      params: { threadId: id },
      search: { artifact: undefined },
    });
  };
}

export function NewChatButton() {
  const newChat = useNewChat();
  return (
    <button type="button" className="v1-new-btn" onClick={newChat}>
      <span className="plus">+</span> NEW CHAT
    </button>
  );
}

/** Compact `+` variant for the mobile chat top bar. Reuses `.mob-icon-btn`
 * (40×40 tap target, defined in portfolio.css) — same as the burger. */
export function MobileNewChatButton() {
  const newChat = useNewChat();
  return (
    <button type="button" className="mob-icon-btn" aria-label="New chat" onClick={newChat}>
      +
    </button>
  );
}
