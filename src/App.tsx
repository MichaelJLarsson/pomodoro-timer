import { useEffect, useMemo, useState } from 'react'
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

  const title = useMemo(() => formatTime(remainingSeconds), [remainingSeconds])

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

  return (
    <main className="app-shell">
      <section className="timer-card" aria-live="polite">
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
      </section>

      <section className="settings-card">
        <h2>Session durations</h2>
        <div className="settings-grid">
          <label>
            Focus (min)
            <input
              type="number"
              min={1}
              max={180}
              value={durations.focusMinutes}
              onChange={(event) =>
                updateDurations({ focusMinutes: Number(event.target.value) })
              }
            />
          </label>

          <label>
            Short break (min)
            <input
              type="number"
              min={1}
              max={60}
              value={durations.shortBreakMinutes}
              onChange={(event) =>
                updateDurations({ shortBreakMinutes: Number(event.target.value) })
              }
            />
          </label>

          <label>
            Long break (min)
            <input
              type="number"
              min={1}
              max={90}
              value={durations.longBreakMinutes}
              onChange={(event) =>
                updateDurations({ longBreakMinutes: Number(event.target.value) })
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
      </section>
    </main>
  )
}

export default App
