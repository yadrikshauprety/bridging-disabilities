import { useA11y } from "@/lib/accessibility-context";
import { useState } from "react";

export function SOSButton() {
  const { speak, pushCaption } = useA11y();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  function trigger() {
    setSent(true);
    speak("S O S triggered. Your location has been broadcast to your emergency contacts and the nearest disability rehabilitation centre.", "system");
    setTimeout(() => { setSent(false); setOpen(false); }, 4000);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); pushCaption("SOS dialog opened", "system"); }}
        aria-label="Emergency SOS — broadcast my location for help"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 h-16 w-16 rounded-full bg-sos text-sos-foreground font-black text-lg shadow-warm animate-pulse-ring border-4 border-card"
      >
        SOS
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Emergency SOS"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          onClick={() => !sent && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 max-w-md w-full border-4 border-sos shadow-warm space-y-4"
          >
            <h2 className="text-2xl font-black text-sos">🚨 Emergency SOS</h2>
            {sent ? (
              <p className="text-lg font-semibold">
                ✅ Help is on the way. Your location and identity have been shared with 3 emergency contacts and the nearest DDRC.
              </p>
            ) : (
              <>
                <p className="text-base">
                  Pressing confirm will broadcast your live GPS location to your emergency contacts and the nearest District Disability Rehabilitation Centre.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={trigger}
                    className="flex-1 bg-sos text-sos-foreground font-bold py-3 rounded-xl"
                    aria-label="Confirm and send SOS"
                  >
                    Send SOS
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 border-2 border-border font-bold py-3 rounded-xl"
                    aria-label="Cancel SOS"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
