import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { AddAnchorSheet } from './components/AddAnchorSheet';
import { CarryForward } from './components/CarryForward';
import { DailyAnchorsList } from './components/DailyAnchorsList';
import { LoadPicker } from './components/LoadPicker';
import { MedsView } from './components/MedsView';
import { OverwhelmSheet } from './components/OverwhelmSheet';
import { RestGate, RestProtectionOverlay } from './components/RestProtection';
import { SettingsView } from './components/SettingsView';
import { SingleFocusHUD } from './components/SingleFocusHUD';
import { ThoughtCapture, ThoughtCaptureFab } from './components/ThoughtCapture';
import { Toast } from './components/Toast';
import { UnstickSheet } from './components/UnstickSheet';
import { t } from './copy/t';
import { useAnchorApp } from './hooks/useAnchorApp';
import { isCaptureKey, isTypingTarget } from './utils/hotkeys';
import ui from './components/ui.module.css';

export default function App() {
  const app = useAnchorApp();
  const [loadEdit, setLoadEdit] = useState(false);
  const [postHighRest, setPostHighRest] = useState(false);
  const {
    setCaptureOpen,
    setUnstickOpen,
    setAddOpen,
  } = app;

  const sheetOpen =
    app.captureOpen || app.unstickOpen || app.addOpen || app.overwhelmOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCaptureOpen(false);
        setUnstickOpen(false);
        setAddOpen(false);
        app.dismissOverwhelm();
        return;
      }

      if (isTypingTarget(e.target)) return;

      if (isCaptureKey(e.key)) {
        e.preventDefault();
        setCaptureOpen(true);
        return;
      }

      const k = e.key.toLowerCase();

      if (app.overwhelmOpen) {
        if (k === 's') {
          e.preventDefault();
          app.swapFromOverwhelm();
        }
        if (k === 'r') {
          e.preventDefault();
          app.enterRest();
        }
        return;
      }

      if (sheetOpen) return;
      if (app.state.restMode && e.key !== 'r' && e.key !== 'R') return;

      if (e.key === ' ') {
        if (app.state.focus) {
          e.preventDefault();
          app.toggleStartPause();
        }
        return;
      }

      if (k === 'd' && app.state.focus) {
        e.preventDefault();
        const high = app.completeFocus();
        if (high) setPostHighRest(true);
        return;
      }
      if (k === 'u' && app.state.focus) {
        e.preventDefault();
        app.openUnstick('standard');
        return;
      }
      if (k === 'h' && app.state.focus) {
        e.preventDefault();
        app.tooHard();
        return;
      }
      if (k === 'o' && app.state.focus) {
        e.preventDefault();
        app.overwhelmFocus();
        return;
      }
      if (k === 's') {
        e.preventDefault();
        if (app.overwhelmOpen) app.swapFromOverwhelm();
        else if (app.state.focus) app.swapFocus();
        return;
      }
      if (k === 'r') {
        e.preventDefault();
        if (app.overwhelmOpen || app.state.focus) app.enterRest();
        else if (!app.state.restMode) app.setRoute('rest');
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [app, setAddOpen, setCaptureOpen, setUnstickOpen, sheetOpen]);

  const navRoute =
    app.route === 'settings' ? 'meds' : app.route === 'rest' ? 'rest' : app.route;

  const restOverlay = app.state.restMode && app.route !== 'rest';

  let body: ReactNode = null;

  if (app.state.carryCandidates.length > 0) {
    body = (
      <CarryForward
        candidates={app.state.carryCandidates}
        onChoose={app.bringForward}
      />
    );
  } else if (app.route === 'settings') {
    body = (
      <SettingsView
        settings={app.state.settings}
        onChange={app.updateSettings}
        onBack={() => app.setRoute('meds')}
      />
    );
  } else if (app.route === 'meds') {
    body = (
      <MedsView
        dose={app.state.dose}
        pk={app.pk}
        restMode={app.state.restMode}
        onLog={app.logDose}
        onSkip={app.skipDose}
        showComedownNudge={app.showComedownNudge}
        onDismissComedown={app.dismissComedown}
        onOpenSettings={() => app.setRoute('settings')}
      />
    );
  } else if (app.route === 'rest') {
    body = app.state.restMode ? (
      <section className={ui.stack}>
        <h1 className={ui.screenTitle}>{t('empty.restMode.title')}</h1>
        <p className={ui.cue}>{t('empty.restMode.body')}</p>
        <p className={ui.cue}>{t('restMode.grounding.1')}</p>
        <p className={ui.cue}>{t('restMode.grounding.2')}</p>
        <p className={ui.cue}>{t('restMode.grounding.3')}</p>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnLg} ${ui.btnPrimary}`}
          onClick={() => app.setRoute('today')}
        >
          Stay resting
        </button>
        <button
          type="button"
          className={`${ui.btn} ${ui.btnMuted}`}
          onClick={app.exitRest}
        >
          Leave softly
        </button>
      </section>
    ) : (
      <RestGate
        onEnter={app.enterRest}
        suggest={app.showRestSuggest || postHighRest}
        onDismissSuggest={() => {
          setPostHighRest(false);
          app.dismissRestSuggest();
        }}
      />
    );
  } else if (!app.state.load || loadEdit) {
    body = (
      <LoadPicker
        onChoose={(load) => {
          app.chooseLoad(load, !app.state.load);
          setLoadEdit(false);
        }}
        onSkip={() => {
          app.skipLoad();
          setLoadEdit(false);
        }}
      />
    );
  } else if (app.state.focus) {
    body = (
      <SingleFocusHUD
        session={app.state.focus}
        elapsedMs={app.elapsedMs}
        graceMs={app.graceMs}
        restMode={app.state.restMode}
        unstickOpen={app.unstickOpen}
        canSwap={app.canSwap}
        hyperfocusMinutes={app.state.settings.hyperfocusMinutes}
        bufferPercent={app.state.settings.bufferPercent}
        onBegin={app.beginFocus}
        onPause={app.pauseFocusAction}
        onDone={() => {
          const high = app.completeFocus();
          if (high) setPostHighRest(true);
        }}
        onNotThis={app.notThis}
        onSwap={app.swapFocus}
        onUnstick={() => app.openUnstick('standard')}
        onTooHard={app.tooHard}
        onOverwhelmed={app.overwhelmFocus}
        onDismissHyperfocus={app.dismissHyperfocus}
      />
    );
  } else {
    body = (
      <>
        {app.showComedownNudge ? (
          <div className={ui.card} style={{ marginBottom: 32 }}>
            <p className={ui.label}>{t('efficacy.comedownNudge.title')}</p>
            <p className={ui.cue}>{t('efficacy.comedownNudge.body')}</p>
            <button
              type="button"
              className={`${ui.btn} ${ui.btnGhost}`}
              onClick={app.dismissComedown}
            >
              {t('efficacy.comedownNudge.dismiss')}
            </button>
          </div>
        ) : null}
        {(app.showRestSuggest || postHighRest) && !app.state.restMode ? (
          <div className={ui.card} style={{ marginBottom: 32 }}>
            <p className={ui.label}>{t('restMode.enter.title')}</p>
            <p className={ui.cue}>{t('restMode.enter.body')}</p>
            <div className={ui.btnRow}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnPrimary}`}
                onClick={app.enterRest}
              >
                {t('restMode.enter.cta')}
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnGhost}`}
                onClick={() => {
                  setPostHighRest(false);
                  app.dismissRestSuggest();
                }}
              >
                {t('efficacy.comedownNudge.dismiss')}
              </button>
            </div>
          </div>
        ) : null}
        <DailyAnchorsList
          load={app.state.load}
          anchors={app.state.anchors}
          park={app.state.park}
          restMode={app.state.restMode}
          canAdd={app.canAdd}
          zone={app.pk.zone}
          bufferPercent={app.state.settings.bufferPercent}
          doneCount={app.state.completedToday.length}
          parkedToday={app.parkedToday}
          onStart={app.startAnchor}
          onChangeLoad={() => setLoadEdit(true)}
          onAdd={() => app.setAddOpen(true)}
          onStartPark={app.startParkItem}
          onRemovePark={app.removePark}
        />
      </>
    );
  }

  return (
    <>
      <AppShell
        route={navRoute}
        restMode={app.state.restMode}
        onNavigate={(r) => {
          app.setRoute(r);
          if (r === 'rest' && app.state.focus) {
            app.pauseFocusAction();
          }
        }}
      >
        {body}
      </AppShell>

      <ThoughtCaptureFab
        hidden={app.captureOpen || app.state.restMode}
        onClick={() => setCaptureOpen(true)}
      />
      <ThoughtCapture
        open={app.captureOpen}
        aiBrainDump={app.state.settings.aiBrainDump}
        bufferPercent={app.state.settings.bufferPercent}
        onClose={() => setCaptureOpen(false)}
        onSave={(text, load, rawMinutes) => app.parkThought(text, load, rawMinutes)}
      />
      <AddAnchorSheet
        open={app.addOpen}
        defaultLoad={app.state.load ?? 'low'}
        bufferPercent={app.state.settings.bufferPercent}
        onClose={() => app.setAddOpen(false)}
        onSave={app.addAnchor}
      />
      <UnstickSheet
        open={app.unstickOpen}
        depth={app.unstickDepth}
        onPick={() => {
          app.showToast({ title: t('unstick.done') });
          app.setUnstickOpen(false);
        }}
        onDismiss={() => app.setUnstickOpen(false)}
      />
      <OverwhelmSheet
        open={app.overwhelmOpen}
        canSwap={app.canSwap}
        onSwap={app.swapFromOverwhelm}
        onRest={app.enterRest}
        onDismiss={app.dismissOverwhelm}
      />
      <Toast toast={app.toast} />
      {restOverlay ? (
        <RestProtectionOverlay
          onStay={() => app.setRoute('rest')}
          onLeave={app.exitRest}
        />
      ) : null}
    </>
  );
}
