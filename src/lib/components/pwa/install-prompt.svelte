<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import { X, Download } from 'lucide-svelte';

  let deferredPrompt: any = $state(null);
  let showBanner = $state(false);
  let dismissed = $state(false);

  onMount(() => {
    // 이전에 dismiss 했는지 확인
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      dismissed = true;
      return;
    }

    // standalone 모드면 이미 설치된 것
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      showBanner = true;
    });

    // 설치 완료 감지
    window.addEventListener('appinstalled', () => {
      showBanner = false;
      deferredPrompt = null;
    });
  });

  async function handleInstall() {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      showBanner = false;
    }
    deferredPrompt = null;
  }

  function handleDismiss() {
    showBanner = false;
    dismissed = true;
    localStorage.setItem('pwa-install-dismissed', 'true');
  }
</script>

{#if showBanner && !dismissed}
  <div class="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4">
    <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 shadow-xl">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-zinc-100 text-sm">앱으로 설치하기</h3>
          <p class="text-xs text-zinc-400 mt-1">홈 화면에 추가하면 더 빠르게 사용할 수 있어요</p>
        </div>
        <button
          onclick={handleDismiss}
          class="text-zinc-500 hover:text-zinc-300 transition-colors"
          aria-label="닫기"
        >
          <X class="w-5 h-5" />
        </button>
      </div>
      <div class="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          class="flex-1 border-zinc-600"
          onclick={handleDismiss}
        >
          나중에
        </Button>
        <Button
          size="sm"
          class="flex-1 bg-orange-600 hover:bg-orange-700"
          onclick={handleInstall}
        >
          설치
        </Button>
      </div>
    </div>
  </div>
{/if}
