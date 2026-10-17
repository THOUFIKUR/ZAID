/* CSS Module declarations — required for tsc --noEmit and build */
declare module '*.module.css' {
  const classes: Record<string, string>
  export default classes
}

/* Raw CSS imports (side-effect) */
declare module '*.css' {
  const css: string
  export default css
}
