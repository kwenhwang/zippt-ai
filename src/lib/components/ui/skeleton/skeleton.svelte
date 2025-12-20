<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		class: className,
		...restProps
	}: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	class={cn("animate-pulse rounded-md bg-[var(--bg-tertiary)] motion-reduce:animate-none motion-reduce:opacity-50", className)}
	{...restProps}
></div>
