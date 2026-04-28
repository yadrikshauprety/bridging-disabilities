export interface VoiceIntent {
  reply: string;
  to?: string;
}

const ROUTES: Array<{ patterns: RegExp[]; to: string; reply: string }> = [
  { patterns: [/(go to |open |show )?home|dashboard/i], to: "/app", reply: "Opening home" },
  { patterns: [/job/i], to: "/app/jobs", reply: "Opening jobs" },
  { patterns: [/scheme|benefit|pension/i], to: "/app/schemes", reply: "Opening schemes" },
  { patterns: [/udid|disability card|id card/i], to: "/app/udid", reply: "Opening U D I D navigator" },
  { patterns: [/map|hospital|nearest|find|nearby|bank|toilet|ramp/i], to: "/app/map", reply: "Opening accessibility map" },
  { patterns: [/communicat|caption|speech|tts|talk/i], to: "/app/communication", reply: "Opening communication tools" },
  { patterns: [/sign|braille|fingerspell/i], to: "/app/scripts", reply: "Opening sign and braille" },
  { patterns: [/profile|account|me/i], to: "/app/profile", reply: "Opening your profile" },
  { patterns: [/community|forum|people/i], to: "/app/community", reply: "Opening community" },
  { patterns: [/interview/i], to: "/app/interview", reply: "Opening sign language interview" },
];

export function matchVoiceCommand(raw: string): VoiceIntent {
  const text = raw.toLowerCase().trim();
  if (!text) return { reply: "I did not hear anything. Please try again." };

  if (/sos|help me|emergency/i.test(text)) {
    return { reply: "Triggering S O S. Use the red SOS button to confirm." };
  }
  if (/(what can|help|commands)/i.test(text)) {
    return { reply: "You can say: find nearest hospital, show jobs, open schemes, apply for U D I D, sign and braille, or interview." };
  }

  for (const r of ROUTES) {
    if (r.patterns.some((p) => p.test(text))) return { to: r.to, reply: r.reply };
  }
  return { reply: `I heard "${raw}". Try saying: show jobs, find nearest hospital, or open schemes.` };
}

export const VOICE_EXAMPLES = [
  "find nearest hospital",
  "show jobs",
  "open schemes",
  "apply for UDID",
  "go to sign language",
  "open communication tools",
];
