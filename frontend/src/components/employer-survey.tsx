import { useState } from "react";
import { EMPLOYER_SURVEY_QUESTIONS } from "@/lib/survey-questions";

interface SurveyModalProps {
  onComplete: (hasBadge: boolean, answers: Record<number, boolean>) => void;
}

export function SurveyModal({ onComplete }: SurveyModalProps) {
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [step, setStep] = useState(0);

  const handleAnswer = (val: boolean) => {
    const nextAnswers = { ...answers, [step]: val };
    setAnswers(nextAnswers);
    if (step < EMPLOYER_SURVEY_QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      const yesCount = Object.values(nextAnswers).filter(Boolean).length;
      const hasBadge = yesCount >= 15; // 75% of 20
      onComplete(hasBadge, nextAnswers);
    }
  };

  const progress = Math.round(((step + 1) / EMPLOYER_SURVEY_QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border-2 border-primary/20 overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <h2 className="text-2xl font-black">Workplace Inclusion Audit</h2>
          <p className="opacity-90 text-sm">Help us verify your workplace accessibility.</p>
        </div>
        
        <div className="p-8">
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground mb-2">
              <span>Question {step + 1} of 20</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <h3 className="text-xl font-bold leading-tight min-h-[5rem]">
            {EMPLOYER_SURVEY_QUESTIONS[step]}
          </h3>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => handleAnswer(true)}
              className="rounded-2xl border-2 border-primary bg-primary/5 py-4 font-black text-primary hover:bg-primary hover:text-primary-foreground transition"
            >
              YES
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="rounded-2xl border-2 border-border py-4 font-bold text-muted-foreground hover:border-primary transition"
            >
              NO / NOT YET
            </button>
          </div>
        </div>

        <div className="px-8 pb-6 text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
          DisabilityBridge Inclusion Standards
        </div>
      </div>
    </div>
  );
}
