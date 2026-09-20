import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { AddAnchorSheet } from './components/AddAnchorSheet';
import { CarryForward } from './components/CarryForward';
import { DailyAnchorsList } from './components/DailyAnchorsList';
import { LoadPicker } from './components/LoadPicker';
import { MedsView } from './components/MedsView';
import { RestGate, RestProtectionOverlay } from './components/RestProtection';
import { SettingsView } from './components/SettingsView';
import { SingleFocusHUD } from './components/SingleFocusHUD';
import { ThoughtCapture, ThoughtCaptureFab } from './components/ThoughtCapture';
import { Toast } from './components/Toast';
import { UnstickSheet } from './components/UnstickSheet';
import { t } from './copy/t';
import { useAnchorApp } from './hooks/useAnchorApp';
import ui from './components/ui.module.css';

export default function App() {
  const app = useAnchorApp();
  const [loadEdit, setLoadEdit] = useState(false);
  const [postHighRest, setPostHighRest] = useState(false);
  const { setCaptureOpen, setUnstickOpen, setAddOpen } = app;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) {
        return;
      }
      if (e.key === 'c' || e.key === 'C' || e.key === '/') {
        e.preventDefault();
        setCaptureOpen(true);
      }
      if (e.key === 'Escape') {
        setCaptureOpen(false);
        setUnstickOpen(false);
        setAddOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setCaptureOpen, setUnstickOpen, setAddOpen]);

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
        onBegin={app.beginFocus}
        onPause={app.pauseFocusAction}
        onDone={() => {
          const high = app.completeFocus();
          if (high) setPostHighRest(true);
        }}
        onNotThis={app.notThis}
        onSwap={app.swapFocus}
        onUnstick={() => app.setUnstickOpen(true)}
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
        onClick={() => app.setCaptureOpen(true)}
      />
      <ThoughtCapture
        open={app.captureOpen}
        onClose={() => app.setCaptureOpen(false)}
        onSave={(text, load) => app.parkThought(text, load)}
      />
      <AddAnchorSheet
        open={app.addOpen}
        defaultLoad={app.state.load ?? 'low'}
        onClose={() => app.setAddOpen(false)}
        onSave={app.addAnchor}
      />
      <UnstickSheet
        open={app.unstickOpen}
        onPick={() => {
          app.showToast({ title: t('unstick.done') });
          app.setUnstickOpen(false);
        }}
        onDismiss={() => app.setUnstickOpen(false)}
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
