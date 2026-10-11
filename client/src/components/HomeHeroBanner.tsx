import React from "react";

export function HomeHeroBanner() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      <style>{`
        @keyframes bannerRouteFlow {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -36; }
        }
        @keyframes bannerScooterBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes bannerSpeedPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.92); }
          50% { opacity: 1; transform: scale(1.08); }
        }
        @keyframes bannerPinBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes bannerCloudFloat {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(8px); }
        }
        @keyframes bannerSparkleTwinkle {
          0%, 100% { opacity: 0.45; transform: scale(0.88); }
          50% { opacity: 1; transform: scale(1.15); }
        }
        @keyframes bannerLeafSway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(2.5deg); }
        }
        @keyframes bannerWaveLeftDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(2px, -2px) scale(1.015); }
        }
        @keyframes bannerWaveRightDrift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-2px, -2px) scale(1.015); }
        }

        .banner-anim-route {
          animation: bannerRouteFlow 2.8s linear infinite;
        }
        .banner-anim-scooter {
          animation: bannerScooterBounce 1.6s ease-in-out infinite;
        }
        .banner-anim-speed {
          animation: bannerSpeedPulse 1.2s ease-in-out infinite;
        }
        .banner-anim-pin {
          animation: bannerPinBob 2.2s ease-in-out infinite;
        }
        .banner-anim-cloud {
          animation: bannerCloudFloat 6.5s ease-in-out infinite;
        }
        .banner-anim-sparkle {
          animation: bannerSparkleTwinkle 2s ease-in-out infinite;
        }
        .banner-anim-leaf {
          animation: bannerLeafSway 4.5s ease-in-out infinite;
        }
        .banner-anim-wave-left {
          animation: bannerWaveLeftDrift 7s ease-in-out infinite;
        }
        .banner-anim-wave-right {
          animation: bannerWaveRightDrift 7.5s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .banner-horizon-group {
            opacity: 0.42;
            transform: translateY(12px);
          }
          .banner-fork-knife {
            opacity: 0.4;
          }
        }
      `}</style>

      {/* Deep Royal Blue Multi-stop Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #072658 0%, #0d4294 38%, #0f4ea8 65%, #082960 100%)",
        }}
      />

      {/* Ambient Radial Glows */}
      <div
        className="absolute -top-10 left-1/4 h-52 w-[420px] rounded-full blur-3xl opacity-35"
        style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-10 right-10 h-44 w-[380px] rounded-full blur-3xl opacity-30"
        style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }}
      />

      {/* Hero Vector Illustration Canvas */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 160"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top-Left Wave Gradient */}
          <linearGradient id="waveTopLeft" x1="0" y1="0" x2="220" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#1d4ed8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0d4294" stopOpacity="0" />
          </linearGradient>

          {/* Top-Left Secondary Wave */}
          <linearGradient id="waveTopLeft2" x1="0" y1="0" x2="160" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#092a63" stopOpacity="0" />
          </linearGradient>

          {/* Top-Right Wave Gradient */}
          <linearGradient id="waveTopRight" x1="1000" y1="0" x2="760" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#2563eb" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#092a63" stopOpacity="0" />
          </linearGradient>

          {/* Location Pin Glow */}
          <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
          </radialGradient>

          {/* Cloud Fill */}
          <linearGradient id="cloudGrad" x1="330" y1="50" x2="385" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.08" />
          </linearGradient>

          {/* Botanical Leaf Gradient */}
          <linearGradient id="leafGrad" x1="910" y1="130" x2="980" y2="60" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.25" />
          </linearGradient>
        </defs>

        {/* 1. TOP-LEFT LAYERED WAVES */}
        <g className="banner-anim-wave-left">
          <path
            d="M -10 -10 L 0 95 C 40 85, 75 55, 95 30 C 120 2, 160 0, 210 -10 Z"
            fill="url(#waveTopLeft)"
          />
          <path
            d="M -10 -10 L 0 135 C 55 125, 95 80, 130 45 C 165 10, 220 5, 270 -10 Z"
            fill="url(#waveTopLeft2)"
          />
        </g>

        {/* 2. TOP-RIGHT & RIGHT LAYERED WAVES */}
        <g className="banner-anim-wave-right">
          <path
            d="M 1010 -10 L 1010 130 C 960 115, 925 80, 895 45 C 865 10, 810 5, 760 -10 Z"
            fill="url(#waveTopRight)"
          />
          <path
            d="M 1010 20 C 970 45, 945 90, 955 145 L 1010 165 Z"
            fill="#1e40af"
            fillOpacity="0.32"
          />
        </g>

        {/* 3. LEFT SECTION: FORK & KNIFE WITH SPARKLES (MATCHING SCREENSHOT) */}
        <g className="banner-fork-knife" transform="translate(32, 68)">
          {/* Sparkles / Ray Burst above utensils */}
          <g className="banner-anim-sparkle" style={{ transformOrigin: "24px 0px" }}>
            <line x1="24" y1="-8" x2="24" y2="-17" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="16" y1="-5" x2="10" y2="-12" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="32" y1="-5" x2="38" y2="-12" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
          </g>

          {/* Fork (tilted -9deg) */}
          <g transform="rotate(-9, 12, 35)">
            {/* 4 Tines */}
            <line x1="6" y1="2" x2="6" y2="16" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="10" y1="2" x2="10" y2="16" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="14" y1="2" x2="14" y2="16" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="18" y1="2" x2="18" y2="16" stroke="#bfdbfe" strokeWidth="1.8" strokeLinecap="round" />
            {/* Fork base & handle */}
            <path
              d="M 6 15 C 6 22, 18 22, 18 15 L 18 19 C 18 24, 13.5 25, 13.5 28 L 13.5 58 C 13.5 60, 10.5 60, 10.5 58 L 10.5 28 C 10.5 25, 6 24, 6 19 Z"
              stroke="#bfdbfe"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="rgba(191, 219, 254, 0.15)"
            />
          </g>

          {/* Knife (tilted +8deg) */}
          <g transform="rotate(8, 36, 35)">
            {/* Knife blade & handle */}
            <path
              d="M 33 2 C 37 4, 42 12, 42 24 C 42 29, 36 30, 36 32 L 36 58 C 36 60, 33 60, 33 58 L 33 2 Z"
              stroke="#bfdbfe"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="rgba(191, 219, 254, 0.15)"
            />
          </g>
        </g>

        {/* 4. CENTER HORIZON SKYLINE: CLOUD, DOTTED ROUTE, PIN, SHOPS, SCOOTER */}
        <g className="banner-horizon-group">
          {/* Soft Drift Cloud */}
          <g className="banner-anim-cloud">
            <path
              d="M 335 74 C 330 74, 324 70, 326 63 C 328 56, 336 54, 340 56 C 344 48, 357 47, 362 53 C 367 49, 376 50, 378 57 C 383 58, 386 63, 384 68 C 382 73, 375 74, 370 74 Z"
              fill="url(#cloudGrad)"
              stroke="#bae6fd"
              strokeWidth="1"
              strokeOpacity="0.45"
            />
          </g>

          {/* Dynamic Dotted Traveling Route */}
          <path
            d="M 382 66 C 415 62, 440 46, 480 48 C 508 49, 528 58, 555 56 C 580 54, 600 68, 625 66 C 650 64, 675 52, 705 58"
            stroke="#93c5fd"
            strokeWidth="1.8"
            strokeDasharray="4 5"
            strokeLinecap="round"
            className="banner-anim-route"
            fill="none"
          />

          {/* Animated Map Location Pin */}
          <g className="banner-anim-pin" style={{ transformOrigin: "492px 42px" }}>
            {/* Subtle pulse shadow under pin */}
            <ellipse cx="492" cy="52" rx="4" ry="1.5" fill="#38bdf8" fillOpacity="0.3" />
            {/* Location Pin Shape */}
            <path
              d="M 492 50 C 487 43, 483 38, 483 32 C 483 26.5, 487 22, 492 22 C 497 22, 501 26.5, 501 32 C 501 38, 497 43, 492 50 Z"
              fill="url(#pinGlow)"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Inner cutout dot */}
            <circle cx="492" cy="32" r="3" fill="#ffffff" />
          </g>

          {/* Town / Storefronts Outline */}
          <g stroke="#93c5fd" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
            {/* Secondary Building Facade */}
            <rect x="580" y="44" width="28" height="34" rx="2" strokeOpacity="0.5" fill="rgba(147, 197, 253, 0.05)" />
            <line x1="586" y1="50" x2="592" y2="50" strokeOpacity="0.6" />
            <line x1="596" y1="50" x2="602" y2="50" strokeOpacity="0.6" />
            <line x1="586" y1="57" x2="592" y2="57" strokeOpacity="0.6" />
            <line x1="596" y1="57" x2="602" y2="57" strokeOpacity="0.6" />

            {/* Main Shirur Shop Building */}
            <rect x="612" y="36" width="46" height="42" rx="2" strokeOpacity="0.8" fill="rgba(147, 197, 253, 0.08)" />
            {/* Shop Roof Decorative Cornice */}
            <line x1="609" y1="36" x2="661" y2="36" stroke="#bae6fd" strokeWidth="2" />

            {/* Striped Awning */}
            <path
              d="M 610 46 L 660 46 L 656 53 C 656 55, 650 55, 650 53 C 650 55, 644 55, 644 53 C 644 55, 638 55, 638 53 C 638 55, 632 55, 632 53 C 632 55, 626 55, 626 53 C 626 55, 620 55, 620 53 C 620 55, 614 55, 614 53 Z"
              stroke="#bae6fd"
              strokeWidth="1.5"
              fill="rgba(186, 230, 253, 0.2)"
            />
            {/* Awning Stripes */}
            <line x1="620" y1="46" x2="620" y2="53" strokeOpacity="0.7" />
            <line x1="632" y1="46" x2="632" y2="53" strokeOpacity="0.7" />
            <line x1="644" y1="46" x2="644" y2="53" strokeOpacity="0.7" />

            {/* Glass Display Window */}
            <rect x="617" y="58" width="18" height="18" strokeOpacity="0.75" />
            <line x1="626" y1="58" x2="626" y2="76" strokeOpacity="0.5" />
            <line x1="617" y1="67" x2="635" y2="67" strokeOpacity="0.5" />

            {/* Shop Entrance Door */}
            <rect x="640" y="58" width="13" height="20" strokeOpacity="0.75" />
            <circle cx="643" cy="68" r="1" fill="#bae6fd" />

            {/* Right Building Silhouette */}
            <path d="M 664 48 L 684 48 L 684 78" strokeOpacity="0.5" />
            <line x1="670" y1="55" x2="678" y2="55" strokeOpacity="0.5" />
            <line x1="670" y1="62" x2="678" y2="62" strokeOpacity="0.5" />
          </g>

          {/* Delivery Scooter (Express Rider) */}
          <g className="banner-anim-scooter">
            {/* Rear Wheel */}
            <circle cx="704" cy="74" r="6" stroke="#bae6fd" strokeWidth="1.8" fill="rgba(15, 23, 42, 0.4)" />
            <circle cx="704" cy="74" r="2" fill="#bae6fd" />

            {/* Front Wheel */}
            <circle cx="738" cy="74" r="6" stroke="#bae6fd" strokeWidth="1.8" fill="rgba(15, 23, 42, 0.4)" />
            <circle cx="738" cy="74" r="2" fill="#bae6fd" />

            {/* Scooter Chassis & Fairing */}
            <path
              d="M 704 74 L 712 74 L 720 74 L 726 66 L 734 54 L 738 74"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Seat & Rear Body */}
            <path
              d="M 701 67 C 701 62, 712 62, 718 64 L 714 74"
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="rgba(255, 255, 255, 0.15)"
            />

            {/* Handlebar & Windshield */}
            <path
              d="M 732 50 L 735 54 L 728 54"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Headlight Beam Accent */}
            <line x1="738" y1="58" x2="745" y2="59" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />

            {/* Express Delivery Box Mounted on Rack */}
            <rect
              x="695"
              y="52"
              width="14"
              height="13"
              rx="2"
              stroke="#ffffff"
              strokeWidth="1.8"
              fill="rgba(56, 189, 248, 0.35)"
            />
            {/* Delivery Box Stripe/Latch */}
            <line x1="695" y1="58" x2="709" y2="58" stroke="#ffffff" strokeWidth="1.2" strokeOpacity="0.8" />
            <circle cx="702" cy="58" r="1.2" fill="#ffffff" />
          </g>

          {/* Speed / Energy Burst Rays beside Scooter */}
          <g className="banner-anim-speed" style={{ transformOrigin: "756px 60px" }}>
            <line x1="752" y1="58" x2="765" y2="55" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="755" y1="65" x2="771" y2="67" stroke="#bae6fd" strokeWidth="2" strokeLinecap="round" />
            <line x1="751" y1="72" x2="763" y2="76" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="754" y1="49" x2="766" y2="43" stroke="#bae6fd" strokeWidth="1.8" strokeLinecap="round" />
          </g>
        </g>

        {/* 5. RIGHT SECTION: BOTANICAL LEAFY BRANCH (MATCHING SCREENSHOT) */}
        <g className="banner-anim-leaf" style={{ transformOrigin: "960px 145px" }}>
          {/* Central Stem */}
          <path
            d="M 975 145 Q 960 115 952 85 Q 946 62 940 45"
            stroke="#7dd3fc"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Leaves with delicate shape & soft glow fill */}
          {/* Top Leaf */}
          <path
            d="M 940 45 C 938 32, 946 22, 948 20 C 950 25, 948 37, 940 45 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Right Leaf 1 */}
          <path
            d="M 943 55 C 955 48, 968 50, 972 52 C 968 59, 955 62, 943 55 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Left Leaf 1 */}
          <path
            d="M 948 68 C 935 62, 924 68, 920 72 C 926 78, 938 76, 948 68 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Right Leaf 2 */}
          <path
            d="M 952 82 C 966 75, 979 78, 984 81 C 980 90, 966 91, 952 82 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Left Leaf 2 */}
          <path
            d="M 956 98 C 941 90, 929 97, 924 102 C 931 109, 946 106, 956 98 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
          {/* Right Leaf 3 */}
          <path
            d="M 961 114 C 976 108, 989 112, 994 116 C 989 124, 974 124, 961 114 Z"
            fill="url(#leafGrad)"
            stroke="#bae6fd"
            strokeWidth="1.4"
          />
        </g>
      </svg>
    </div>
  );
}

export default HomeHeroBanner;
