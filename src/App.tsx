import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, BadgeCheck, Check, CheckCircle2, ChevronDown, CircleHelp, ClipboardCheck, FileText, Github, GraduationCap, LoaderCircle, LogOut, Menu, MessageSquareText, Pencil, Plus, Sparkles, Target, Upload, X } from "lucide-react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, firebaseConfigured, googleProvider } from "./firebase";
import type { ResumeReview, StudentProfile } from "./types";

const emptyProfile: StudentProfile = { name: "", university: "", study: "", graduationYear: "" };
function getProfile(user: User): StudentProfile {
  try {
    const saved = localStorage.getItem("portal-profile-" + user.uid);
    return saved ? { ...emptyProfile, ...JSON.parse(saved), name: user.displayName || JSON.parse(saved).name || "" } : { ...emptyProfile, name: user.displayName || "" };
  } catch { return { ...emptyProfile, name: user.displayName || "" }; }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(emptyProfile);
  const [resume, setResume] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "tailored" | "letter">("overview");
  const [copied, setCopied] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const firstName = useMemo(() => profile.name.trim().split(/\s+/)[0] || "there", [profile.name]);

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      if (next) setProfile(getProfile(next));
      setAuthLoading(false);
    });
  }, []);

  const saveProfile = (next: StudentProfile) => {
    setProfile(next);
    if (user) localStorage.setItem("portal-profile-" + user.uid, JSON.stringify(next));
  };
  const handleSignIn = async () => {
    if (!auth || !firebaseConfigured) { setError("Google sign-in is not configured yet. Add the Firebase web app values from .env.example."); return; }
    setAuthBusy(true); setError("");
    try { await signInWithPopup(auth, googleProvider); }
    catch (err) { setError(err instanceof Error ? err.message : "Sign-in did not finish. Please try again."); }
    finally { setAuthBusy(false); }
  };
  const handleFile = (file?: File) => {
    setError(""); setReview(null);
    if (!file) return;
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) { setError("Choose a PDF, DOCX, or TXT resume."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Your resume must be smaller than 5 MB."); return; }
    setResume(file);
  };
  const analyze = async () => {
    if (!user || !resume || !jobDescription.trim()) return;
    setAnalyzing(true); setError(""); setReview(null);
    try {
      const token = await user.getIdToken();
      const form = new FormData();
      form.append("resume", resume);
      form.append("jobDescription", jobDescription);
      form.append("profile", JSON.stringify(profile));
      const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3001" : "");
      const response = await fetch(apiBase + "/api/analyze", {
        method: "POST", headers: { Authorization: "Bearer " + token }, body: form,
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We couldn't review this resume. Please try again.");
      setReview(body.review as ResumeReview); setActiveTab("overview");
      window.setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setAnalyzing(false); }
  };
  const downloadText = (name: string, content: string) => {
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = name + ".txt"; link.click(); URL.revokeObjectURL(url);
  };
  const copyLetter = async () => {
    if (!review) return;
    await navigator.clipboard.writeText(review.coverLetter); setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  if (authLoading) return <div className="loading-screen"><span className="brand-mark"><Sparkles size={17} /></span><span>Getting your workspace ready…</span></div>;
  if (!user) return <main className="welcome-page">
    <header className="welcome-nav"><a className="wordmark" href="#top"><span className="brand-mark"><Sparkles size={17} /></span> portal<span className="wordmark-dot">.</span></a><a className="nav-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> Built for your next step</a></header>
    <section className="welcome-hero" id="top"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot" /> YOUR CAREER, IN FOCUS</div><h1>Make your next<br />application <em>count.</em></h1><p className="hero-description">A calmer way to understand your resume, find the skills a role asks for, and put your best work forward.</p><button className="google-button hero-signin" onClick={handleSignIn} disabled={authBusy}><GoogleG />{authBusy ? "Connecting…" : "Continue with Google"}<ArrowRight size={17} /></button>{!firebaseConfigured && <p className="config-note">Set up Firebase Google sign-in with the steps in the project README.</p>}<div className="hero-assurance"><CheckCircle2 size={15} /> Your resume is reviewed in memory and never saved by Portal.</div></div>
      <div className="hero-art"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="preview-card"><div className="preview-top"><div className="preview-avatar">AM</div><div><strong>Alex Morgan</strong><span>Product design · Student</span></div><BadgeCheck size={18} className="preview-check" /></div><div className="preview-divider" /><div className="preview-score-row"><div><span className="micro-label">ROLE READINESS</span><strong className="preview-score">82<span>/100</span></strong></div><div className="score-ring"><span>82</span></div></div><div className="preview-bar"><span /></div><div className="preview-tags"><span className="tag tag-match">✓ Figma</span><span className="tag tag-match">✓ Prototyping</span><span className="tag tag-gap">+ User research</span></div><div className="preview-insight"><Sparkles size={16} /><span><strong>A good next step</strong>Add a research example to match this role.</span></div></div><div className="float-chip chip-top"><span className="chip-icon">✦</span> Clear feedback, made for you</div><div className="float-chip chip-bottom"><span className="chip-icon chip-icon-lilac">↗</span> A stronger story starts here</div><div className="art-stamp">✳</div></div></section>
    <section className="feature-strip"><div className="feature"><span className="feature-icon"><Target size={19} /></span><div><strong>Know where you stand</strong><span>See what’s already working</span></div></div><div className="feature"><span className="feature-icon"><Sparkles size={19} /></span><div><strong>Find your next skill</strong><span>Match your experience to a role</span></div></div><div className="feature"><span className="feature-icon"><MessageSquareText size={19} /></span><div><strong>Tell your story well</strong><span>Shape a thoughtful application</span></div></div></section>
    <footer className="welcome-footer"><span>Thoughtful tools for the work ahead.</span><span>Made for students, wherever you’re headed.</span></footer>
    {error && <div className="toast toast-error"><CircleHelp size={17} />{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={15} /></button></div>}
  </main>;

  return <div className="app-shell">
    <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}><a className="wordmark" href="#home"><span className="brand-mark"><Sparkles size={17} /></span> portal<span className="wordmark-dot">.</span></a><div className="sidebar-caption">YOUR WORKSPACE</div><button className="side-link side-link-active" onClick={() => { setMobileNav(false); document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }); }}><span className="side-icon"><Target size={17} /></span>Resume review<span className="side-active-dot" /></button>
      <div className="sidebar-card"><div className="sidebar-card-icon"><GraduationCap size={18} /></div><div><strong>One step at a time</strong><p>Your skills grow with every experience. Start with what you have.</p></div></div><div className="sidebar-bottom"><div className="privacy-card"><CheckCircle2 size={15} /><span>Your resume stays yours. We never keep the file.</span></div><button className="profile-mini" onClick={() => document.getElementById("profile-name")?.focus()}><img src={user.photoURL || ""} alt="" /><span><strong>{profile.name || user.displayName || "Your profile"}</strong><small>{user.email}</small></span><ChevronDown size={15} /></button><button className="signout-link" onClick={() => auth && signOut(auth)}><LogOut size={14} /> Sign out</button></div>
    </aside>
    {mobileNav && <button className="nav-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
    <main className="main-content" id="home"><header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>Resume review</strong></div><div className="topbar-right"><span className="saved-label"><span /> Private workspace</span><button className="help-button" title="How your resume is used"><CircleHelp size={17} /></button></div></header>
      <div className="content-wrap"><section className="page-intro"><div><div className="eyebrow intro-eyebrow">YOUR CAREER STUDIO</div><h1>Good morning, {firstName}<span className="wave">✳</span></h1><p>Let’s make your next application feel a little more like you.</p></div><div className="intro-date"><span className="date-dot" /> YOUR NEXT STEP STARTS HERE</div></section>
        <section className="profile-panel"><div className="section-heading"><div><span className="step-number">01</span><div><h2>A little about you</h2><p>Help us make your feedback feel relevant.</p></div></div><span className="optional-label">YOUR PROFILE</span></div><div className="profile-fields">{([["name","Your name","e.g. Alex Morgan"],["university","University","Where you study"],["study","Area of study","e.g. Computer science"],["graduationYear","Graduation year","e.g. 2027"]] as const).map(([key,label,hint]) => <label className="field" key={key}><span>{label}</span><div className={key === "name" ? "input-wrap" : ""}><input id={key === "name" ? "profile-name" : undefined} value={profile[key]} onChange={(e) => saveProfile({ ...profile, [key]: e.target.value })} placeholder={hint} autoComplete={key === "name" ? "name" : "off"} />{key === "name" && <Pencil size={14} />}</div></label>)}</div></section>
        <section className="application-panel"><div className="section-heading"><div><span className="step-number step-violet">02</span><div><h2>Bring the opportunity into focus</h2><p>Share your resume and the role you have in mind.</p></div></div><span className="optional-label">JUST FOR THIS REVIEW</span></div><div className="input-columns"><div className="resume-column"><label className="input-label" htmlFor="resume-upload">YOUR RESUME <span>PDF, DOCX, or TXT · up to 5 MB</span></label><input ref={fileRef} id="resume-upload" type="file" accept=".pdf,.docx,.txt" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} /><button className={"upload-box " + (resume ? "upload-filled" : "")} onClick={() => fileRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}><span className="upload-icon">{resume ? <FileText size={21} /> : <Upload size={21} />}</span><span className="upload-copy"><strong>{resume ? resume.name : "Drop your resume here"}</strong><small>{resume ? Math.round(resume.size / 1024) + " KB · Click to change" : "or browse files from your device"}</small></span>{resume ? <span className="remove-file" onClick={(e) => { e.stopPropagation(); setResume(null); setReview(null); if (fileRef.current) fileRef.current.value = ""; }}><X size={17} /></span> : <span className="upload-browse">Browse</span>}</button><div className="upload-note"><Check size={14} /> Your resume is processed securely and discarded after review.</div></div>
          <div className="job-column"><label className="input-label" htmlFor="job-description">THE ROLE YOU’RE INTERESTED IN <span>Paste a job description</span></label><textarea id="job-description" value={jobDescription} onChange={(e) => { setJobDescription(e.target.value); setReview(null); }} placeholder="Paste the job description here. Include the responsibilities and skills so we can make your feedback specific…" rows={5} maxLength={12000} /><div className="textarea-meta"><span>Specific details help make a better match.</span><span>{jobDescription.length.toLocaleString()} / 12,000</span></div></div></div>
          {error && <div className="inline-error"><CircleHelp size={16} />{error}<button onClick={() => setError("")} aria-label="Dismiss"><X size={14} /></button></div>}<div className="review-actions"><span className="review-hint"><Sparkles size={15} /> A thoughtful review, grounded in your experience.</span><button className="primary-button" onClick={analyze} disabled={!resume || !jobDescription.trim() || analyzing}>{analyzing ? <><LoaderCircle size={17} className="spin" /> Reviewing your resume…</> : <>Review my resume <ArrowRight size={17} /></>}</button></div>
        </section>
        {analyzing && <div className="analyzing-note"><div className="analyzing-orbit"><Sparkles size={19} /></div><div><strong>Taking a closer look</strong><span>We’re comparing your experience with this opportunity.</span></div><div className="loading-bars"><i /><i /><i /></div></div>}
        {review && <section className="results-section" id="results"><div className="results-heading"><div><span className="eyebrow intro-eyebrow">YOUR REVIEW</span><h2>A clearer picture of your fit.</h2><p>{review.summary}</p></div><button className="subtle-button" onClick={() => { setReview(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Plus size={15} /> New review</button></div>
          <div className="score-overview"><div className="overall-score"><div className="score-donut" style={{ "--score": review.overallScore + "%" } as React.CSSProperties}><div><strong>{review.overallScore}</strong><span>out of 100</span></div></div><div><span className="eyebrow intro-eyebrow">ROLE READINESS</span><h3>A solid place to start.</h3><p>Your score reflects the fit between your resume and this role.</p></div></div><div className="score-list">{review.scores.map((score) => <div className="score-item" key={score.label}><div className="score-item-head"><strong>{score.label}</strong><span>{score.value}<small>/100</small></span></div><div className="score-track"><span style={{ width: score.value + "%" }} /></div><p>{score.detail}</p></div>)}</div></div>
          <div className="insight-grid"><div className="insight-card strengths-card"><div className="insight-card-title"><span className="insight-title-icon green"><CheckCircle2 size={17} /></span><div><h3>What you already bring</h3><p>Experience that connects with this role.</p></div></div><ul>{review.strengths.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div><div className="insight-card skills-card"><div className="insight-card-title"><span className="insight-title-icon violet"><Target size={17} /></span><div><h3>Skills in the picture</h3><p>Based on the requirements you shared.</p></div></div><div className="skill-group"><span className="skill-label">ALREADY IN YOUR RESUME</span><div className="skill-chips">{review.matchingSkills.length ? review.matchingSkills.map((item) => <span className="skill-chip match" key={item}><Check size={12} />{item}</span>) : <span className="empty-copy">No direct matches found yet.</span>}</div></div><div className="skill-group"><span className="skill-label">POSSIBLE AREAS TO GROW</span><div className="skill-chips">{review.missingSkills.length ? review.missingSkills.map((item) => <span className="skill-chip gap" key={item}><Plus size={12} />{item}</span>) : <span className="empty-copy">You’ve covered the key skills listed.</span>}</div></div></div></div>
          <div className="recommendation-card"><span className="recommendation-sparkle"><Sparkles size={18} /></span><div><span className="eyebrow intro-eyebrow">A FEW IDEAS TO TRY</span><h3>Small changes can make a strong story clearer.</h3><ul>{review.recommendations.map((item, i) => <li key={item}><span>{String(i + 1).padStart(2, "0")}</span>{item}</li>)}</ul></div></div>
          <div className="deliverables-panel"><div className="deliverables-head"><div><span className="eyebrow intro-eyebrow">MAKE IT YOURS</span><h2>Take the next step.</h2><p>Drafts to help you get started. Always review and personalize before sending.</p></div><div className="deliverable-tabs"><button className={activeTab === "overview" ? "tab-active" : ""} onClick={() => setActiveTab("overview")}><ClipboardCheck size={15} /> Overview</button><button className={activeTab === "tailored" ? "tab-active" : ""} onClick={() => setActiveTab("tailored")}><FileText size={15} /> Tailored resume</button><button className={activeTab === "letter" ? "tab-active" : ""} onClick={() => setActiveTab("letter")}><MessageSquareText size={15} /> Cover letter</button></div></div>
            {activeTab === "overview" ? <div className="deliverable-overview"><button onClick={() => setActiveTab("tailored")}><span className="deliverable-icon"><FileText size={19} /></span><span><strong>Tailored resume draft</strong><small>Bring your most relevant experience forward.</small></span><ArrowRight size={17} /></button><button onClick={() => setActiveTab("letter")}><span className="deliverable-icon letter-icon"><MessageSquareText size={19} /></span><span><strong>Cover letter draft</strong><small>A starting point for your application.</small></span><ArrowRight size={17} /></button></div> : <div className="draft-card"><div className="draft-toolbar"><div><span className="draft-status"><span /> AI-GENERATED DRAFT</span><span className="draft-disclaimer">Review every detail before using.</span></div><div className="draft-buttons">{activeTab === "letter" && <button className="subtle-button" onClick={copyLetter}>{copied ? <Check size={15} /> : <ClipboardCheck size={15} />}{copied ? "Copied" : "Copy"}</button>}<button className="subtle-button" onClick={() => downloadText(activeTab === "letter" ? "cover-letter-draft" : "tailored-resume-draft", activeTab === "letter" ? review.coverLetter : review.tailoredResume)}><ArrowDownToLine size={15} /> Download</button></div></div><pre className="draft-content">{activeTab === "letter" ? review.coverLetter : review.tailoredResume}</pre></div>}
            <div className="draft-note"><CircleHelp size={15} /><span>These AI-generated drafts are suggestions. Check that every detail is accurate and sounds like you before you use them.</span></div></div>
        </section>}
        <footer className="app-footer"><span>Take what helps. Leave what doesn’t.</span><a href="https://github.com/sagarbhujbal111/portal" target="_blank" rel="noreferrer">Open source on GitHub <ArrowRight size={13} /></a></footer>
      </div>
    </main></div>;
}

function GoogleG() { return <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 24.5c0-1.4-.1-2.9-.4-4.2H24v8h11a9.4 9.4 0 0 1-4.1 6.2v5.2h6.7c3.9-3.6 6-8.8 6-15.2Z" /><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.9l-6.7-5.2c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.7-3.5-11.3-8.2H5.8v5.3A20.4 20.4 0 0 0 24 44Z" /><path fill="#4A90E2" d="M12.7 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.9-5.3Z" /><path fill="#EA4335" d="M24 12.2c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.2 29.5 4 24 4 16.2 4 9.4 8.5 5.8 15.1l6.9 5.3c1.6-4.7 6.1-8.2 11.3-8.2Z" /></svg>; }
