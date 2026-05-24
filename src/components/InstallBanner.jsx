export default function InstallBanner({ canPromptAndroid, showIosInstructions, dismissed, dismiss, onPromptInstall }) {
  if (dismissed) return null
  if (!canPromptAndroid && !showIosInstructions) return null

  return (
    <div className="install-banner">
      <div className="install-banner-text">
        {canPromptAndroid
          ? 'Installera appen för snabbare åtkomst.'
          : <>Installera appen: tryck <strong>⬆ Dela</strong> och sedan <strong>"Lägg till på hemskärmen"</strong>.</>}
      </div>
      <div className="install-banner-actions">
        {canPromptAndroid && (
          <button className="install-banner-btn" onClick={onPromptInstall}>
            Installera
          </button>
        )}
        <button className="install-banner-btn" onClick={dismiss} aria-label="Stäng">
          ✕
        </button>
      </div>
    </div>
  )
}
