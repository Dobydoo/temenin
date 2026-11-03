export default function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-label="Loading">
      <div className="card" aria-hidden="true">
        <p className="muted">Loading… · Memuat…</p>
      </div>
    </div>
  );
}
