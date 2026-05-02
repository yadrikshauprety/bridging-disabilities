import { useState } from "react";
import { AUDIT_QUESTIONS } from "@/lib/survey-questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface SurveyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (score: number, answers: Record<number, boolean>) => void;
}

export function SurveyModal({ open, onOpenChange, onComplete }: SurveyModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});

  const handleAnswer = (answer: boolean) => {
    const questionId = AUDIT_QUESTIONS[currentStep].id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    if (currentStep < AUDIT_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate score
      const yesCount = Object.values(newAnswers).filter(Boolean).length;
      const score = Math.round((yesCount / AUDIT_QUESTIONS.length) * 100);
      onComplete(score, newAnswers);
      onOpenChange(false);
    }
  };

  const currentQuestion = AUDIT_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / AUDIT_QUESTIONS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
        <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 text-white">
          <DialogHeader className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Inclusion Audit</span>
              <span className="text-[10px] font-black text-white/50">{currentStep + 1} / {AUDIT_QUESTIONS.length}</span>
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight leading-tight">
              {currentQuestion.category} Accessibility
            </DialogTitle>
            <Progress value={progress} className="h-1.5 bg-white/10 mt-4" />
          </DialogHeader>

          <div className="min-h-[120px] flex items-center">
            <p className="text-xl font-bold leading-relaxed text-slate-200 italic">
              "{currentQuestion.q}"
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-12">
            <Button 
              onClick={() => handleAnswer(true)}
              className="py-8 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-black text-lg shadow-lg hover:scale-[1.02] transition-transform"
            >
              YES
            </Button>
            <Button 
              onClick={() => handleAnswer(false)}
              className="py-8 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-lg shadow-lg hover:scale-[1.02] transition-transform"
            >
              NO
            </Button>
          </div>
          
          <p className="text-center text-[10px] font-bold text-white/30 uppercase tracking-widest mt-8">
            Please answer truthfully for compliance tracking
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
