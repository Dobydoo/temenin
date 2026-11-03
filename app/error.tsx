"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card stack" role="alert">
      <h1>Something went wrong · Ada yang salah</h1>
      <p className="muted">Please try again. Your plans are safe on this device · Silakan coba lagi. Rencanamu aman di perangkat ini.</p>
      <div className="row">
        <button type="button" className="btn" onClick={() => retry()}>
          Try again · Coba lagi
        </button>
        <Link className="btn btn--quiet" href="/">
          Back home · Ke beranda
        </Link>
      </div>
    </div>
  );
}
