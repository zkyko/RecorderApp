import { ReactNode } from "react";

interface StepsProps {
  children: ReactNode;
}

export function Steps({ children }: StepsProps) {
  return (
    <div className="my-6 space-y-4">
      {children}
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  children: ReactNode;
}

export function Step({ number, title, children }: StepProps) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
          {number}
        </div>
      </div>
      <div className="flex-1 pt-1">
        <h4 className="text-lg font-semibold text-zinc-200 mb-2">{title}</h4>
        <div className="text-zinc-400 prose prose-invert prose-sm max-w-none">
          {children}
        </div>
      </div>
    </div>
  );
}

