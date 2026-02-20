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

            <div className="controls-row">
              <button className="primary" onClick={isRunning ? pause : start}>
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button className="secondary" onClick={reset}>
                Reset
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
