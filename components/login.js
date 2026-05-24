import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { signIn } from "next-auth/react"
import { ToastContainer, toast, Bounce } from 'react-toastify'
import { useRouter } from 'next/navigation'

const Login = () => {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSignIn = async () => {
        setLoading(true)
        const res = await signIn("credentials", { email, password, redirect: false })
        setLoading(false)
        if (!res || res.error) {
            toast.error("Invalid credentials", { position: "top-center", autoClose: 3000, theme: "light" })
            return
        }
        router.replace("/")
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        if (name === "email") setEmail(value)
        else if (name === "password") setPassword(value)
    }

    return (
        <>
            <ToastContainer position="top-right" autoClose={5000} theme="light" transition={Bounce} />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&family=Outfit:wght@300;400;500&display=swap');

                .lr { min-height: 100vh; display: flex; font-family: 'Outfit', sans-serif; background: #faf8f5; color: #1a1814; }

                .lr-left {
                    flex: 1;
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 2.5rem;
                    overflow: hidden;
                    min-height: 100vh;
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
                .lr-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.65rem; font-weight: 600;
                    color: #fff; letter-spacing: 0.1em;
                    text-shadow: 0 1px 10px rgba(0,0,0,0.2);
                }
                .lr-bottom { position: relative; z-index: 2; }
                .lr-pill {
                    display: inline-block; font-size: 10.5px;
                    letter-spacing: 0.18em; text-transform: uppercase;
                    color: #7a5c30; font-weight: 500; margin-bottom: 0.8rem;
                    background: rgba(250,248,245,0.88); padding: 4px 14px; border-radius: 100px;
                }
                .lr-h1 {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: clamp(2.2rem, 3.8vw, 3.2rem);
                    font-weight: 400; line-height: 1.12;
                    color: #1a1814; margin-bottom: 0.85rem;
                }
                .lr-h1 em { font-style: italic; color: #b8956a; }
                .lr-desc { font-size: 13.5px; color: rgba(26,24,20,0.52); font-weight: 300; line-height: 1.7; max-width: 310px; }

                .lr-right {
                    width: 460px; flex-shrink: 0;
                    background: #ffffff; border-left: 1px solid #ede9e2;
                    display: flex; flex-direction: column; justify-content: center;
                    padding: 3.5rem; position: relative;
                }
                .lr-right::before {
                    content: ''; position: absolute; top: 0; left: 0;
                    width: 56px; height: 56px;
                    border-top: 2px solid #e2d0b4; border-left: 2px solid #e2d0b4;
                    border-radius: 0 0 6px 0; pointer-events: none;
                }
                .lr-right::after {
                    content: ''; position: absolute; bottom: 0; right: 0;
                    width: 56px; height: 56px;
                    border-bottom: 2px solid #e2d0b4; border-right: 2px solid #e2d0b4;
                    border-radius: 6px 0 0 0; pointer-events: none;
                }

                .f-eye { font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; color: #b8956a; font-weight: 500; margin-bottom: 0.4rem; }
                .f-title { font-family: 'Cormorant Garamond', serif; font-size: 2.1rem; font-weight: 600; color: #1a1814; margin-bottom: 0.3rem; line-height: 1.15; }
                .f-sub { font-size: 13px; color: #9b9186; font-weight: 300; margin-bottom: 2.2rem; }
                .f-sub a { color: #b8956a; text-decoration: none; font-weight: 500; }
                .f-sub a:hover { color: #a07545; }

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

                .f-opts { display: flex; align-items: center; margin-bottom: 1.75rem; margin-top: 0.2rem; }
                .cb-lbl { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #9b9186; cursor: pointer; user-select: none; }
                .cb-lbl input[type=checkbox] { accent-color: #b8956a; }

                .btn-go {
                    width: 100%; padding: 0.8rem;
                    background: #1a1814; color: #faf8f5;
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

                .divdr { display: flex; align-items: center; gap: 12px; margin: 1.5rem 0; }
                .divdr-line { flex: 1; height: 1px; background: #ede9e2; }
                .divdr-txt { font-size: 10.5px; letter-spacing: 0.1em; text-transform: uppercase; color: #c4bbb0; white-space: nowrap; }

                .soc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .btn-soc {
                    display: flex; align-items: center; justify-content: center; gap: 7px;
                    padding: 0.58rem 0.7rem;
                    background: #faf8f5; border: 1px solid #e4ddd3; border-radius: 8px;
                    font-family: 'Outfit', sans-serif; font-size: 13px; color: #5a5248;
                    cursor: pointer; transition: background 0.15s, border-color 0.15s, color 0.15s; white-space: nowrap;
                }
                .btn-soc:hover { background: #fff; border-color: #b8956a; color: #1a1814; }

                .f-foot { text-align: center; margin-top: 1.5rem; font-size: 12px; color: #c4bbb0; }
                .f-foot a { color: #b8956a; text-decoration: none; }
                .f-foot a:hover { text-decoration: underline; }

                @media (max-width: 768px) {
                    .lr { flex-direction: column; }
                    .lr-left { display: none; }
                    .lr-right { width: 100%; min-height: 100vh; padding: 2.5rem 1.75rem; justify-content: center; }
                }
            `}</style>

            <div className="lr">
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
                        <span className="lr-pill">Welcome back</span>
                        <h1 className="lr-h1">Where support<br />becomes <em>art.</em></h1>
                        <p className="lr-desc">Back your favourite creators. Every contribution matters — sign in to continue your journey.</p>
                    </div>
                </div>

                <div className="lr-right">
                    <p className="f-eye">Account access</p>
                    <h2 className="f-title">Sign in</h2>
                    <p className="f-sub">New here? <Link href="/register">Create an account</Link></p>

                    <div className="fg">
                        <label className="fl">Email address</label>
                        <div className="fw">
                            <input className="fi" type="email" name="email" placeholder="you@example.com" value={email} onChange={handleChange} autoComplete="email" />
                            <span className="fic">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                                </svg>
                            </span>
                        </div>
                    </div>

                    <div className="fg">
                        <label className="fl">Password</label>
                        <div className="fw">
                            <input className="fi" type={showPass ? "text" : "password"} name="password" placeholder="••••••••" value={password} onChange={handleChange} autoComplete="current-password" />
                            <span className="fic cp" onClick={() => setShowPass(p => !p)} aria-label={showPass ? "Hide" : "Show"}>
                                {showPass ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="f-opts">
                        <label className="cb-lbl">
                            <input type="checkbox" name="remember-me" />
                            Remember me
                        </label>
                    </div>

                    <button className="btn-go" onClick={handleSignIn} disabled={loading} type="button">
                        {loading ? <span className="spin" /> : null}
                        {loading ? 'Signing in…' : 'Continue →'}
                    </button>

                    <div className="divdr">
                        <div className="divdr-line" />
                        <span className="divdr-txt">or continue with</span>
                        <div className="divdr-line" />
                    </div>

                    <div className="soc-grid">
                        <button className="btn-soc" onClick={() => signIn("google")}>
                            <svg width="15" height="15" viewBox="0 0 48 48">
                                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9L37.3 9.4C33.7 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.5-8 19.5-20 0-1.3-.1-2.7-.4-4z"/>
                                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.5-5.5C33.7 6.1 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                                <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-4.9C28.9 35.7 26.6 36 24 36c-5.2 0-9.5-3.4-11.2-8H6.5C9.8 35.7 16.3 44 24 44z"/>
                                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.5l6 4.9c3.6-3.3 5.5-8.2 5.5-14.4 0-1.3-.1-2.7-.4-4z"/>
                            </svg>
                            Google
                        </button>
                        <button className="btn-soc" onClick={() => signIn("github")}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.604-3.369-1.34-3.369-1.34-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .268.18.58.688.482C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                            </svg>
                            GitHub
                        </button>
                        <button className="btn-soc" onClick={() => signIn("twitter")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            Twitter
                        </button>
                        <button className="btn-soc" onClick={() => signIn("facebook")}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="#1877F2">
                                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.235 2.686.235v2.97h-1.514c-1.491 0-1.956.932-1.956 1.888v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                            </svg>
                            Facebook
                        </button>
                    </div>

                    <p className="f-foot">
                        By signing in you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </>
    )
}

export default Login