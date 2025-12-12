<script lang="ts">
  interface Props {
    message?: string;
  }

  let { message = '답변을 생성하고 있습니다...' }: Props = $props();
</script>

<div class="flex items-center gap-3 p-4">
  <div class="flex gap-1">
    <span
      class="w-2 h-2 bg-orange-500 rounded-full animate-pulse-bounce"
      style="animation-delay: 0ms;"
    ></span>
    <span
      class="w-2 h-2 bg-orange-500 rounded-full animate-pulse-bounce"
      style="animation-delay: 150ms;"
    ></span>
    <span
      class="w-2 h-2 bg-orange-500 rounded-full animate-pulse-bounce"
      style="animation-delay: 300ms;"
    ></span>
  </div>
  <span class="text-sm text-zinc-400">{message}</span>
</div>
