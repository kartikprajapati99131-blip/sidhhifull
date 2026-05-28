"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from "next-auth/react"
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { useRouter } from 'next/navigation'

const Register = () => {
    const router = useRouter()
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirmpassword: "" })
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [agreed, setAgreed] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleRegister = async () => {
        if (!form.name.trim()) return toast.error("Please enter your name", { position: "top-center", autoClose: 3000, theme: "light" })
        if (!form.email.trim()) return toast.error("Please enter your email", { position: "top-center", autoClose: 3000, theme: "light" })
        if (!form.email.includes("@")) return toast.error("Invalid email address", { position: "top-center", autoClose: 3000, theme: "light" })
        if (!/^[6-9]\d{9}$/.test(form.phone)) return toast.error("Invalid Indian phone number", { position: "top-center", autoClose: 3000, theme: "light" })
        if (form.password.length < 6) return toast.error("Password must be at least 6 characters", { position: "top-center", autoClose: 3000, theme: "light" })
        if (form.password !== form.confirmpassword) return toast.error("Passwords do not match", { position: "top-center", autoClose: 3000, theme: "light" })
        if (!agreed) return toast.error("Please accept the terms to continue", { position: "top-center", autoClose: 3000, theme: "light" })

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
                toast.error(data.message || "Registration failed", { position: "top-center", autoClose: 3000, theme: "light" })
                return
            }

            toast.success("Account created! Signing you in…", { position: "top-center", autoClose: 2000, theme: "light" })

            const signInRes = await signIn("credentials", {
                email: form.email,
                password: form.password,
                redirect: false,
            })

            if (signInRes?.error) {
                setTimeout(() => router.replace("/login"), 2000)
            } else {
                setTimeout(() => router.replace("/"), 2000)
            }

        } catch {
            toast.error("Something went wrong. Please try again.", { position: "top-center", autoClose: 3000, theme: "light" })
        } finally {
            setLoading(false)
        }
    }

    const strength = (() => {
        const p = form.password
        if (!p) return 0
        let s = 0
        if (p.length >= 6) s++
        if (/[A-Z]/.test(p)) s++
        if (/[0-9]/.test(p)) s++
        if (/[^A-Za-z0-9]/.test(p)) s++
        return s
    })()

    const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
    const strengthColor = ['', '#e57373', '#ffb74d', '#81c784', '#4caf50'][strength]

    const EyeOff = () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    )
    const EyeOn = () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
    )

    return (
        <>
            <ToastContainer position="top-right" autoClose={5000} theme="light" transition={Bounce} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@300;400;500&display=swap');

                .lr { min-height: 100vh; display: flex; font-family: 'Outfit', sans-serif; background: #faf8f5; color: #1a1814; }

                .lr-left {
                    flex: 1; position: relative;
                    display: flex; flex-direction: column; justify-content: space-between;
                    padding: 2.5rem; overflow: hidden; min-height: 100vh;
                }
                .lr-bg { position: absolute; inset: 0; z-index: 0; }
                .lr-tint {
                    position: absolute; inset: 0; z-index: 1;
                    background: linear-gradient(180deg, rgba(250,248,245,0.15) 0%, rgba(250,248,245,0.06) 40%, rgba(250,248,245,0.75) 100%);
                }
                .lr-dots {
                    position: absolute; top: 2rem; right: 2rem; z-index: 2;
                    display: grid; grid-template-columns: repeat(5,6px); gap: 5px; opacity: 0.4;
                }
                .lr-dots span { width: 4px; height: 4px; border-radius: 50%; background: #fff; display: block; }
                .lr-top { position: relative; z-index: 2; }
                .lr-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.65rem; font-weight: 600; color: #fff; letter-spacing: 0.1em; text-shadow: 0 1px 10px rgba(0,0,0,0.2); }
                .lr-bottom { position: relative; z-index: 2; }
                .lr-pill { display: inline-block; font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #7a5c30; font-weight: 500; margin-bottom: 0.8rem; background: rgba(250,248,245,0.88); padding: 4px 14px; border-radius: 100px; }
                .lr-h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.2rem, 3.8vw, 3.2rem); font-weight: 400; line-height: 1.12; color: #1a1814; margin-bottom: 0.85rem; }
                .lr-h1 em { font-style: italic; color: #b8956a; }
                .lr-desc { font-size: 13.5px; color: rgba(26,24,20,0.52); font-weight: 300; line-height: 1.7; max-width: 310px; }

                .lr-right {
                    width: 480px; flex-shrink: 0;
                    background: #ffffff; border-left: 1px solid #ede9e2;
                    display: flex; flex-direction: column; justify-content: center;
                    padding: 3rem 3.5rem; position: relative; overflow-y: auto;
                }
                .lr-right::before { content: ''; position: absolute; top: 0; left: 0; width: 56px; height: 56px; border-top: 2px solid #e2d0b4; border-left: 2px solid #e2d0b4; border-radius: 0 0 6px 0; pointer-events: none; }
                .lr-right::after { content: ''; position: absolute; bottom: 0; right: 0; width: 56px; height: 56px; border-bottom: 2px solid #e2d0b4; border-right: 2px solid #e2d0b4; border-radius: 6px 0 0 0; pointer-events: none; }

                .f-eye { font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8956a; font-weight: 500; margin-bottom: 0.4rem; }
                .f-title { font-family: 'Cormorant Garamond', serif; font-size: 2.1rem; font-weight: 600; color: #1a1814; margin-bottom: 0.3rem; line-height: 1.15; }
                .f-sub { font-size: 13px; color: #9b9186; font-weight: 300; margin-bottom: 1.6rem; }
                .f-sub a { color: #b8956a; text-decoration: none; font-weight: 500; }
                .f-sub a:hover { color: #a07545; }

                .fg-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 1.1rem; }
                .fg { margin-bottom: 1.1rem; }
                .fl { display: block; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #9b9186; font-weight: 500; margin-bottom: 6px; }
                .fw { position: relative; }
                .fi {
                    width: 100%; background: #faf8f5; border: 1px solid #e4ddd3;
                    border-radius: 8px; padding: 0.7rem 2.5rem 0.7rem 0.9rem;
                    font-size: 14px; font-family: 'Outfit', sans-serif; color: #1a1814;
                    outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; box-sizing: border-box;
                }
                .fi::placeholder { color: #c4bbb0; }
                .fi:focus { border-color: #b8956a; background: #fff; box-shadow: 0 0 0 3px rgba(184,149,106,0.12); }
                .fic { position: absolute; right: 0.8rem; top: 50%; transform: translateY(-50%); color: #c4bbb0; display: flex; align-items: center; pointer-events: none; }
                .fic.cp { pointer-events: auto; cursor: pointer; transition: color 0.15s; }
                .fic.cp:hover { color: #b8956a; }

                .phone-wrap { display: flex; }
                .phone-prefix {
                    display: flex; align-items: center; padding: 0 0.75rem;
                    background: #f0ebe4; border: 1px solid #e4ddd3; border-right: none;
                    border-radius: 8px 0 0 8px; font-size: 13px; color: #7a6a5a;
                    font-family: 'Outfit', sans-serif; white-space: nowrap; flex-shrink: 0;
                }
                .fi-phone {
                    flex: 1; background: #faf8f5; border: 1px solid #e4ddd3;
                    border-radius: 0 8px 8px 0; padding: 0.7rem 0.9rem;
                    font-size: 14px; font-family: 'Outfit', sans-serif; color: #1a1814;
                    outline: none; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s; box-sizing: border-box; width: 100%;
                }
                .fi-phone::placeholder { color: #c4bbb0; }
                .fi-phone:focus { border-color: #b8956a; background: #fff; box-shadow: 0 0 0 3px rgba(184,149,106,0.12); }

                .strength-bar-wrap { display: flex; gap: 4px; margin-top: 7px; }
                .strength-seg { height: 3px; flex: 1; border-radius: 100px; background: #e4ddd3; transition: background 0.3s; }
                .strength-label { font-size: 11px; color: #9b9186; margin-top: 4px; text-align: right; }

                .f-terms { display: flex; align-items: flex-start; gap: 9px; margin-bottom: 1.4rem; margin-top: 0.2rem; }
                .f-terms input[type=checkbox] { accent-color: #b8956a; margin-top: 2px; flex-shrink: 0; }
                .f-terms-txt { font-size: 12.5px; color: #9b9186; font-weight: 300; line-height: 1.6; }
                .f-terms-txt a { color: #b8956a; text-decoration: none; font-weight: 500; }
                .f-terms-txt a:hover { color: #a07545; }

                .btn-go {
                    width: 100%; padding: 0.8rem; background: #1a1814; color: #faf8f5;
                    border: none; border-radius: 8px;
                    font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.05em;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background 0.2s, transform 0.1s, opacity 0.2s;
                }
                .btn-go:hover { background: #2e2a24; }
                .btn-go:active { transform: scale(0.985); }
                .btn-go:disabled { opacity: 0.55; cursor: not-allowed; }
                .spin { width: 15px; height: 15px; border: 2px solid rgba(250,248,245,0.25); border-top-color: #faf8f5; border-radius: 50%; animation: sp 0.7s linear infinite; }
                @keyframes sp { to { transform: rotate(360deg); } }

                .divdr { display: flex; align-items: center; gap: 12px; margin: 1.3rem 0; }
                .divdr-line { flex: 1; height: 1px; background: #ede9e2; }
                .divdr-txt { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: #c4bbb0; white-space: nowrap; }

                .soc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .btn-soc {
                    display: flex; align-items: center; justify-content: center; gap: 7px;
                    padding: 0.58rem 0.7rem; background: #faf8f5; border: 1px solid #e4ddd3; border-radius: 8px;
                    font-family: 'Outfit', sans-serif; font-size: 13px; color: #5a5248;
                    cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; white-space: nowrap;
                }
                .btn-soc:hover { background: #fff; border-color: #b8956a; color: #1a1814; }

                .f-foot { text-align: center; margin-top: 1.3rem; font-size: 12px; color: #c4bbb0; }
                .f-foot a { color: #b8956a; text-decoration: none; }
                .f-foot a:hover { text-decoration: underline; }

                @media (max-width: 768px) {
                    .lr { flex-direction: column; }
                    .lr-left { display: none; }
                    .lr-right { width: 100%; min-height: 100vh; padding: 2.5rem 1.75rem; justify-content: flex-start; padding-top: 3rem; }
                    .fg-row { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="lr">
                {/* Left panel */}
                <div className="lr-left">
                    <div className="lr-bg">
                        <Image src="/Background.jpg" alt="Siddhi" fill style={{ objectFit: 'cover', objectPosition: 'center' }} priority />
                    </div>
                    <div className="lr-tint" />
                    <div className="lr-dots">
                        {Array.from({ length: 25 }).map((_, i) => <span key={i} />)}
                    </div>
                    <div className="lr-top">
                        <div className="lr-brand">SIDDHI</div>
                    </div>
                    <div className="lr-bottom">
                        <span className="lr-pill">Join the community</span>
                        <h1 className="lr-h1">Create your<br /><em>story.</em></h1>
                        <p className="lr-desc">Become a patron of the arts. Support creators who inspire you and be part of something meaningful.</p>
                    </div>
                </div>

                {/* Right panel */}
                <div className="lr-right">
                    <p className="f-eye">New account</p>
                    <h2 className="f-title">Register</h2>
                    <p className="f-sub">Already have an account? <Link href="/login">Sign in</Link></p>

                    {/* Name + Email */}
                    <div className="fg-row">
                        <div className="fg" style={{ marginBottom: 0 }}>
                            <label className="fl">Full name</label>
                            <div className="fw">
                                <input className="fi" type="text" name="name" placeholder="Jane Doe"
                                    value={form.name} onChange={handleChange} autoComplete="name" />
                                <span className="fic">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                        <div className="fg" style={{ marginBottom: 0 }}>
                            <label className="fl">Email address</label>
                            <div className="fw">
                                <input className="fi" type="email" name="email" placeholder="you@example.com"
                                    value={form.email} onChange={handleChange} autoComplete="email" />
                                <span className="fic">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="fg" style={{ marginTop: '1.1rem' }}>
                        <label className="fl">Phone number</label>
                        <div className="phone-wrap">
                            <span className="phone-prefix">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}>
                                    <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12" y2="18.01" />
                                </svg>
                                +91
                            </span>
                            <input className="fi-phone" type="tel" name="phone" placeholder="9876543210"
                                value={form.phone} onChange={handleChange} maxLength={10} autoComplete="tel" />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="fg">
                        <label className="fl">Password</label>
                        <div className="fw">
                            <input className="fi" type={showPass ? "text" : "password"} name="password"
                                placeholder="Min. 6 characters"
                                value={form.password} onChange={handleChange} autoComplete="new-password" />
                            <span className="fic cp" onClick={() => setShowPass(p => !p)} aria-label={showPass ? "Hide" : "Show"}>
                                {showPass ? <EyeOff /> : <EyeOn />}
                            </span>
                        </div>
                        {form.password && (
                            <>
                                <div className="strength-bar-wrap">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="strength-seg" style={{ background: i <= strength ? strengthColor : undefined }} />
                                    ))}
                                </div>
                                <div className="strength-label" style={{ color: strengthColor }}>{strengthLabel}</div>
                            </>
                        )}
                    </div>

                    {/* Confirm password */}
                    <div className="fg">
                        <label className="fl">Confirm password</label>
                        <div className="fw">
                            <input className="fi" type={showConfirm ? "text" : "password"} name="confirmpassword"
                                placeholder="Repeat password"
                                value={form.confirmpassword} onChange={handleChange} autoComplete="new-password"
                                style={{
                                    borderColor: form.confirmpassword && form.confirmpassword !== form.password ? '#e57373' :
                                        form.confirmpassword && form.confirmpassword === form.password ? '#81c784' : undefined
                                }}
                            />
                            <span className="fic cp" onClick={() => setShowConfirm(p => !p)} aria-label={showConfirm ? "Hide" : "Show"}>
                                {showConfirm ? <EyeOff /> : <EyeOn />}
                            </span>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="f-terms">
                        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                        <span className="f-terms-txt">
                            I agree to Siddhi's <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>, and confirm I am 18 years or older.
                        </span>
                    </div>

                    <button className="btn-go" onClick={handleRegister} disabled={loading} type="button">
                        {loading ? <span className="spin" /> : null}
                        {loading ? 'Creating account…' : 'Create account →'}
                    </button>

                    <div className="divdr">
                        <div className="divdr-line" />
                        <span className="divdr-txt">or sign up with</span>
                        <div className="divdr-line" />
                    </div>

                    <div className="soc-grid">
                        <button className="btn-soc" onClick={() => signIn("google")} type="button">
                            <svg width="15" height="15" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37.3 9.4C33.7 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.3-.1-2.7-.4-4z" />
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.5-5.5C33.7 6.1 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                                <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-4.9C28.9 35.7 26.6 36 24 36c-5.2 0-9.5-3.4-11.2-8H6.5C9.8 35.7 16.3 44 24 44z" />
                                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.5l6 4.9c3.6-3.3 5.5-8.2 5.5-14.4 0-1.3-.1-2.7-.4-4z" />
                            </svg>
                            Google
                        </button>
                        <button className="btn-soc" onClick={() => signIn("facebook")} type="button">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.932-1.956 1.888v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <p className="f-foot">
                        By registering you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </>
    )
}

export default Register