import React from "react";
import { useLocation } from "wouter";

export function BiryaniHeroBanner() {
  const [, navigate] = useLocation();

  const handleExplore = () => {
    navigate("/restaurants");
  };

  return (
    <div
      onClick={handleExplore}
      className="group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-border/80 bg-slate-950 shadow-md transition-all duration-300 hover:shadow-xl select-none"
      role="button"
      tabIndex={0}
      aria-label="Order Food Online - Explore Restaurants"
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleExplore()}
    >
      {/* Banner Image with responsive 3:1 to 4:1 display */}
      <div className="relative aspect-[3/1] w-full min-h-[110px] sm:min-h-[140px] md:min-h-[160px]">
        <img
          src="/images/food-banner-biryani.png"
          alt="Order Food Online - From your favorite local restaurants"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.015]"
          loading="eager"
        />

        {/* Realistic Hot Steam / Vapour Animation Layer over the Biryani Bowl */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {/* Steam SVG Filters & Plumes */}
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1024 341"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Blur filters for soft natural vapor dispersion */}
              <filter id="steamBlurStrong" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="7" />
              </filter>
              <filter id="steamBlurMedium" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4.5" />
              </filter>
              <filter id="steamBlurFine" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2.8" />
              </filter>

              {/* Steam Gradients: rising from warm rice to dissipated air */}
              <linearGradient id="steamGrad1" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="25%" stopColor="#fff8f0" stopOpacity="0.5" />
                <stop offset="65%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="steamGrad2" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="30%" stopColor="#f8fafc" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#ffffff" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              <linearGradient id="steamGrad3" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="20%" stopColor="#fffbeb" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#f1f5f9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Plume 1: Main central vapor stream from drumstick & center rice */}
            <path
              d="M 665 175 C 655 140, 680 115, 660 80 C 645 50, 670 25, 650 -10"
              stroke="url(#steamGrad1)"
              strokeWidth="22"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurStrong)"
              className="biryani-steam-plume-1"
            />
            <path
              d="M 665 175 C 655 140, 680 115, 660 80 C 645 50, 670 25, 650 -10"
              stroke="url(#steamGrad1)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurFine)"
              className="biryani-steam-plume-1-core"
            />

            {/* Plume 2: Left wisp rising and curling outward */}
            <path
              d="M 615 180 C 605 145, 630 120, 608 90 C 590 62, 615 35, 595 5"
              stroke="url(#steamGrad2)"
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurStrong)"
              className="biryani-steam-plume-2"
            />
            <path
              d="M 615 180 C 605 145, 630 120, 608 90 C 590 62, 615 35, 595 5"
              stroke="url(#steamGrad2)"
              strokeWidth="8"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurMedium)"
              className="biryani-steam-plume-2-core"
            />

            {/* Plume 3: Right wisp drifting gently to the right */}
            <path
              d="M 720 185 C 735 150, 710 125, 730 95 C 745 68, 725 38, 740 8"
              stroke="url(#steamGrad3)"
              strokeWidth="19"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurStrong)"
              className="biryani-steam-plume-3"
            />
            <path
              d="M 720 185 C 735 150, 710 125, 730 95 C 745 68, 725 38, 740 8"
              stroke="url(#steamGrad3)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurMedium)"
              className="biryani-steam-plume-3-core"
            />

            {/* Plume 4: High curling aromatic tendril */}
            <path
              d="M 645 160 C 670 135, 640 100, 665 65 C 685 35, 655 10, 675 -15"
              stroke="url(#steamGrad2)"
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurMedium)"
              className="biryani-steam-plume-4"
            />

            {/* Plume 5: Secondary right aromatic curl */}
            <path
              d="M 685 165 C 670 130, 698 105, 680 72 C 665 42, 690 18, 670 -12"
              stroke="url(#steamGrad1)"
              strokeWidth="16"
              strokeLinecap="round"
              fill="none"
              filter="url(#steamBlurStrong)"
              className="biryani-steam-plume-5"
            />
          </svg>

          {/* Organic Ambient Vapor Puffs (Diffused expanding clouds) */}
          <div className="biryani-vapor-cloud cloud-1" />
          <div className="biryani-vapor-cloud cloud-2" />
          <div className="biryani-vapor-cloud cloud-3" />
        </div>

        {/* Interactive "Explore Food" Button Hit Area & Hover Glow Effect */}
        <div
          className="absolute left-[3.5%] top-[56%] h-[18%] w-[21%] rounded-full transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center justify-center pointer-events-auto"
          title="Explore Food"
        >
          {/* Subtle golden ambient hover ring over the button */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ring-2 ring-yellow-400/70 shadow-[0_0_16px_rgba(250,204,21,0.6)]" />
        </div>
      </div>

      {/* Scoped CSS Keyframes for Realistic Hot Food Vapor */}
      <style>{`
        /* Plume 1 Main Cycle */
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

        /* Plume 2 Left Sway Cycle */
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

        /* Plume 3 Right Drift Cycle */
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

        /* Plume 4 Wave Cycle */
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

        /* Ambient Diffuse Vapor Clouds */
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
          0% {
            opacity: 0;
            transform: translate(0, 8px) scale(0.7);
          }
          25% {
            opacity: 0.45;
          }
          70% {
            opacity: 0.18;
            transform: translate(-6px, -24px) scale(1.25);
          }
          100% {
            opacity: 0;
            transform: translate(-12px, -45px) scale(1.6);
          }
        }

        @keyframes ambientVapor2 {
          0% {
            opacity: 0;
            transform: translate(0, 6px) scale(0.75);
          }
          30% {
            opacity: 0.4;
          }
          75% {
            opacity: 0.15;
            transform: translate(8px, -22px) scale(1.3);
          }
          100% {
            opacity: 0;
            transform: translate(16px, -42px) scale(1.65);
          }
        }
      `}</style>
    </div>
  );
}

export default BiryaniHeroBanner;
