import type { TimerPhase } from '../timer/types'

type AlertPayload = {
  completedPhase: TimerPhase
  nextPhase: TimerPhase
  remainingFocusUntilLongBreak: number
}

const phaseLabels: Record<TimerPhase, string> = {
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
}

function phaseMessage(payload: AlertPayload): string {
  if (payload.completedPhase === 'focus') {
    if (payload.nextPhase === 'longBreak') {
      return 'Focus session complete. Time for a long break.'
    }

    return `Focus session complete. ${payload.remainingFocusUntilLongBreak} more until long break.`
  }

  return 'Break finished. Time to focus again.'
}

function playAlertTone() {
  const audioContextApi = window.AudioContext
  if (!audioContextApi) {
    return
  }

  const context = new audioContextApi()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, context.currentTime)
  oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12)

  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.16, context.currentTime + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.26)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.28)

  oscillator.onended = () => {
    void context.close()
  }
}

function vibrateDevice() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate([180, 100, 180])
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') {
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return Notification.permission
  }

  return Notification.requestPermission()
}

export async function triggerPhaseAlert(payload: AlertPayload): Promise<void> {
  playAlertTone()
  vibrateDevice()

  if (typeof Notification === 'undefined') {
    return
  }

  let permission = Notification.permission
  if (permission === 'default') {
    permission = await requestNotificationPermission()
  }

  if (permission !== 'granted') {
    return
  }

  new Notification(`${phaseLabels[payload.completedPhase]} done`, {
    body: phaseMessage(payload),
    tag: 'pomodoro-phase-alert',
  })
}