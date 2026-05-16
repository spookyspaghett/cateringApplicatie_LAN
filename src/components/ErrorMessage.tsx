export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  )
}
