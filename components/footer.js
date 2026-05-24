"use client";
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-gray-300 text-black px-6 pt-14 pb-6">

      {/* Top divider line with accent dot */}
      <div className="max-w-7xl mx-auto flex items-center gap-3 mb-12">
        <div className="flex-1 h-px bg-black/15" />
        <span style={{
          display: 'inline-block', width: 7, height: 7,
          borderRadius: '50%', background: '#b8956a', flexShrink: 0
        }} />
        <div className="flex-1 h-px bg-black/15" />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">

        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <Link href="/">
            <Image src="/s-black.svg" alt="Siddhi Logo" width={150} height={120} priority className="h-auto w-36 mb-4" />
          </Link>
          <p className="text-sm text-black/60 leading-relaxed max-w-[220px]">
            Premium products delivered fast and securely.
          </p>
          {/* Social icons under brand */}
          <div className="flex gap-3 mt-5">
            {[
              { Icon: FaFacebook, label: "Facebook" },
              { Icon: FaInstagram, label: "Instagram" },
              { Icon: FaTwitter, label: "Twitter" },
              { Icon: FaLinkedin, label: "LinkedIn" },
            ].map(({ Icon, label }) => (
              <button
                key={label}
                aria-label={label}
                style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.08)',
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
                  color: 'rgba(0,0,0,0.55)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#b8956a'
                  e.currentTarget.style.borderColor = '#b8956a'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(0,0,0,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'
                  e.currentTarget.style.color = 'rgba(0,0,0,0.55)'
                }}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', color: 'rgba(0,0,0,0.45)' }}>
            Quick Links
          </h3>
          <ul className="space-y-2 text-sm">
            {[['/', 'Home'], ['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']].map(([href, label]) => (
              <li key={label}>
                <Link
                  href={href}
                  style={{ color: 'rgba(0,0,0,0.7)', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#b8956a'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.7)'}
                >
                  <span style={{ width: 12, height: 1, background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', color: 'rgba(0,0,0,0.45)' }}>
            Support
          </h3>
          <ul className="space-y-2 text-sm">
            {[['/contact', 'Help Center'], ['#', 'Returns'], ['#', 'Shipping'], ['#', 'FAQ']].map(([href, label]) => (
              <li key={label}>
                <Link
                  href={href}
                  style={{ color: 'rgba(0,0,0,0.7)', textDecoration: 'none', transition: 'color 0.15s', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#b8956a'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.7)'}
                >
                  <span style={{ width: 12, height: 1, background: 'currentColor', display: 'inline-block', flexShrink: 0 }} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter / Stay in touch */}
        <div>
          <h3 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '1rem', color: 'rgba(0,0,0,0.45)' }}>
            Stay in touch
          </h3>
          <p className="text-sm text-black/60 mb-3 leading-relaxed">
            Get updates on new arrivals and exclusive offers.
          </p>
          <div style={{ display: 'flex', gap: 0 }}>
            <input
              type="email"
              placeholder="your@email.com"
              style={{
                flex: 1, padding: '0.52rem 0.75rem',
                background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.15)',
                borderRight: 'none', borderRadius: '6px 0 0 6px',
                fontSize: 13, color: '#1a1814', outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              style={{
                padding: '0.52rem 0.9rem',
                background: '#1a1814', color: '#faf8f5',
                border: '1px solid #1a1814',
                borderRadius: '0 6px 6px 0',
                fontSize: 13, fontFamily: 'inherit',
                cursor: 'pointer', fontWeight: 500,
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#b8956a'}
              onMouseLeave={e => e.currentTarget.style.background = '#1a1814'}
            >
              →
            </button>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto">
        <div style={{ height: 1, background: 'rgba(0,0,0,0.12)', margin: '2.5rem 0 1.25rem' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: 0 }}>
            © {new Date().getFullYear()} Siddhi. All rights reserved.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', margin: 0, display: 'flex', alignItems: 'center', gap: 5 }}>
            Made with
            <span style={{ color: '#b8956a', fontSize: 13 }}>♥</span>
            by{' '}
            <span style={{ color: 'rgba(0,0,0,0.72)', fontWeight: 500, letterSpacing: '0.02em' }}>
              Kartik Prajapati
            </span>
          </p>
        </div>
      </div>

    </footer>
  );
}