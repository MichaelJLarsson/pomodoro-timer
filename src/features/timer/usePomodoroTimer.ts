import { useEffect, useMemo, useRef, useState } from 'react'
import { type PhaseTransition, type TimerDurations, type TimerPhase } from './types'

type DurationUpdate = Partial<TimerDurations>

const DEFAULT_DURATIONS: TimerDurations = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
}

const FOUR_SESSIONS = 4

function clampDuration(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.max(min, Math.min(max, Math.round(value)))
}

function getDurationSeconds(phase: TimerPhase, durations: TimerDurations): number {
  if (phase === 'focus') {
    return durations.focusMinutes * 60
  }

  if (phase === 'shortBreak') {
    return durations.shortBreakMinutes * 60
  }

  return durations.longBreakMinutes * 60
}

function calculateNextPhase(
  currentPhase: TimerPhase,
  completedFocusSessions: number,
): { nextPhase: TimerPhase; nextCompletedFocusSessions: number } {
  if (currentPhase === 'focus') {
    const nextCompletedFocusSessions = completedFocusSessions + 1
    const nextPhase =
      nextCompletedFocusSessions % FOUR_SESSIONS === 0 ? 'longBreak' : 'shortBreak'

    return { nextPhase, nextCompletedFocusSessions }
  }

  return {
    nextPhase: 'focus',
    nextCompletedFocusSessions: completedFocusSessions,
  }
}

export function usePomodoroTimer() {
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [durations, setDurations] = useState<TimerDurations>(DEFAULT_DURATIONS)
  const [isRunning, setIsRunning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(
    DEFAULT_DURATIONS.focusMinutes * 60,
  )
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0)
  const [transition, setTransition] = useState<PhaseTransition | null>(null)

  const deadlineRef = useRef<number | null>(null)
  const transitionCounterRef = useRef(0)

  const activeDurationSeconds = useMemo(
    () => getDurationSeconds(phase, durations),
    [phase, durations],
  )

  useEffect(() => {
    if (!isRunning) {
      return
    }

    const intervalId = window.setInterval(() => {
      const deadline = deadlineRef.current
      if (!deadline) {
        return
      }

      const nextSeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      if (nextSeconds > 0) {
        setRemainingSeconds(nextSeconds)
        return
      }

      setIsRunning(false)

      setPhase((previousPhase) => {
        let nextPhaseState: TimerPhase = 'focus'

        setCompletedFocusSessions((previousCompleted) => {
          const phaseResult = calculateNextPhase(previousPhase, previousCompleted)
          nextPhaseState = phaseResult.nextPhase

          transitionCounterRef.current += 1
          setTransition({
            id: transitionCounterRef.current,
            from: previousPhase,
            to: phaseResult.nextPhase,
          })

          return phaseResult.nextCompletedFocusSessions
        })

        setRemainingSeconds(getDurationSeconds(nextPhaseState, durations))
        deadlineRef.current = null
        return nextPhaseState
      })
    }, 250)

    return () => window.clearInterval(intervalId)
  }, [durations, isRunning])

  const start = () => {
    const initialRemainingSeconds =
      remainingSeconds <= 0 ? activeDurationSeconds : remainingSeconds
    if (remainingSeconds <= 0) {
      setRemainingSeconds(activeDurationSeconds)
    }

    deadlineRef.current = Date.now() + Math.max(1, initialRemainingSeconds) * 1000
    setIsRunning(true)
  }

  const pause = () => {
    if (!deadlineRef.current) {
      setIsRunning(false)
      return
    }

    const nextSeconds = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
    setRemainingSeconds(nextSeconds)
    deadlineRef.current = null
    setIsRunning(false)
  }

  const reset = () => {
    setIsRunning(false)
    setRemainingSeconds(getDurationSeconds(phase, durations))
    deadlineRef.current = null
  }

  const updateDurations = (update: DurationUpdate) => {
    setDurations((currentDurations) => {
      const nextDurations: TimerDurations = {
        focusMinutes: clampDuration(
          update.focusMinutes ?? currentDurations.focusMinutes,
          1,
          180,
        ),
        shortBreakMinutes: clampDuration(
          update.shortBreakMinutes ?? currentDurations.shortBreakMinutes,
          1,
          60,
        ),
        longBreakMinutes: clampDuration(
          update.longBreakMinutes ?? currentDurations.longBreakMinutes,
          1,
          90,
        ),
      }

      if (!isRunning) {
        setRemainingSeconds(getDurationSeconds(phase, nextDurations))
      }

      return nextDurations
    })
  }

  return {
    phase,
    durations,
    isRunning,
    remainingSeconds,
    completedFocusSessions,
    transition,
    start,
    pause,
    reset,
    updateDurations,
  }
}

export type { TimerPhase }