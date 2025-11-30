import { cn } from "@/lib/utils";
import { Check, LucideIcon } from "lucide-react";

interface Step {
  title: string;
  icon: LucideIcon;
}

interface LuxuryStepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

export function LuxuryStepIndicator({ steps, currentStep, onStepClick }: LuxuryStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const Icon = step.icon;

        return (
          <div key={index} className="flex items-center">
            <button
              onClick={() => onStepClick?.(index)}
              disabled={!onStepClick || index > currentStep}
              className={cn(
                "relative flex items-center justify-center transition-all duration-300",
                "w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2",
                isCompleted && "bg-[#C7B892] border-[#C7B892]",
                isActive && "bg-[#F5EFE1] border-[#C7B892] shadow-[0_0_0_4px_rgba(199,184,146,0.15)]",
                !isCompleted && !isActive && "bg-white border-[#E5DFC6]",
                onStepClick && index <= currentStep && "cursor-pointer hover:border-[#C7B892]",
                !onStepClick || index > currentStep ? "cursor-default" : ""
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 text-white" />
              ) : (
                <Icon className={cn(
                  "w-4 h-4",
                  isActive ? "text-[#0a2225]" : "text-[#9A9079]"
                )} />
              )}
            </button>
            
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-4 sm:w-6 h-0.5 mx-0.5",
                index < currentStep ? "bg-[#C7B892]" : "bg-[#E5DFC6]"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
