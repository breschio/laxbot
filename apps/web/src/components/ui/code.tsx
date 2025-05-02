import React from "react";
import { cn } from "@/lib/utils";

interface CodeProps {
  children: React.ReactNode;
  language?: string;
  className?: string;
}

export const Code: React.FC<CodeProps> = ({
  children,
  language,
  className,
  ...props
}) => {
  return (
    <pre
      className={cn(
        "rounded-md bg-gray-100 p-4 dark:bg-gray-800 overflow-x-auto",
        className
      )}
      {...props}
    >
      <code className={language ? `language-${language}` : undefined}>
        {children}
      </code>
    </pre>
  );
}; 