"use client";

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { glassPanel } from "@/lib/glass";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  isDay: boolean;
}

// Framer-free loading placeholder. Rendered when there is no weather data and
// no fetch in flight, including in the server-rendered HTML — so even if
// client-side JS never loads (slow/flaky connection), the page shows a visible
// card instead of a blank area.
export function LoadingState({ isDay }: LoadingStateProps) {
  return (
    <Card
      data-testid="loading-state"
      className={cn("w-full max-w-md", glassPanel(isDay))}
    >
      <CardContent className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        <span>Loading weather…</span>
      </CardContent>
    </Card>
  );
}
