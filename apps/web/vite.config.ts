import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import mdx from "@mdx-js/rollup";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

/**
 * Proxy contract:
 *
 *   /api/*  ->  http://localhost:3010 (path rewritten: /api/foo -> /foo)
 *
 * Plugin order is load-bearing:
 *   tanstackStart (owns route discovery + prerender; replaces TanStackRouterVite)
 *     -> mdx (compiles .mdx -> JSX-bearing ESM; must run before react())
 *       -> viteReact (transforms JSX; babel-based, replaces react-swc)
 *         -> tailwindcss (CSS pipeline; independent)
 */
export default defineConfig({
  plugins: [
    tanstackStart({
      router: {
        routeFileIgnorePattern: "\\.test\\.tsx?$",
      },
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: true,
        failOnError: true,
        // Drop binary assets (resume PDF reachable via descriptor.url) and the
        // deprecated /artifacts route, which is a beforeLoad redirect to "/"
        // (nothing to prerender; a 301 is served at the edge via _redirects).
        filter: ({ path }) => !path.endsWith(".pdf") && path !== "/artifacts",
      },
      // Explicitly prerender artifacts that crawlLinks cannot reach:
      //  - misc (cosimi-explainer, tools-ai-workflow, contact-coffee-chat) are
      //    chat-only, never linked from a page.
      //  - the résumé's only former link was the retired /artifacts gallery;
      //    the home Contact now links straight to the PDF, so list it here.
      pages: [
        { path: "/artifact/misc/cosimi-explainer" },
        { path: "/artifact/misc/tools-ai-workflow" },
        { path: "/artifact/misc/contact-coffee-chat" },
        { path: "/artifact/resume/longnguyen-2026" },
      ],
      sitemap: {
        enabled: true,
        host: "https://8bu.dev",
      },
    }),
    mdx({
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: "frontmatter" }]],
      providerImportSource: "@mdx-js/react",
    }),
    viteReact(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: "http://localhost:3010",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
