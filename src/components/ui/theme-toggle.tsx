"use client";

import { Laptop, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Theme = "light" | "dark" | "system";
const STORAGE_KEY = "qualifyr-theme";

function applyTheme(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  function selectTheme(next: Theme) {
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="secondary" size="icon-sm" aria-label="Changer de thème"><Sun /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end"><DropdownMenuLabel>Thème</DropdownMenuLabel><DropdownMenuItem onSelect={() => selectTheme("light")}><Sun />Clair</DropdownMenuItem><DropdownMenuItem onSelect={() => selectTheme("dark")}><Moon />Sombre</DropdownMenuItem><DropdownMenuItem onSelect={() => selectTheme("system")}><Laptop />Système</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
  );
}
