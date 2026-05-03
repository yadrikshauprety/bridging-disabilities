import { useState } from "react";
import { AUDIT_QUESTIONS } from "@/lib/survey-questions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border border-border shadow-xl">
        <div className="bg-white p-8">
          <DialogHeader className="mb-6">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Inclusion Audit</span>
              <span className="text-[10px] font-bold text-muted-foreground">{currentStep + 1} / {AUDIT_QUESTIONS.length}</span>
            </div>
            <DialogTitle className="text-xl font-black">
              {currentQuestion.category} Accessibility
            </DialogTitle>
            <div className="h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </DialogHeader>

          <div className="py-6 border-y border-border/50">
            <p className="text-lg font-bold text-gray-800 leading-snug">
              {currentQuestion.q}
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleAnswer(true)}
                className="py-6 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90"
              >
                YES
              </Button>
              <Button 
                onClick={() => handleAnswer(false)}
                variant="outline"
                className="py-6 rounded-xl border-2 border-border font-bold hover:bg-muted"
              >
                NO
              </Button>
            </div>
            
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              Skip for now
            </Button>
          </div>
          
          <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-4">
            Please answer truthfully for compliance tracking
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
