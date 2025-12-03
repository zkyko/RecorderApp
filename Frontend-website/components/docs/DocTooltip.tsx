"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import Link from "next/link";

interface DocTooltipProps {
  term: string;
  explanation: string;
  link?: string;
  linkText?: string;
}

export function DocTooltip({ term, explanation, link, linkText }: DocTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tooltipRef.current &&
        buttonRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <span className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-dotted transition-colors inline-flex items-center gap-1 cursor-help"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-label={`${term} - ${explanation}`}
      >
        {term}
        <Info className="w-3 h-3 opacity-70" />
      </button>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-72 max-w-[calc(100vw-2rem)] p-3 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl text-sm text-zinc-300 left-0 top-full sm:left-0"
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <p className="mb-2 leading-relaxed">{explanation}</p>
          {link && (
            <Link
              href={link}
              className="text-blue-400 hover:text-blue-300 text-xs font-medium inline-flex items-center gap-1 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {linkText || "Learn more"}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {/* Arrow */}
          <div className="absolute -top-1 left-4 w-2 h-2 bg-zinc-800 border-l border-t border-zinc-700 rotate-45"></div>
        </div>
      )}
    </span>
  );
}

