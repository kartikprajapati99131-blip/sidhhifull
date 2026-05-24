"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Menu, X } from "lucide-react";

export default function RippleNavbar() {
  const canvasRef = useRef(null);
  const waves = useRef([]);
  const mouse = useRef({ x: 0, y: 0, active: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const WATER_COLOR = [56, 189, 248]; // sky-400

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Ripple canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const nav = canvas.parentElement;

    const resizeCanvas = () => {
      const rect = nav.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    class Wave {
      constructor(x, y, boost = 1) {
        this.x = x;
        this.y = y;
        this.size = 0;
        this.opacity = 0.45 * boost;
        this.speed = 2.5 * boost;
      }
      update() {
        this.size += this.speed;
        this.opacity *= 0.955;
      }
      draw() {
        ctx.beginPath();
        ctx.shadowBlur = 24;
        ctx.shadowColor = `rgba(${WATER_COLOR[0]},${WATER_COLOR[1]},${WATER_COLOR[2]},0.25)`;
        const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        g.addColorStop(0, `rgba(${WATER_COLOR[0]},${WATER_COLOR[1]},${WATER_COLOR[2]},${this.opacity})`);
        g.addColorStop(0.5, `rgba(${WATER_COLOR[0]},${WATER_COLOR[1]},${WATER_COLOR[2]},${this.opacity * 0.3})`);
        g.addColorStop(1, `rgba(${WATER_COLOR[0]},${WATER_COLOR[1]},${WATER_COLOR[2]},0)`);
        ctx.fillStyle = g;
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let lastEmit = 0;
    let rafId;

    const animate = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (mouse.current.active && time - lastEmit > 30) {
        waves.current.unshift(new Wave(mouse.current.x, mouse.current.y));
        lastEmit = time;
      }

      for (let i = waves.current.length - 1; i >= 0; i--) {
        const w = waves.current[i];
        w.update();
        w.draw();
        if (w.opacity < 0.015) waves.current.splice(i, 1);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    const handleMove = (e) => {
      const rect = nav.getBoundingClientRect();
      mouse.current.x += (e.clientX - rect.left - mouse.current.x) * 0.15;
      mouse.current.y += (e.clientY - rect.top - mouse.current.y) * 0.15;
    };
    const handleEnter = () => (mouse.current.active = true);
    const handleLeave = () => (mouse.current.active = false);
    const handleClick = () => {
      for (let i = 0; i < 7; i++) {
        waves.current.unshift(new Wave(mouse.current.x, mouse.current.y, 2));
      }
    };

    nav.addEventListener("mousemove", handleMove);
    nav.addEventListener("mouseenter", handleEnter);
    nav.addEventListener("mouseleave", handleLeave);
    nav.addEventListener("click", handleClick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
      nav.removeEventListener("mousemove", handleMove);
      nav.removeEventListener("mouseenter", handleEnter);
      nav.removeEventListener("mouseleave", handleLeave);
      nav.removeEventListener("click", handleClick);
    };
  }, []);

  const { cart } = useCart();
  const cartCount = cart.reduce((acc, item) => acc + item.qty, 0);

  const navLinks = [
    { name: "Home", href: "" },
    { name: "About", href: "about" },
    { name: "Shop", href: "shop" },
    { name: "Projects", href: "projects" },
    // { name: "Orders", href: "yourorders" },
    { name: "Contact", href: "contact" },
  ];

  return (
    <>
      {/* ── Desktop navbar ── */}
      <nav
        className={`
          relative hidden md:flex
          w-full max-w-5xl mx-auto mt-5
          h-14 rounded-2xl
          items-center justify-center px-8
          bg-white/70 backdrop-blur-xl
          border border-white/60
          transition-shadow duration-500
          overflow-hidden
          ${scrolled ? "shadow-[0_8px_40px_rgba(56,189,248,0.18),0_2px_12px_rgba(0,0,0,0.08)]" : "shadow-[0_4px_24px_rgba(0,0,0,0.06)]"}
        `}
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.82) 0%, rgba(240,249,255,0.78) 100%)",
        }}
      >
        {/* Aurora shimmer strip */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.18) 40%, rgba(186,230,255,0.22) 60%, transparent 100%)",
          }}
        />

        {/* Ripple canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 z-0 rounded-2xl" />

        {/* Links */}
        <ul className="relative z-10 flex items-center gap-1">
          {navLinks.map((item) => (
            <li key={item.href}>
              <Link
                href={`/${item.href}`}
                className="
                  relative group px-4 py-2 rounded-xl
                  text-[13.5px] font-medium tracking-wide text-slate-600
                  hover:text-sky-600 transition-colors duration-200
                "
              >
                {/* Ink hover bg */}
                <span
                  className="
                    absolute inset-0 rounded-xl bg-sky-50 scale-75 opacity-0
                    group-hover:scale-100 group-hover:opacity-100
                    transition-all duration-200 ease-out
                  "
                />
                <span className="relative">{item.name}</span>
              </Link>
            </li>
          ))}

          {/* Cart */}
          <li className="ml-2">
            <Link href="/cart">
              <div
                className="
                  relative flex items-center justify-center
                  w-10 h-10 rounded-xl
                  text-slate-600 hover:text-sky-600
                  hover:bg-sky-50 transition-all duration-200
                "
              >
                <ShoppingCart size={20} strokeWidth={1.8} />
                {cartCount > 0 && (
                  <span
                    className="
                      absolute -top-0.5 -right-0.5
                      min-w-[18px] h-[18px] px-1
                      bg-sky-500 text-white text-[10px] font-bold
                      rounded-full flex items-center justify-center
                      shadow-sm animate-bounce-once
                    "
                  >
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </li>
        </ul>
      </nav>

      {/* ── Mobile navbar ── */}
      <div className="md:hidden w-full px-4 mt-6">
        <nav
          className={`
      relative flex items-center justify-between
      px-5 h-16 rounded-2xl
      bg-white/80 backdrop-blur-xl
      border border-white/60
      overflow-hidden
      ${scrolled
              ? "shadow-[0_8px_32px_rgba(56,189,248,0.15),0_2px_8px_rgba(0,0,0,0.08)]"
              : "shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            }
    `}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.88) 0%, rgba(240,249,255,0.84) 100%)",
          }}
        >
          {/* Aurora shimmer */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.15) 50%, transparent 100%)",
            }}
          />

          {/* Brand */}
          <div className="relative z-10 flex items-center">
             <Link href="/cart">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-sky-50 transition-all duration-200">
                <ShoppingCart
                  size={20}
                  strokeWidth={1.8}
                  className="text-slate-600"
                />

                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-sky-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                    {cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="relative z-10 flex items-center gap-10">
            {/* Cart */}
           

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="
          flex items-center justify-center
          w-10 h-10 rounded-2xl
          hover:bg-sky-50
          transition-all duration-200
          text-slate-600
        "
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X size={21} strokeWidth={2} />
              ) : (
                <Menu size={21} strokeWidth={2} />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown */}
        <div
          className={`
      overflow-hidden transition-all duration-300 ease-in-out
      ${menuOpen
              ? "max-h-[500px] opacity-100 mt-4"
              : "max-h-0 opacity-0"
            }
    `}
        >
          <div
            className="
        rounded-3xl border border-white/60
        bg-white/85 backdrop-blur-xl
        shadow-[0_8px_32px_rgba(56,189,248,0.12),0_2px_8px_rgba(0,0,0,0.06)]
        px-3 py-3
        flex flex-col gap-2
      "
            style={{
              background:
                "linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(240,249,255,0.88) 100%)",
            }}
          >
            {navLinks.map((item, i) => (
              <Link
                key={item.href}
                href={`/${item.href}`}
                onClick={() => setMenuOpen(false)}
                className="
            flex items-center gap-4
            px-5 py-4 rounded-2xl
            text-[15px] font-medium
            text-slate-600
            hover:text-sky-600
            hover:bg-sky-50/80
            transition-all duration-200
          "
                style={{
                  animationDelay: `${i * 40}ms`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 opacity-70" />

                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}