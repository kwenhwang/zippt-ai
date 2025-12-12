import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Component } from "svelte";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type helpers for shadcn-svelte components
export type WithElementRef<T> = T & { ref?: HTMLElement | null };
export type WithoutChild<T> = Omit<T, 'child'>;
export type WithoutChildren<T> = Omit<T, 'children'>;
export type WithoutChildrenOrChild<T> = Omit<T, 'children' | 'child'>;
