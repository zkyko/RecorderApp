"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface DocLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
}

export function DocLink({ href, children, className = "", external = false }: DocLinkProps) {
  const baseClasses = "text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1";
  
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${baseClasses} ${className}`}
      >
        {children}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <Link href={href} className={`${baseClasses} ${className}`}>
      {children}
    </Link>
  );
}

