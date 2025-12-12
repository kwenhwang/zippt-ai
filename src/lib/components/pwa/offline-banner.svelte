<script lang="ts">
  import { onMount } from 'svelte';
  import { WifiOff, Wifi } from 'lucide-svelte';

  let isOnline = $state(true);
  let showReconnected = $state(false);

  onMount(() => {
    isOnline = navigator.onLine;

    function handleOnline() {
      isOnline = true;
      showReconnected = true;
      setTimeout(() => {
        showReconnected = false;
      }, 3000);
    }

    function handleOffline() {
      isOnline = false;
      showReconnected = false;
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  });
</script>

{#if !isOnline}
  <div class="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2">
    <div class="flex items-center justify-center gap-2 text-sm">
      <WifiOff class="w-4 h-4" />
      <span>오프라인 상태입니다. 저장된 대화만 볼 수 있어요.</span>
    </div>
  </div>
{/if}

{#if showReconnected}
  <div class="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 animate-in slide-in-from-top">
    <div class="flex items-center justify-center gap-2 text-sm">
      <Wifi class="w-4 h-4" />
      <span>다시 연결되었습니다!</span>
    </div>
  </div>
{/if}
