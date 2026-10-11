import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";

export function HeroPromoCarousel() {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  // Auto-slide every 4.5 seconds unless hovered/touched
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Touch Swipe Handlers for mobile gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null) {
      if (touchDeltaX.current < -40) {
        // Swiped left -> Next slide
        setCurrentIndex((prev) => (prev + 1) % 3);
      } else if (touchDeltaX.current > 40) {
        // Swiped right -> Prev slide
        setCurrentIndex((prev) => (prev - 1 + 3) % 3);
      }
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
    setTimeout(() => setIsPaused(false), 2000);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-md select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Track (3 Slides) */}
      <div
        className="flex w-[300%] transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${(currentIndex * 100) / 3}%)` }}
      >
        {/* SLIDE 1: Order Food Online (Biryani with Realistic Hot Steam) */}
        <div
          className="w-1/3 flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/restaurants")}
          role="button"
          tabIndex={0}
          aria-label="Order Food Online - Explore Restaurants"
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/restaurants")}
        >
          <div className="group relative aspect-[3/1] w-full min-h-[110px] sm:min-h-[140px] md:min-h-[160px] overflow-hidden">
            <img
              src="/images/food-banner-biryani.png"
              alt="Order Food Online - From your favorite local restaurants"
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
              loading="eager"
            />

            {/* Realistic Hot Steam / Vapour Animation Layer */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <svg
                className="absolute inset-0 h-full w-full"
                viewBox="0 0 1024 341"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter id="heroSteamBlurStrong" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="7" />
                  </filter>
                  <filter id="heroSteamBlurMedium" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4.5" />
                  </filter>
                  <filter id="heroSteamBlurFine" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.8" />
                  </filter>

                  <linearGradient id="heroSteamGrad1" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="25%" stopColor="#fff8f0" stopOpacity="0.5" />
                    <stop offset="65%" stopColor="#ffffff" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>

                  <linearGradient id="heroSteamGrad2" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.45" />
                    <stop offset="70%" stopColor="#ffffff" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>

                  <linearGradient id="heroSteamGrad3" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                    <stop offset="20%" stopColor="#fffbeb" stopOpacity="0.4" />
                    <stop offset="60%" stopColor="#f1f5f9" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Plume 1: Main central vapor stream from drumstick & center rice */}
                <path
                  d="M 665 175 C 655 140, 680 115, 660 80 C 645 50, 670 25, 650 -10"
                  stroke="url(#heroSteamGrad1)"
                  strokeWidth="22"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurStrong)"
                  className="biryani-steam-plume-1"
                />
                <path
                  d="M 665 175 C 655 140, 680 115, 660 80 C 645 50, 670 25, 650 -10"
                  stroke="url(#heroSteamGrad1)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurFine)"
                  className="biryani-steam-plume-1-core"
                />

                {/* Plume 2: Left wisp */}
                <path
                  d="M 615 180 C 605 145, 630 120, 608 90 C 590 62, 615 35, 595 5"
                  stroke="url(#heroSteamGrad2)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurStrong)"
                  className="biryani-steam-plume-2"
                />
                <path
                  d="M 615 180 C 605 145, 630 120, 608 90 C 590 62, 615 35, 595 5"
                  stroke="url(#heroSteamGrad2)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurMedium)"
                  className="biryani-steam-plume-2-core"
                />

                {/* Plume 3: Right wisp */}
                <path
                  d="M 720 185 C 735 150, 710 125, 730 95 C 745 68, 725 38, 740 8"
                  stroke="url(#heroSteamGrad3)"
                  strokeWidth="19"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurStrong)"
                  className="biryani-steam-plume-3"
                />
                <path
                  d="M 720 185 C 735 150, 710 125, 730 95 C 745 68, 725 38, 740 8"
                  stroke="url(#heroSteamGrad3)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurMedium)"
                  className="biryani-steam-plume-3-core"
                />

                {/* Plume 4: High curling aromatic tendril */}
                <path
                  d="M 645 160 C 670 135, 640 100, 665 65 C 685 35, 655 10, 675 -15"
                  stroke="url(#heroSteamGrad2)"
                  strokeWidth="14"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurMedium)"
                  className="biryani-steam-plume-4"
                />

                {/* Plume 5: Secondary right aromatic curl */}
                <path
                  d="M 685 165 C 670 130, 698 105, 680 72 C 665 42, 690 18, 670 -12"
                  stroke="url(#heroSteamGrad1)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  fill="none"
                  filter="url(#heroSteamBlurStrong)"
                  className="biryani-steam-plume-5"
                />
              </svg>

              {/* Diffused vapor clouds */}
              <div className="biryani-vapor-cloud cloud-1" />
              <div className="biryani-vapor-cloud cloud-2" />
              <div className="biryani-vapor-cloud cloud-3" />
            </div>

            {/* "Explore Food" Button Interactive Hit Area */}
            <div
              className="absolute left-[3.5%] top-[56%] h-[18%] w-[21%] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
              title="Explore Food"
            >
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-yellow-400/70 shadow-[0_0_16px_rgba(250,204,21,0.6)]" />
            </div>
          </div>
        </div>

        {/* SLIDE 2: HomeCare Repairs (Electrician & Technicians) */}
        <div
          className="w-1/3 flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/electrician")}
          role="button"
          tabIndex={0}
          aria-label="HomeCare Repairs - Electrician and Technician Services"
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/electrician")}
        >
          <div className="group relative aspect-[3/1] w-full min-h-[110px] sm:min-h-[140px] md:min-h-[160px] overflow-hidden">
            <img
              src="/images/homecare-repairs-banner.png"
              alt="HomeCare Repairs - Trusted Home Appliance Repair Services Near You"
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
              loading="eager"
            />

            {/* Subtle Technician Spark & Clean Flow Accent */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {/* AC gentle cool breeze flow */}
              <div className="repairs-ac-breeze" />
              {/* Subtle appliance highlight glow */}
              <div className="repairs-tv-glow" />
            </div>

            {/* "Book a Service" Button Interactive Hit Area */}
            <div
              className="absolute left-[2.7%] top-[64%] h-[15%] w-[19%] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
              title="Book a Service"
            >
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-yellow-400/80 shadow-[0_0_16px_rgba(250,204,21,0.65)]" />
            </div>
          </div>
        </div>

        {/* SLIDE 3: Beauty & Salon Services at Home */}
        <div
          className="w-1/3 flex-shrink-0 cursor-pointer"
          onClick={() => navigate("/beauty")}
          role="button"
          tabIndex={0}
          aria-label="Professional Beauty & Salon Services at Your Home - Book Now"
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && navigate("/beauty")}
        >
          <div className="group relative aspect-[3/1] w-full min-h-[110px] sm:min-h-[140px] md:min-h-[160px] overflow-hidden">
            <img
              src="/images/beauty-salon-banner.png"
              alt="Professional Beauty & Salon Services at Your Home - Book certified beauticians"
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
              loading="eager"
            />

            {/* Subtle Luxury & Beauty Shimmer / Glow Overlay */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              {/* Soft salon comfort glow around beautician & client */}
              <div className="beauty-pamper-glow" />
              {/* Micro sparkles */}
              <div className="beauty-sparkle sparkle-1" />
              <div className="beauty-sparkle sparkle-2" />
              <div className="beauty-sparkle sparkle-3" />
              {/* Smartphone screen subtle gloss sweep */}
              <div className="beauty-phone-shimmer" />
            </div>

            {/* "Book Now" Button Interactive Hit Area */}
            <div
              className="absolute left-[3.3%] top-[60.8%] h-[11.8%] w-[15.8%] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
              title="Book Beauty Services Now"
            >
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-rose-400/80 shadow-[0_0_16px_rgba(244,63,94,0.65)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Indicators (Modern Pill Dots - 3 Slides) */}
      <div className="absolute bottom-2.5 right-3 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 backdrop-blur-xs">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(0);
          }}
          className={`h-1.5 transition-all duration-300 rounded-full ${
            currentIndex === 0 ? "w-5 bg-amber-400" : "w-1.5 bg-white/60 hover:bg-white"
          }`}
          aria-label="Go to Food banner"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(1);
          }}
          className={`h-1.5 transition-all duration-300 rounded-full ${
            currentIndex === 1 ? "w-5 bg-amber-400" : "w-1.5 bg-white/60 hover:bg-white"
          }`}
          aria-label="Go to Repairs & Technician banner"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrentIndex(2);
          }}
          className={`h-1.5 transition-all duration-300 rounded-full ${
            currentIndex === 2 ? "w-5 bg-amber-400" : "w-1.5 bg-white/60 hover:bg-white"
          }`}
          aria-label="Go to Beauty & Salon banner"
        />
      </div>

      {/* Scoped CSS for Realistic Steam & Technician Accents */}
      <style>{`
        /* Steam keyframes */
        @keyframes steamRiseCycle1 {
          0% {
            opacity: 0;
            transform: translateY(12px) scaleX(0.85) scaleY(0.9);
          }
          20% {
            opacity: 0.65;
          }
          60% {
            opacity: 0.45;
            transform: translateY(-28px) scaleX(1.15) scaleY(1.1);
          }
          100% {
            opacity: 0;
            transform: translateY(-58px) scaleX(1.4) scaleY(1.25);
          }
        }

        @keyframes steamRiseCycle2 {
          0% {
            opacity: 0;
            transform: translateY(14px) translateX(0) scale(0.9);
          }
          25% {
            opacity: 0.55;
          }
          65% {
            opacity: 0.35;
            transform: translateY(-26px) translateX(-6px) scale(1.15);
          }
          100% {
            opacity: 0;
            transform: translateY(-54px) translateX(-14px) scale(1.35);
          }
        }

        @keyframes steamRiseCycle3 {
          0% {
            opacity: 0;
            transform: translateY(10px) translateX(0) scale(0.9);
          }
          20% {
            opacity: 0.58;
          }
          60% {
            opacity: 0.38;
            transform: translateY(-25px) translateX(6px) scale(1.18);
          }
          100% {
            opacity: 0;
            transform: translateY(-52px) translateX(12px) scale(1.38);
          }
        }

        @keyframes steamRiseCycle4 {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.88);
          }
          30% {
            opacity: 0.45;
          }
          70% {
            opacity: 0.25;
            transform: translateY(-30px) scale(1.22);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(1.45);
          }
        }

        .biryani-steam-plume-1 {
          animation: steamRiseCycle1 3.4s ease-out infinite;
        }
        .biryani-steam-plume-1-core {
          animation: steamRiseCycle1 3.4s ease-out infinite;
          opacity: 0.5;
        }
        .biryani-steam-plume-2 {
          animation: steamRiseCycle2 3.8s ease-out 0.9s infinite;
        }
        .biryani-steam-plume-2-core {
          animation: steamRiseCycle2 3.8s ease-out 0.9s infinite;
          opacity: 0.45;
        }
        .biryani-steam-plume-3 {
          animation: steamRiseCycle3 4.1s ease-out 1.7s infinite;
        }
        .biryani-steam-plume-3-core {
          animation: steamRiseCycle3 4.1s ease-out 1.7s infinite;
          opacity: 0.45;
        }
        .biryani-steam-plume-4 {
          animation: steamRiseCycle4 3.6s ease-out 0.4s infinite;
        }
        .biryani-steam-plume-5 {
          animation: steamRiseCycle1 4.2s ease-out 2.2s infinite;
        }

        .biryani-vapor-cloud {
          position: absolute;
          border-radius: 9999px;
          pointer-events: none;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.28) 0%, rgba(248, 250, 252, 0.12) 40%, rgba(255, 255, 255, 0) 70%);
        }
        .cloud-1 {
          width: 90px;
          height: 50px;
          left: 62%;
          top: 32%;
          filter: blur(10px);
          animation: ambientVapor1 4.2s ease-out infinite;
        }
        .cloud-2 {
          width: 80px;
          height: 45px;
          left: 68%;
          top: 30%;
          filter: blur(12px);
          animation: ambientVapor2 4.6s ease-out 1.8s infinite;
        }
        .cloud-3 {
          width: 100px;
          height: 55px;
          left: 64%;
          top: 25%;
          filter: blur(14px);
          animation: ambientVapor1 5.2s ease-out 2.8s infinite;
        }

        @keyframes ambientVapor1 {
          0% { opacity: 0; transform: translate(0, 8px) scale(0.7); }
          25% { opacity: 0.45; }
          70% { opacity: 0.18; transform: translate(-6px, -24px) scale(1.25); }
          100% { opacity: 0; transform: translate(-12px, -45px) scale(1.6); }
        }
        @keyframes ambientVapor2 {
          0% { opacity: 0; transform: translate(0, 6px) scale(0.75); }
          30% { opacity: 0.4; }
          75% { opacity: 0.15; transform: translate(8px, -22px) scale(1.3); }
          100% { opacity: 0; transform: translate(16px, -42px) scale(1.65); }
        }

        /* Technician & AC subtle animations */
        .repairs-ac-breeze {
          position: absolute;
          left: 45%;
          top: 42%;
          width: 85px;
          height: 25px;
          background: linear-gradient(180deg, rgba(56, 189, 248, 0.22) 0%, transparent 100%);
          filter: blur(6px);
          border-radius: 9999px;
          animation: acCoolBreeze 3.5s ease-in-out infinite;
        }
        @keyframes acCoolBreeze {
          0%, 100% { opacity: 0.2; transform: translateY(0) scaleX(0.9); }
          50% { opacity: 0.65; transform: translateY(6px) scaleX(1.1); }
        }

        .repairs-tv-glow {
          position: absolute;
          left: 37%;
          top: 55%;
          width: 130px;
          height: 75px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 75%);
          filter: blur(12px);
          animation: tvScreenGlow 4s ease-in-out infinite;
        }
        @keyframes tvScreenGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }

        /* Beauty & Salon Micro-animations */
        .beauty-pamper-glow {
          position: absolute;
          left: 55%;
          top: 35%;
          width: 160px;
          height: 100px;
          background: radial-gradient(circle, rgba(244, 114, 182, 0.18) 0%, rgba(251, 191, 36, 0.08) 50%, transparent 80%);
          filter: blur(16px);
          animation: pamperPulse 4s ease-in-out infinite;
        }
        @keyframes pamperPulse {
          0%, 100% { opacity: 0.35; transform: scale(0.95); }
          50% { opacity: 0.75; transform: scale(1.08); }
        }

        .beauty-sparkle {
          position: absolute;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #ffffff;
          box-shadow: 0 0 10px 2px rgba(251, 191, 36, 0.9), 0 0 4px 1px rgba(244, 114, 182, 0.8);
          pointer-events: none;
        }
        .sparkle-1 {
          left: 60%;
          top: 52%;
          animation: sparkleTwinkle 3.2s ease-in-out infinite;
        }
        .sparkle-2 {
          left: 48%;
          top: 18%;
          animation: sparkleTwinkle 3.8s ease-in-out 1.2s infinite;
        }
        .sparkle-3 {
          left: 93%;
          top: 25%;
          animation: sparkleTwinkle 4.2s ease-in-out 2s infinite;
        }
        @keyframes sparkleTwinkle {
          0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          50% { opacity: 0.95; transform: scale(1.2) rotate(45deg); }
        }

        .beauty-phone-shimmer {
          position: absolute;
          left: 77%;
          top: 15%;
          width: 85px;
          height: 180px;
          background: linear-gradient(135deg, transparent 40%, rgba(255, 255, 255, 0.18) 50%, transparent 60%);
          transform: rotate(-10deg);
          pointer-events: none;
          animation: phoneGloss 5s ease-in-out infinite;
        }
        @keyframes phoneGloss {
          0%, 100% { opacity: 0; transform: translateY(-30px) rotate(-10deg); }
          40% { opacity: 0.65; }
          70% { opacity: 0; transform: translateY(40px) rotate(-10deg); }
        }
      `}</style>
    </div>
  );
}

export default HeroPromoCarousel;
