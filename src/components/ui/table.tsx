import * as React from "react";

import { cn } from "@/lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return <div className="w-full overflow-x-auto rounded-[var(--radius-xl)] border"><table className={cn("w-full min-w-[34rem] border-collapse text-left text-sm", className)} {...props} /></div>;
}
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) { return <thead className={cn("bg-muted/70 text-muted-foreground", className)} {...props} />; }
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) { return <tbody className={cn("divide-y", className)} {...props} />; }
function TableRow({ className, ...props }: React.ComponentProps<"tr">) { return <tr className={cn("qualifyr-interactive hover:bg-[var(--primary-soft)]", className)} {...props} />; }
function TableHead({ className, ...props }: React.ComponentProps<"th">) { return <th className={cn("h-11 px-4 text-[11px] font-bold uppercase tracking-[0.1em]", className)} {...props} />; }
function TableCell({ className, ...props }: React.ComponentProps<"td">) { return <td className={cn("px-4 py-3.5", className)} {...props} />; }
function TableCaption({ className, ...props }: React.ComponentProps<"caption">) { return <caption className={cn("mt-3 text-left text-xs text-muted-foreground", className)} {...props} />; }

export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow };
