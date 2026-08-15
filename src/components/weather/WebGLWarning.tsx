"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { glassPanel } from "@/lib/glass";
import { cn } from "@/lib/utils";

interface WebGLWarningProps {
  shown: boolean;
}

// Informative, dismissible card shown when the browser/device can't create a
// WebGL context (e.g. Brave fingerprinting protection or an old mobile GPU).
export function WebGLWarning({ shown }: WebGLWarningProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!shown || dismissed) return null;

  return (
    <Card
      role="alert"
      data-testid="webgl-warning"
      size="sm"
      className={cn("w-full max-w-md", glassPanel(true))}
    >
      <CardContent className="flex items-start gap-3 py-3">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-amber-400"
          aria-hidden="true"
        />
        <p className="flex-1 text-sm text-foreground/90">
          WebGL isn&apos;t supported in this browser or device, so the 3D globe
          can&apos;t be displayed. The rest of the weather app still works.
        </p>
        <button
          type="button"
          aria-label="Dismiss WebGL warning"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </CardContent>
    </Card>
  );
}
