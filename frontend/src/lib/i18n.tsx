import { useA11y } from "./accessibility-context";

export function useT() {
  const { language } = useA11y();

  // Simple translation function
  // In a real app, this would use a dictionary
  const t = (text: string) => {
    // Basic Hindi mapping for demonstration
    if (language === "Hindi") {
      const dict: Record<string, string> = {
        "Community Forum": "सामुदायिक मंच",
        "Share accessibility tips, jobs, and local updates.": "पहुँच संबंधी सुझाव, नौकरियां और स्थानीय अपडेट साझा करें।",
        "Feed": "फ़ीड",
        "Stats": "आंकड़े",
        "🛡️ Moderation": "🛡️ मॉडरेशन",
        "Post": "पोस्ट करें",
        "Share a tip, job, or update...": "सुझाव, नौकरी या अपडेट साझा करें...",
        "All": "सभी",
        "Navigation": "नेविगेशन",
        "Jobs": "नौकरियां",
        "Schemes": "योजनाएं",
        "Alert": "अलर्ट",
        "General": "सामान्य",
        "Report Post": "पोस्ट की रिपोर्ट करें",
        "Cancel": "रद्द करें",
        "Submit report": "रिपोर्ट सबमिट करें",
        "d ago": "दिन पहले",
        "h ago": "घंटे पहले",
        "m ago": "मिनट पहले",
        "just now": "अभी",
        "Anonymous": "अनाम"
      };
      return dict[text] || text;
    }
    return text;
  };

  return t;
}
