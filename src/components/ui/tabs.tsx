"use client";

import { Tabs as TabsPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;
const TabsContent = TabsPrimitive.Content;
function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) { return <TabsPrimitive.List className={cn("inline-flex rounded-[var(--radius-md)] bg-muted p-1", className)} {...props} />; }
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) { return <TabsPrimitive.Trigger className={cn("focus-ring rounded-[var(--radius-sm)] px-3 py-2 text-xs font-semibold text-muted-foreground data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-[var(--shadow-xs)]", className)} {...props} />; }
export { Tabs, TabsContent, TabsList, TabsTrigger };
