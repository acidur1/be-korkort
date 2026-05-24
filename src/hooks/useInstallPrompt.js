import { useEffect, useState } from 'react'
import { useLocalStorage } from './useLocalStorage.js'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useLocalStorage('installBannerDismissed', false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    setShowIosInstructions(isIos && !isStandalone)

    function onBeforeInstall(e) {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    function onInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function promptInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setDeferredPrompt(null)
  }

  return {
    canPromptAndroid: Boolean(deferredPrompt),
    showIosInstructions,
    installed,
    dismissed,
    dismiss: () => setDismissed(true),
    promptInstall,
  }
}
