"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--overlay)] backdrop-blur-[var(--blur-soft)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=closed]:fade-out" />
      <DialogPrimitive.Content className={cn("qualifyr-card fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in data-[state=open]:zoom-in-95", className)} {...props}>
        {children}
        <DialogPrimitive.Close className="focus-ring absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground" aria-label="Fermer">
          <X className="size-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("grid gap-2 pr-10", className)} {...props} />; }
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className={cn("text-xl font-bold tracking-[-0.03em]", className)} {...props} />; }
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />; }
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div className={cn("mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props} />; }

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger };
