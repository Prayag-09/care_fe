import { ReactNode } from "react";

interface DefinitionListProps {
  children: ReactNode;
  className?: string;
}

interface DefinitionListItemProps {
  term: ReactNode;
  description: ReactNode;
}

export function DefinitionList({ children, className }: DefinitionListProps) {
  return (
    <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className || ""}`}>
      {children}
    </dl>
  );
}

export function DefinitionListItem({
  term,
  description,
}: DefinitionListItemProps) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{term}</dt>
      <dd className="mt-1">{description}</dd>
    </div>
  );
}
