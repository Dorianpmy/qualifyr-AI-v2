"use client";

import * as React from "react";
import { Check, ChevronRight } from "lucide-react";
import { DropdownMenu as DropdownPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const DropdownMenu = DropdownPrimitive.Root;
const DropdownMenuTrigger = DropdownPrimitive.Trigger;
const DropdownMenuGroup = DropdownPrimitive.Group;

function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return <DropdownPrimitive.Portal><DropdownPrimitive.Content sideOffset={sideOffset} className={cn("z-50 min-w-52 rounded-[var(--radius-lg)] border bg-popover p-1.5 text-popover-foreground shadow-[var(--shadow-hover)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=open]:zoom-in-95", className)} {...props} /></DropdownPrimitive.Portal>;
}
function DropdownMenuItem({ className, inset, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item> & { inset?: boolean }) {
  return <DropdownPrimitive.Item className={cn("focus:bg-[var(--primary-soft)] focus:text-foreground relative flex cursor-default select-none items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-45", inset && "pl-8", className)} {...props} />;
}
function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) { return <DropdownPrimitive.Label className={cn("px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground", className)} {...props} />; }
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>) { return <DropdownPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />; }
function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof DropdownPrimitive.CheckboxItem>) {
  const checkedProps = checked === undefined ? {} : { checked };
  return <DropdownPrimitive.CheckboxItem {...checkedProps} className={cn("focus:bg-[var(--primary-soft)] relative flex cursor-default select-none items-center rounded-[var(--radius-sm)] py-2 pl-8 pr-3 text-sm outline-none", className)} {...props}><span className="absolute left-2.5"><DropdownPrimitive.ItemIndicator><Check className="size-4" /></DropdownPrimitive.ItemIndicator></span>{children}</DropdownPrimitive.CheckboxItem>;
}
function DropdownMenuSubTrigger({ className, children, ...props }: React.ComponentProps<typeof DropdownPrimitive.SubTrigger>) { return <DropdownPrimitive.SubTrigger className={cn("focus:bg-[var(--primary-soft)] flex items-center rounded-[var(--radius-sm)] px-3 py-2 text-sm outline-none", className)} {...props}>{children}<ChevronRight className="ml-auto size-4" /></DropdownPrimitive.SubTrigger>; }

export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSubTrigger, DropdownMenuTrigger };
