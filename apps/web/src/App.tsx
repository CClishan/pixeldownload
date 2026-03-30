import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { LinkDropzone } from './components/LinkDropzone';
import { QueueList } from './components/QueueList';
import { SettingsPanel } from './components/SettingsPanel';
import { CreditsPanel } from './components/CreditsPanel';
import { MobileFabBar } from './components/MobileFabBar';
import { LocaleSwitch } from './components/LocaleSwitch';
import { downloadArchive, getHealth, resolveLink } from './lib/api';
import { copy } from './lib/copy';
import type { AppSettings, Locale, QueueItem } from './lib/types';
import { buildArchiveName, countReadyItems, countSelectedAssets, extractUrls, resetResolvedItems } from './lib/utils';

const defaultSettings: AppSettings = {
  platformLock: 'auto',
  contentMode: 'auto',
  resultMode: 'single',
  preferNoWatermark: true
};

const createQueueItem = (url: string): QueueItem => ({
  id: crypto.randomUUID(),
  url,
  status: 'pending',
  expanded: false,
  selectedTokens: []
});

const App = () => {
  const [locale, setLocale] = useState<Locale>('zh');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [draft, setDraft] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [health, setHealth] = useState<Awaited<ReturnType<typeof getHealth>> | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const queueRef = useRef(queue);

  const t = copy[locale];

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    document.body.dataset.language = locale;
  }, [locale]);

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  const pushToast = (tone: 'info' | 'success' | 'error', message: string) => {
    const notify = tone === 'error' ? toast.error : tone === 'success' ? toast.success : toast.info;
    notify(message, {
      duration: 3200
    });
  };

  const addDraftToQueue = () => {
    const urls = extractUrls(draft);
    if (urls.length === 0) {
      pushToast('error', t.toast.queueEmpty);
      return;
    }

    const existing = new Set(queueRef.current.map((item) => item.url));
    const fresh = urls.filter((url) => !existing.has(url));

    if (fresh.length === 0) {
      pushToast('info', t.toast.queueDuplicate);
      return;
    }

    setQueue((current) => [...current, ...fresh.map(createQueueItem)]);
    setDraft('');
    pushToast('success', t.toast.queueAdded(fresh.length));
  };

  const pasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setDraft((current) => (current ? `${current}\n${text}` : text));
    } catch {
      pushToast('error', t.toast.clipboardFailed);
    }
  };

  const refreshHealth = () => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  };

  const resolveQueue = async () => {
    const targets = queueRef.current.filter((item) => item.status !== 'resolving' && item.status !== 'ready');
    if (targets.length === 0) {
      pushToast('info', t.toast.resolved(countReadyItems(queueRef.current), 0));
      return;
    }

    setIsResolving(true);
    let succeeded = 0;
    let failed = 0;

    for (const item of targets) {
      setQueue((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: 'resolving',
                error: undefined
              }
            : entry
        )
      );

      try {
        const response = await resolveLink({
          url: item.url,
          platform: settings.platformLock,
          contentMode: settings.contentMode,
          preferNoWatermark: settings.preferNoWatermark
        });

        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: 'ready',
                  response,
                  error: undefined,
                  selectedTokens: response.assets.map((asset) => asset.downloadToken)
                }
              : entry
          )
        );
        succeeded += 1;
      } catch (error) {
        setQueue((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: 'error',
                  response: undefined,
                  selectedTokens: [],
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : entry
          )
        );
        failed += 1;
      }
    }

    setIsResolving(false);
    refreshHealth();
    pushToast(failed > 0 ? 'info' : 'success', t.toast.resolved(succeeded, failed));
  };

  const downloadZip = async () => {
    const assetTokens = queueRef.current.flatMap((item) => item.selectedTokens);
    if (assetTokens.length === 0) {
      pushToast('error', t.toast.zipEmpty);
      return;
    }

    setIsArchiving(true);
    try {
      const blob = await downloadArchive({
        assetTokens,
        archiveName: buildArchiveName(locale, queueRef.current)
      });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = `${buildArchiveName(locale, queueRef.current)}.zip`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      pushToast('success', t.toast.zipReady);
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : 'ZIP failed');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleSettingsChange = (next: Partial<AppSettings>) => {
    const shouldReset =
      next.platformLock !== undefined || next.contentMode !== undefined || next.preferNoWatermark !== undefined;

    setSettings((current) => ({ ...current, ...next }));
    if (shouldReset && queueRef.current.some((item) => item.status === 'ready')) {
      setQueue((current) => resetResolvedItems(current));
    }
  };

  const readyItems = countReadyItems(queue);
  const selectedAssets = countSelectedAssets(queue);
  const canResolve = queue.some((item) => item.status === 'pending' || item.status === 'error');
  const canZip = selectedAssets > 0;

  const runtimeCards = useMemo(
    () => [
      {
        label: locale === 'zh' ? '已就绪' : 'Ready',
        value: readyItems,
        hint: locale === 'zh' ? '解析完成链接' : 'Resolved links'
      },
      {
        label: locale === 'zh' ? '已选择' : 'Selected',
        value: selectedAssets,
        hint: locale === 'zh' ? '准备打包资源' : 'Assets marked for export'
      },
      {
        label: locale === 'zh' ? '队列' : 'Queue',
        value: queue.length,
        hint: locale === 'zh' ? '当前工作集' : 'Links in session'
      }
    ],
    [locale, queue.length, readyItems, selectedAssets]
  );

  return (
    <div className="app-frame">
      <div className="page-shell shell">
        <header className="page-header">
          <div className="page-header__brand">
            <h1 className="page-header__title">PixelDownload</h1>
          </div>
          <div className="page-header__controls">
            <LocaleSwitch value={locale} onChange={setLocale} />
          </div>
        </header>

        <main className="workspace-layout">
          <section className="workspace-main">
            <section className="surface-card workspace-surface">
              <LinkDropzone
                compact={queue.length > 0}
                value={draft}
                prompt={queue.length > 0 ? t.compactPrompt : t.dropPrompt}
                hint={queue.length > 0 ? t.compactHint : t.dropHint}
                addLabel={t.addToQueue}
                pasteLabel={t.pasteClipboard}
                onChange={setDraft}
                onAdd={addDraftToQueue}
                onPaste={pasteClipboard}
              />
            </section>

            <div className="runtime-summary" aria-label="Runtime summary">
              {runtimeCards.map((card) => (
                <article key={card.label} className="runtime-summary__card">
                  <div className="runtime-summary__row">
                    <p className="runtime-summary__label">{card.label}</p>
                    <strong className="runtime-summary__value">{card.value}</strong>
                  </div>
                  <p className="runtime-summary__hint">{card.hint}</p>
                </article>
              ))}
            </div>

            <QueueList
              items={queue}
              clearLabel={t.clearWorkspace}
              emptyTitle={t.emptyQueue}
              emptyHint={t.emptyHint}
              detailLabel={t.openDetails}
              hideLabel={t.hideDetails}
              downloadLabel={t.directDownload}
              selectedAssetsLabel={t.selectedAssets}
              stateLabels={t.state}
              onClear={() => setQueue([])}
              onToggleExpand={(id) =>
                setQueue((current) =>
                  current.map((item) =>
                    item.id === id ? { ...item, expanded: !item.expanded } : item
                  )
                )
              }
              onToggleAsset={(itemId, token) =>
                setQueue((current) =>
                  current.map((item) => {
                    if (item.id !== itemId) {
                      return item;
                    }

                    const selected = item.selectedTokens.includes(token);
                    return {
                      ...item,
                      selectedTokens: selected
                        ? item.selectedTokens.filter((entry) => entry !== token)
                        : [...item.selectedTokens, token]
                    };
                  })
                )
              }
            />
          </section>

          <aside className="workspace-sidebar">
            <header className="config-header">
              <h2 className="config-header__title">
                <Settings2 className="config-header__icon button-icon" strokeWidth={1.8} />
                CONFIGURATION
              </h2>
            </header>
            <div ref={settingsRef}>
              <section className="surface-card config-panel">
                <SettingsPanel
                  settings={settings}
                  labels={{
                    configuration: t.configuration,
                    platform: locale === 'zh' ? '平台' : 'Platform',
                    contentMode: t.contentMode,
                    resultMode: t.resultMode,
                    tiktokMode: t.tiktokMode,
                    allPlatforms: locale === 'zh' ? '自动' : 'Auto',
                    instagram: 'Instagram',
                    threads: 'Threads',
                    tiktok: 'TikTok',
                    auto: t.auto,
                    videoOnly: t.videoOnly,
                    imageOnly: t.imageOnly,
                    singleFiles: t.singleFiles,
                    zipBundle: t.zipBundle,
                    preferNoWatermark: t.preferNoWatermark,
                    resolveQueue: t.resolveQueue,
                    downloadZip: t.downloadZip
                  }}
                  canResolve={canResolve}
                  canZip={canZip}
                  isResolving={isResolving}
                  isArchiving={isArchiving}
                  onChange={handleSettingsChange}
                  onResolve={resolveQueue}
                  onDownloadZip={downloadZip}
                />
              </section>
            </div>

            <CreditsPanel health={health} locale={locale} />
          </aside>
        </main>

        <MobileFabBar
          settingsLabel={t.mobileSettings}
          resolveLabel={t.mobileResolve}
          zipLabel={t.mobileZip}
          canResolve={canResolve}
          canZip={canZip}
          onOpenSettings={() => settingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          onResolve={resolveQueue}
          onDownloadZip={downloadZip}
        />
      </div>
    </div>
  );
};

export default App;
