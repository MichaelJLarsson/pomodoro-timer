import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  requestNotificationPermission,
  triggerPhaseAlert,
} from './features/alerts/alerts'
import { type TimerPhase, usePomodoroTimer } from './features/timer/usePomodoroTimer'

const phaseTitles: Record<TimerPhase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
}

const phaseDescriptions: Record<TimerPhase, string> = {
  focus: 'Stay on one task. Keep distractions out.',
  shortBreak: 'Stand up, breathe, and reset quickly.',
  longBreak: 'Step away and recover before the next cycle.',
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, seconds)
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
}

function PlayIcon() {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 5.14v13.72a1 1 0 001.53.85l10.1-6.86a1 1 0 000-1.7L9.53 4.29A1 1 0 008 5.14z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 5h3a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V6a1 1 0 011-1zm7 0h3a1 1 0 011 1v12a1 1 0 01-1 1h-3a1 1 0 01-1-1V6a1 1 0 011-1z" />
    </svg>
  )
}

type ResetIconVariant = 'refreshArrows' | 'rewindTail'

const RESET_ICON_VARIANT: ResetIconVariant = 'refreshArrows'

function ResetIcon() {
  const pathData: Record<ResetIconVariant, string> = {
    refreshArrows:
      'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
    rewindTail:
      'M12 4a8 8 0 00-8 8h2.2a5.8 5.8 0 111.7 4.1L6 18.1A8 8 0 1012 4zm-1.2 2.6L6.8 10l4 3.4V11h3.6V9h-3.6V6.6z',
  }

  return (
    <svg className="control-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d={pathData[RESET_ICON_VARIANT]}
      />
    </svg>
  )
}

function App() {
  const {
    phase,
    isRunning,
    remainingSeconds,
    completedFocusSessions,
    durations,
    transition,
    start,
    pause,
    reset,
    updateDurations,
  } = usePomodoroTimer()
  const [notificationState, setNotificationState] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [draftDurations, setDraftDurations] = useState(durations)
  const [panelHeights, setPanelHeights] = useState({ timer: 0, settings: 0 })
  const timerPanelRef = useRef<HTMLElement | null>(null)
  const settingsPanelRef = useRef<HTMLElement | null>(null)

  const title = useMemo(() => formatTime(remainingSeconds), [remainingSeconds])
  const panelGap = 16

  const revealHeight = isSettingsOpen ? panelHeights.settings : panelHeights.timer
  const revealOffset = isSettingsOpen ? -(panelHeights.timer + panelGap) : 0

  useEffect(() => {
    document.title = `${title} · ${phaseTitles[phase]}`
  }, [phase, title])

  useEffect(() => {
    if (!transition) {
      return
    }

    void triggerPhaseAlert({
      completedPhase: transition.from,
      nextPhase: transition.to,
      remainingFocusUntilLongBreak: 4 - ((completedFocusSessions % 4) || 4),
    })
  }, [transition, completedFocusSessions])

  const handleRequestNotifications = async () => {
    const permission = await requestNotificationPermission()
    setNotificationState(permission)
  }

  useEffect(() => {
    const measurePanels = () => {
      const timerHeight = timerPanelRef.current?.getBoundingClientRect().height ?? 0
      const settingsHeight = settingsPanelRef.current?.getBoundingClientRect().height ?? 0

      setPanelHeights({ timer: timerHeight, settings: settingsHeight })
    }

    measurePanels()
    window.addEventListener('resize', measurePanels)

    return () => window.removeEventListener('resize', measurePanels)
  }, [isSettingsOpen, draftDurations])

  const openSettings = () => {
    setDraftDurations(durations)
    setIsSettingsOpen(true)
  }

  const closeSettings = () => {
    setIsSettingsOpen(false)
  }

  const saveSettings = () => {
    updateDurations(draftDurations)
    setIsSettingsOpen(false)
  }

  return (
    <main className="app-shell">
      <div
        className="panel-reveal"
        style={revealHeight > 0 ? { height: `${revealHeight}px` } : undefined}
      >
        <div
          className="panel-track"
          style={{ transform: `translateY(${revealOffset}px)` }}
        >
          <section className="timer-card" aria-live="polite" ref={timerPanelRef}>
            <header className="timer-header">
              <p className="phase-label">{phaseTitles[phase]}</p>
              <h1 className="countdown">{title}</h1>
              <p className="phase-description">{phaseDescriptions[phase]}</p>
            </header>

            <div className="controls-stack">
              <button
                className="primary control-circle control-primary"
                onClick={isRunning ? pause : start}
                aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                title={isRunning ? 'Pause timer' : 'Start timer'}
              >
                {isRunning ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                className="secondary control-circle control-reset"
                onClick={reset}
                aria-label="Reset timer"
                title="Reset timer"
              >
                <ResetIcon />
              </button>
            </div>

            <p className="cycles">Completed focus sessions: {completedFocusSessions}</p>

            <button className="secondary full-width" onClick={openSettings}>
              Settings
            </button>
          </section>

          <section className="settings-card" ref={settingsPanelRef}>
            <h2>Session durations</h2>
            <div className="settings-grid">
              <label>
                Focus (min)
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={draftDurations.focusMinutes}
                  onChange={(event) =>
                    setDraftDurations((current) => ({
                      ...current,
                      focusMinutes: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Short break (min)
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draftDurations.shortBreakMinutes}
                  onChange={(event) =>
                    setDraftDurations((current) => ({
                      ...current,
                      shortBreakMinutes: Number(event.target.value),
                    }))
                  }
                />
              </label>

              <label>
                Long break (min)
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={draftDurations.longBreakMinutes}
                  onChange={(event) =>
                    setDraftDurations((current) => ({
                      ...current,
                      longBreakMinutes: Number(event.target.value),
                    }))
                  }
                />
              </label>
            </div>

            <div className="notification-row">
              <p>Browser notifications: {notificationState}</p>
              <button className="secondary" onClick={handleRequestNotifications}>
                Enable notifications
              </button>
            </div>

            <div className="settings-actions">
              <button className="secondary" onClick={closeSettings}>
                Cancel
              </button>
              <button className="primary" onClick={saveSettings}>
                Save settings
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default App
