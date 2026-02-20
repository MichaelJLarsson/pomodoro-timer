export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak'

export type TimerDurations = {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
}

export type PhaseTransition = {
  id: number
  from: TimerPhase
  to: TimerPhase
}
