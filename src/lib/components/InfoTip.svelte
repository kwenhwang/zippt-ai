<script lang="ts">
  // 전문용어 풀이 툴팁. 클릭 토글(모바일 대응) + 바깥 클릭 시 닫힘.
  let { text }: { text: string } = $props();
  let open = $state(false);
</script>

<span class="relative inline-block align-middle">
  <button
    type="button"
    onclick={(e) => { e.stopPropagation(); open = !open; }}
    class="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-gray-400 text-[10px] leading-none hover:bg-white/20 hover:text-gray-200 transition-colors"
    aria-label="용어 설명"
  >?</button>
  {#if open}
    <!-- 바깥 클릭 닫기 -->
    <button type="button" class="fixed inset-0 z-30 cursor-default" aria-label="닫기" onclick={() => (open = false)}></button>
    <span
      class="absolute z-40 left-1/2 -translate-x-1/2 mt-1.5 w-56 max-w-[70vw] bg-gray-800 border border-white/15 rounded-lg p-3 text-[11px] text-gray-200 leading-relaxed shadow-xl font-normal normal-case text-left"
    >{text}</span>
  {/if}
</span>
