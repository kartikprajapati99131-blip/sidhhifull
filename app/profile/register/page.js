"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { useRouter } from 'next/navigation'

const Register = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmpassword: "",
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("All fields are required", { position: "top-center", theme: "light" }); return
    }
    if (!form.email.includes("@")) {
      toast.error("Invalid email", { position: "top-center", theme: "light" }); return
    }
    if (!/^[6-9]\d{9}$/.test(form.phone)) {
      toast.error("Invalid Indian phone number", { position: "top-center", theme: "light" }); return
    }
    if (form.password !== form.confirmpassword) {
      toast.error("Passwords do not match", { position: "top-center", theme: "light" }); return
    }

    setLoading(true)
    try {
      const baseUsername = form.name.replace(/\s+/g, "").toLowerCase()
      const username = baseUsername + Math.floor(1000 + Math.random() * 9000)
      const res = await fetch("/api/user/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username }),
      })
      const data = await res.json()
      if (!data.success) {
        toast.warn(data.message, { position: "top-center", autoClose: 3000, theme: "light" })
        setLoading(false); return
      }
      toast.success("Account created successfully!")
      setTimeout(() => router.replace("/login"), 2000)
    } catch {
      toast.error("Something went wrong")
      setLoading(false)
    }
    setForm({ name: "", email: "", phone: "", password: "", confirmpassword: "" })
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={5000} theme="light" transition={Bounce} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500&display=swap');

        .rg { min-height: 100vh; display: flex; font-family: 'Outfit', sans-serif; background: #faf8f5; color: #1a1814; }

        .rg-left {
          flex: 1; position: relative; display: flex;
          flex-direction: column; justify-content: space-between;
          padding: 2.5rem; overflow: hidden; min-height: 100vh;
        }
        .rg-bg { position: absolute; inset: 0; z-index: 0; }
        .rg-tint {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(180deg, rgba(250,248,245,0.15) 0%, rgba(250,248,245,0.06) 40%, rgba(250,248,245,0.75) 100%);
        }
        .rg-dots {
          position: absolute; top: 2rem; right: 2rem; z-index: 2;
          display: grid; grid-template-columns: repeat(5,6px); gap: 5px; opacity: 0.4;
        }
        .rg-dots span { width: 4px; height: 4px; border-radius: 50%; background: #fff; display: block; }
        .rg-top { position: relative; z-index: 2; }
        .rg-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.65rem; font-weight: 600; color: #fff; letter-spacing: 0.1em; text-shadow: 0 1px 10px rgba(0,0,0,0.2); }
        .rg-bottom { position: relative; z-index: 2; }
        .rg-pill {
          display: inline-block; font-size: 10.5px; letter-spacing: 0.18em;
          text-transform: uppercase; color: #7a5c30; font-weight: 500; margin-bottom: 0.8rem;
          background: rgba(250,248,245,0.88); padding: 4px 14px; border-radius: 100px;
        }
        .rg-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem,3.5vw,3rem); font-weight: 400; line-height: 1.12; color: #1a1814; margin-bottom: 0.85rem; }
        .rg-h1 em { font-style: italic; color: #b8956a; }
        .rg-desc { font-size: 13.5px; color: rgba(26,24,20,0.52); font-weight: 300; line-height: 1.7; max-width: 310px; }

        .rg-right {
          width: 500px; flex-shrink: 0; background: #ffffff;
          border-left: 1px solid #ede9e2;
          display: flex; flex-direction: column; justify-content: center;
          padding: 3rem 3.5rem; position: relative; overflow-y: auto;
        }
        .rg-right::before {
          content: ''; position: absolute; top: 0; left: 0;
          width: 56px; height: 56px;
          border-top: 2px solid #e2d0b4; border-left: 2px solid #e2d0b4;
          border-radius: 0 0 6px 0; pointer-events: none;
        }
        .rg-right::after {
          content: ''; position: absolute; bottom: 0; right: 0;
          width: 56px; height: 56px;
          border-bottom: 2px solid #e2d0b4; border-right: 2px solid #e2d0b4;
          border-radius: 6px 0 0 0; pointer-events: none;
        }

        .f-eye { font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8956a; font-weight: 500; margin-bottom: 0.4rem; }
        .f-title { font-family: 'Cormorant Garamond', serif; font-size: 2.1rem; font-weight: 600; color: #1a1814; margin-bottom: 0.3rem; line-height: 1.15; }
        .f-sub { font-size: 13px; color: #9b9186; font-weight: 300; margin-bottom: 1.8rem; }
        .f-sub a { color: #b8956a; text-decoration: none; font-weight: 500; }
        .f-sub a:hover { color: #a07545; }

        .fg { margin-bottom: 1rem; }
        .f2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 1rem; }
        .fl { display: block; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #9b9186; font-weight: 500; margin-bottom: 6px; }
        .fw { position: relative; }
        .fi {
          width: 100%; background: #faf8f5; border: 1px solid #e4ddd3;
          border-radius: 8px; padding: 0.68rem 2.5rem 0.68rem 0.9rem;
          font-size: 14px; font-family: 'Outfit', sans-serif; color: #1a1814;
          outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; box-sizing: border-box;
        }
        .fi::placeholder { color: #c4bbb0; }
        .fi:focus { border-color: #b8956a; background: #fff; box-shadow: 0 0 0 3px rgba(184,149,106,0.12); }
        .fic { position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); color: #c4bbb0; display: flex; align-items: center; pointer-events: none; }
        .fic.cp { pointer-events: auto; cursor: pointer; transition: color 0.15s; }
        .fic.cp:hover { color: #b8956a; }

        .phone-wrap { display: flex; }
        .phone-pre {
          display: flex; align-items: center; padding: 0 12px;
          background: #f1ede6; border: 1px solid #e4ddd3; border-right: none;
          border-radius: 8px 0 0 8px; font-size: 13px; color: #7a5c30;
          font-weight: 500; white-space: nowrap; flex-shrink: 0;
        }
        .phone-pre + .fi { border-radius: 0 8px 8px 0; padding-left: 0.9rem; }

        .strength-bar { display: flex; gap: 4px; margin-top: 6px; }
        .strength-seg { height: 3px; flex: 1; border-radius: 2px; background: #e4ddd3; transition: background 0.3s; }
        .strength-seg.weak { background: #e24b4a; }
        .strength-seg.fair { background: #ef9f27; }
        .strength-seg.good { background: #1d9e75; }

        .btn-go {
          width: 100%; padding: 0.8rem;
          background: #1a1814; color: #faf8f5;
          border: none; border-radius: 8px;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.2s, transform 0.1s, opacity 0.2s; margin-top: 1.5rem;
        }
        .btn-go:hover { background: #2e2a24; }
        .btn-go:active { transform: scale(0.985); }
        .btn-go:disabled { opacity: 0.55; cursor: not-allowed; }
        .spin { width: 15px; height: 15px; border: 2px solid rgba(250,248,245,0.25); border-top-color: #faf8f5; border-radius: 50%; animation: sp 0.7s linear infinite; }
        @keyframes sp { to { transform: rotate(360deg); } }

        .f-foot { text-align: center; margin-top: 1.25rem; font-size: 12px; color: #c4bbb0; }
        .f-foot a { color: #b8956a; text-decoration: none; }
        .f-foot a:hover { text-decoration: underline; }

        .match-hint { font-size: 11.5px; margin-top: 5px; }
        .match-ok { color: #1d9e75; }
        .match-no { color: #e24b4a; }

        @media (max-width: 768px) {
          .rg { flex-direction: column; }
          .rg-left { display: none; }
          .rg-right { width: 100%; min-height: 100vh; padding: 2.5rem 1.75rem; }
          .f2col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="rg">
        {/* Left panel */}
        <div className="rg-left">
          <div className="rg-bg">
            <Image src="/Background.jpg" alt="Siddhi" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
          </div>
          <div className="rg-tint" />
          <div className="rg-dots">
            {Array.from({ length: 25 }).map((_, i) => <span key={i} />)}
          </div>
          <div className="rg-top">
            <div className="rg-brand">SIDDHI</div>
          </div>
          <div className="rg-bottom">
            <span className="rg-pill">Join us today</span>
            <h1 className="rg-h1">Your story<br />starts <em>here.</em></h1>
            <p className="rg-desc">Create your account and start supporting the creators who inspire you every day.</p>
          </div>
        </div>

        {/* Right form panel */}
        <div className="rg-right">
          <p className="f-eye">Create account</p>
          <h2 className="f-title">Register</h2>
          <p className="f-sub">Already have an account? <Link href="/login">Sign in</Link></p>

          {/* Name + Email row */}
          <div className="f2col">
            <div>
              <label className="fl">Full name</label>
              <div className="fw">
                <input className="fi" type="text" name="name" placeholder="Aarav Shah" value={form.name} onChange={handleChange} autoComplete="name" />
                <span className="fic">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
              </div>
            </div>
            <div>
              <label className="fl">Email address</label>
              <div className="fw">
                <input className="fi" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} autoComplete="email" />
                <span className="fic">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Phone */}
          <div className="fg">
            <label className="fl">Phone number</label>
            <div className="phone-wrap">
              <span className="phone-pre">+91</span>
              <input className="fi" type="tel" name="phone" placeholder="98765 43210" maxLength={10} value={form.phone} onChange={handleChange} />
            </div>
          </div>

          {/* Password */}
          <div className="fg">
            <label className="fl">Password</label>
            <div className="fw">
              <input className="fi" type={showPass ? "text" : "password"} name="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" />
              <span className="fic cp" onClick={() => setShowPass(p => !p)} aria-label="Toggle password">
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </span>
            </div>
            {form.password && (
              <div className="strength-bar">
                {[1,2,3,4].map(n => {
                  const s = form.password.length
                  const cls = s < 6 ? (n <= 1 ? 'weak' : '') : s < 10 ? (n <= 2 ? 'fair' : '') : s < 14 ? (n <= 3 ? 'good' : '') : 'good'
                  return <div key={n} className={`strength-seg ${cls}`} />
                })}
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="fg">
            <label className="fl">Confirm password</label>
            <div className="fw">
              <input className="fi" type={showConfirm ? "text" : "password"} name="confirmpassword" placeholder="Repeat your password" value={form.confirmpassword} onChange={handleChange} autoComplete="new-password" />
              <span className="fic cp" onClick={() => setShowConfirm(p => !p)} aria-label="Toggle confirm password">
                {showConfirm
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </span>
            </div>
            {form.confirmpassword && (
              <p className={`match-hint ${form.password === form.confirmpassword ? 'match-ok' : 'match-no'}`}>
                {form.password === form.confirmpassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button className="btn-go" onClick={handleSubmit} disabled={loading} type="button">
            {loading ? <span className="spin" /> : null}
            {loading ? 'Creating account…' : 'Create account →'}
          </button>

          <p className="f-foot">
            By registering you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Register