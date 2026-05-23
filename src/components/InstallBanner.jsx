export default function InstallBanner({ canPromptAndroid, showIosInstructions, dismissed, dismiss, onPromptInstall }) {
  if (dismissed) return null
  if (!canPromptAndroid && !showIosInstructions) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-blue-700 text-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 flex items-center justify-between gap-3 shadow-lg">
      <div className="text-sm">
        {canPromptAndroid
          ? 'Installera appen för snabbare åtkomst.'
          : <>Installera appen: tryck <strong>⎋ Dela</strong> och sedan <strong>"Lägg till på hemskärmen"</strong>.</>}
      </div>
      <div className="flex gap-2 flex-shrink-0">
        {canPromptAndroid && (
          <button
            onClick={onPromptInstall}
            className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-1.5 text-sm font-semibold"
          >
            Installera
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Stäng"
          className="bg-white/20 hover:bg-white/30 rounded-md px-3 py-1.5 text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
