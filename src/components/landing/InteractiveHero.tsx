import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export function InteractiveHero() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 50], ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.85)"]);
  const headerBlur = useTransform(scrollY, [0, 50], ["blur(0px)", "blur(12px)"]);
  const headerBorder = useTransform(scrollY, [0, 50], ["rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0.08)"]);
  
  // Custom Lerp-based cursor tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let isSeeking = false;
    let pendingTime: number | null = null;
    let targetFraction = 0.5;
    let currentLerpedFraction = 0.5;
    let animationFrameId: number;
    
    // Pause autoplay if desktop
    if (window.innerWidth >= 1024) {
      video.pause();
    } else {
      video.autoplay = true;
      video.loop = true;
      video.play().catch(() => {});
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024) return;
      targetFraction = e.clientX / window.innerWidth;
    };

    const updateLoop = () => {
      if (window.innerWidth >= 1024 && video.duration) {
        // Smoothly interpolate towards the target fraction
        currentLerpedFraction += (targetFraction - currentLerpedFraction) * 0.08;
        
        const targetTime = Math.max(0, Math.min(currentLerpedFraction * video.duration, video.duration));
        
        if (!isSeeking) {
          // Only trigger a seek if the difference is at least 1 frame (~0.04s) to prevent micro-stutters
          if (Math.abs(video.currentTime - targetTime) > 0.04) {
            isSeeking = true;
            video.currentTime = targetTime;
          }
        } else {
          pendingTime = targetTime;
        }
      }
      animationFrameId = requestAnimationFrame(updateLoop);
    };

    const handleSeeked = () => {
       isSeeking = false;
       if (pendingTime !== null) {
         if (Math.abs(video.currentTime - pendingTime) > 0.04) {
           video.currentTime = pendingTime;
           isSeeking = true;
         }
         pendingTime = null;
       }
    };

    video.addEventListener('seeked', handleSeeked);
    window.addEventListener('mousemove', handleMouseMove);
    updateLoop();
    
    return () => {
      video.removeEventListener('seeked', handleSeeked);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const headlineWords = [
    { text: "prove", break: false },
    { text: "what", break: true },
    { text: "you", break: false },
    { text: "can", break: false },
    { text: "do.", break: false }
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const wordVariants = {
    hidden: { y: "100%", opacity: 0, filter: "blur(12px)" },
    visible: { 
      y: 0, 
      opacity: 1, 
      filter: "blur(0px)",
      transition: { ease: [0.16, 1, 0.3, 1] as [number, number, number, number], duration: 1.2 }
    }
  };
  
  const serviceOptions = ["Frontend", "Backend", "Data Science", "AI/ML"];

  const toggleService = (opt: string) => {
    setServices((prev) => 
      prev.includes(opt) ? prev.filter((s) => s !== opt) : [...prev, opt]
    );
  };

  return (
    <div className="relative bg-white text-neutral-900 font-sans selection:bg-[#EAECE9] selection:text-[#1C2E1E] antialiased overflow-x-hidden flex flex-col lg:block lg:min-h-screen">
      
      {/* Background Video */}
      <div className="order-last lg:order-none relative lg:absolute lg:inset-0 lg:z-0 overflow-hidden pointer-events-none w-full aspect-square md:aspect-video lg:aspect-auto lg:h-full bg-neutral-50 lg:bg-transparent">
        <video 
          ref={videoRef}
          muted 
          playsInline 
          preload="auto"
          className="w-full h-full object-cover object-right lg:object-right-bottom"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260601_110537_3a579fa0-7bbc-4d94-9d25-0e816c7840f5.mp4"
        />
      </div>

      {/* Header */}
      <motion.header 
        style={{ backgroundColor: headerBg, backdropFilter: headerBlur, WebkitBackdropFilter: headerBlur, borderBottomColor: headerBorder, borderBottomWidth: "1px" }}
        className="absolute lg:fixed top-0 inset-x-0 z-[60] px-5 sm:px-8 py-4 sm:py-5 flex flex-row justify-between items-center transition-colors"
      >
        <div className="flex flex-row items-center gap-3">
          <span className="text-[21px] sm:text-[26px] tracking-tight text-black font-medium select-none">
            SkillProof&reg;
          </span>
        </div>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex flex-row items-center text-[19px] lg:text-[21px] text-black gap-6">
          <a href="#how-it-works" className="hover:opacity-60 transition-opacity">For Talent</a>
          <span className="opacity-40">/</span>
          <a href="#recruiters" className="hover:opacity-60 transition-opacity">For Business</a>
          <span className="opacity-40">/</span>
          <Link to="/login" className="hover:opacity-60 transition-opacity font-medium">Login</Link>
        </nav>
        
        <Link to="/register" className="hidden md:block text-[19px] lg:text-[21px] text-black font-bold border border-black/20 rounded-full px-5 py-2 hover:bg-black hover:text-white transition-all">
          Get Started
        </Link>
        
        {/* Mobile Hamburger */}
        <button 
          className="md:hidden relative z-[70] flex flex-col justify-center items-center w-8 h-8 gap-[5px]"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[7px]' : ''}`} />
          <span className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-[2px] bg-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`} />
        </button>
      </motion.header>

      {/* Mobile Nav Overlay */}
      <div className={`fixed inset-0 z-[50] bg-white/95 backdrop-blur-md transition-all duration-300 md:hidden flex flex-col items-center justify-center gap-6 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <a href="#how-it-works" className="text-3xl text-black hover:opacity-60" onClick={() => setIsMobileMenuOpen(false)}>For Talent</a>
        <a href="#recruiters" className="text-3xl text-black hover:opacity-60" onClick={() => setIsMobileMenuOpen(false)}>For Business</a>
        <Link to="/login" className="text-3xl text-black hover:opacity-60 mt-4" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
        <Link to="/register" className="mt-6 text-2xl text-white bg-black px-8 py-3 rounded-full hover:bg-black/80" onClick={() => setIsMobileMenuOpen(false)}>
          Get Started
        </Link>
      </div>

      {/* Content Layout */}
      <div className="relative z-10 flex flex-col order-first lg:order-none w-full bg-white lg:bg-transparent pb-8 lg:pb-0 lg:min-h-screen pt-24 lg:pt-0">
        <main id="spade-hero" className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          
          <motion.h1 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="font-sans text-5xl md:text-6xl lg:text-[76px] font-normal tracking-tight text-black leading-[1.08] mb-8 select-none w-full flex flex-wrap"
          >
            {headlineWords.map((wordObj, i) => (
              <React.Fragment key={i}>
                <span className="inline-block overflow-hidden mr-[0.3em] pb-2">
                  <motion.span variants={wordVariants} className="inline-block">
                    {wordObj.text}
                  </motion.span>
                </span>
                {wordObj.break && <br className="hidden lg:block w-full" />}
              </React.Fragment>
            ))}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="flex flex-col relative z-20"
          >
            <p className="text-lg md:text-xl text-[#5A635A] leading-relaxed font-normal mb-14 max-w-2xl">
              Resumes claim skills. SkillProof verifies them. <br className="hidden sm:block" /> Take live AI-observed assessments and earn undeniable, cryptographic proof of your abilities.
            </p>
          </motion.div>

          {/* Interactive Multi-Select Service Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.0, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <h3 className="text-2xl font-medium tracking-tight mb-2">What role are you verifying for?</h3>
            <p className="opacity-85 text-[#738273] mb-8">Select all that apply</p>
            
            <div className="flex flex-wrap gap-3 mb-8 max-w-2xl">
              {serviceOptions.map((opt, i) => {
                const isActive = services.includes(opt);
                return (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 1.1 + (i * 0.1), type: "spring", stiffness: 200, damping: 20 }}
                    key={opt}
                    onClick={() => toggleService(opt)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-medium transition-colors ${
                      isActive 
                        ? 'bg-[#1C2E1E] text-white shadow-md shadow-emerald-950/5' 
                        : 'bg-white text-[#1C2E1E] border border-[#F1F3F1] hover:bg-[#F1F3F1]/55'
                    }`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {opt}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {services.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  className="italic text-xs text-neutral-500"
                >
                  Please click to select services above.
                </motion.div>
              ) : (
                <motion.div
                  key="active"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-[#FAFBF9] border border-[#F1F3F1] rounded-2xl p-4 flex flex-row items-center justify-between shadow-sm max-w-xl">
                    <span className="text-sm font-medium text-[#1C2E1E]">
                      Ready to get verified in: <span className="font-semibold">{services.join(", ")}</span>
                    </span>
                    <Link to="/register" className="text-[#4D6D47] uppercase text-xs font-bold tracking-wider hover:opacity-70 transition-opacity">
                      Start Verification &rarr;
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
