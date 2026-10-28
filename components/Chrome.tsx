"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageCircle, PenLine, ShieldCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { t } from "@/lib/i18n";
import { UserMenu } from "@/components/UserMenu";
import { Gate } from "@/components/Gate";

const BOTTOM = [
  { href: "/", key: "nav.home", icon: Home },
  { href: "/explore", key: "nav.explore", icon: Compass },
  { href: "/create", key: "nav.create", icon: PenLine, create: true },
  { href: "/messages", key: "nav.messages", icon: MessageCircle },
];

export function Chrome({ children }: { children: React.ReactNode }) {
  const { state } = useStore();
  const pathname = usePathname();
  const locale = state.locale;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const locked = !state.viewerId;
  return (
    <div className={`shell${locked ? " shell--locked" : ""}`}>
      <a className="skiplink" href="#main">
        {locale === "en" ? "Skip to content" : "Lewati ke konten"}
      </a>
      <header className="topbar">
        <div className="wrap topbar__inner topbar__inner--center">
          <Link className="brand" href="/" aria-label="Temenin, home">
            <Image className="lockup lockup--light" src="/brand/lockup-navy-text.png" alt="Temenin" width={1200} height={477} sizes="240px" quality={90} priority />
            <Image className="lockup lockup--dark" src="/brand/lockup-cream-text.png" alt="" width={1200} height={477} sizes="240px" quality={90} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main id="main" className="main" inert={!state.viewerId ? true : undefined}>
        <div className="wrap page" key={pathname}>{children}</div>
      </main>
      <Gate />

      {state.viewerId && (
        <nav className="bottomnav" aria-label="Main">
          <ul className="wrap bottomnav__list">
            {BOTTOM.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    className={item.create ? "bottomnav__create" : "bottomnav__link"}
                    href={item.href}
                    aria-current={active(item.href) ? "page" : undefined}
                    aria-label={t(locale, item.key)}
                  >
                    <Icon size={22} aria-hidden="true" />
                    {!item.create && <span>{t(locale, item.key)}</span>}
                  </Link>
                </li>
              );
            })}
            <li>
              <UserMenu variant="nav" label={t(locale, "nav.you")} />
            </li>
          </ul>
        </nav>
      )}

      <footer className="footer">
        <div className="wrap footer__inner">
          <span className="footer__tagline">{t(locale, "app.tagline")}</span>
          <span className="row footer__facts">
            <span className="row" style={{ gap: "var(--space-2xs)" }}>
              <ShieldCheck size={16} aria-hidden="true" />
              {locale === "en" ? "Names, places and times unlock after verification" : "Nama, tempat, dan waktu terbuka setelah verifikasi"}
            </span>
            <span>{t(locale, "status.demo")}</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
