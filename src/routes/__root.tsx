import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { RoleProvider } from "@/lib/role-context";
import { AppShell } from "@/components/healthlens/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="max-w-md text-center">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">404</div>
          <h1 className="mt-2 text-xl font-semibold text-foreground">Page not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The case or page you're looking for doesn't exist.
          </p>
          <div className="mt-4">
            <a
              href="/queue"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-dark"
            >
              Go to case queue
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <AppShell>
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-foreground">This page didn't load</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong. Try again or head back to the queue.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              onClick={() => {
                router.invalidate();
                reset();
              }}
            >
              Try again
            </Button>
            <a
              href="/queue"
              className="inline-flex items-center justify-center rounded-md border border-input bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Go to queue
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IDBI MSME HealthLens" },
      {
        name: "description",
        content:
          "Bank-grade credit officer workbench: alternate-data MSME Financial Health Card, explainable score, decision support and CAM export.",
      },
      { name: "author", content: "IDBI MSME HealthLens" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <RoleProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster richColors closeButton position="bottom-right" />
      </RoleProvider>
    </QueryClientProvider>
  );
}
