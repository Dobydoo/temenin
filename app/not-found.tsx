import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card stack">
      <h1>Page not found · Halaman tidak ada</h1>
      <p className="muted">That plan wandered off · Rencana itu nyasar entah ke mana.</p>
      <div className="row">
        <Link className="btn" href="/">
          Back home · Ke beranda
        </Link>
      </div>
    </div>
  );
}
