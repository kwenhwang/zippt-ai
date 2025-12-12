<script lang="ts">
	let { message = 'Hello' }: { message?: string } = $props();
</script>

<div data-testid="sample-component">
	<p>{message}</p>
</div>
