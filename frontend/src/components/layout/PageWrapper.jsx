/**
 * Consistent page wrapper — max-width, padding, and min-height.
 */
export default function PageWrapper({ children }) {
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-8">
      {children}
    </main>
  );
}
