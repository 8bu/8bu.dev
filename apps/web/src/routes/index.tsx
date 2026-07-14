import { createFileRoute } from "@tanstack/react-router";
import { EditorialHome } from "@/features/home/editorial/EditorialHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Long NGUYỄN - portfolio" },
      {
        name: "description",
        content:
          "Long NGUYỄN (8bu) - Senior Web Developer. Personal portfolio with selected work, writing, and a chat surface.",
      },
      { property: "og:title", content: "Long NGUYỄN - portfolio" },
      { property: "og:description", content: "Selected work, writing, and a chat surface." },
      { property: "og:image", content: "/og/default.png" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://8bu.dev/" }],
  }),
  component: EditorialHome,
});
