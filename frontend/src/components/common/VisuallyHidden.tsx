import type { ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
}

/** Renders content that is visible to screen readers but not visually. */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="visually-hidden">{children}</span>
}
