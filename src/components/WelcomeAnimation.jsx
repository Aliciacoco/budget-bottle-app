// WelcomeAnimation.jsx - 欢迎动画 + 瀑布流式新手引导
// v6: 使用BudgetCloud组件（带眼睛）、云朵水位降到最低

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Droplets, Sparkles, ChevronDown } from 'lucide-react';
import BudgetCloud from './BudgetCloud';

// ===== 颜色常量 =====
const POOL_COLOR = '#00BFDC';
const SEABED_COLOR = '#003B4F';

// ===== 心愿池组件 - 全宽 + Canvas波浪 =====
const WishPoolPreview = ({ poolLevel = 0 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const wavePhaseRef = useRef(0);
  const [dimensions, setDimensions] = useState({ width: 320, height: 120 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setDimensions({ width, height: 120 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = dimensions;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const liquidHeight = (poolLevel / 100) * (height - 20);
      const liquidTop = height - liquidHeight;

      if (poolLevel > 0) {
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x++) {
          const wave1 = Math.sin(x * 0.03 + wavePhaseRef.current) * 5;
          const wave2 = Math.sin(x * 0.02 + wavePhaseRef.current * 0.7) * 3;
          const y = liquidTop + wave1 + wave2;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, liquidTop, 0, height);
        gradient.addColorStop(0, POOL_COLOR);
        gradient.addColorStop(1, '#0891B2');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let x = 0; x <= width; x++) {
          const wave1 = Math.sin(x * 0.025 + wavePhaseRef.current * 0.8 + 1) * 4;
          const wave2 = Math.sin(x * 0.04 + wavePhaseRef.current * 1.2) * 2;
          const y = liquidTop + 6 + wave1 + wave2;
          ctx.lineTo(x, Math.max(y, liquidTop));
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
      }

      wavePhaseRef.current += 0.05;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [poolLevel, dimensions]);

  return (
    <div ref={containerRef} className="w-full px-6">
      <div
        className="relative w-full rounded-[24px] overflow-hidden border-4 border-white/20"
        style={{ backgroundColor: SEABED_COLOR, height: dimensions.height }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white/80 font-bold text-lg font-rounded">心愿池</span>
        </div>
      </div>
      {poolLevel > 30 && (
        <div className="text-center mt-3">
          <span className="text-white/60 text-sm font-bold font-rounded">+¥{Math.floor(poolLevel * 1.5)}</span>
        </div>
      )}
    </div>
  );
};

// ===== 手指点击动效 =====
const TapHand = () => (
  <div className="absolute -bottom-2 -right-2 animate-tap-hand">
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
      <path d="M24 8C24 6.9 24.9 6 26 6C27.1 6 28 6.9 28 8V24H24V8Z" fill="white" />
      <path d="M28 12C28 10.9 28.9 10 30 10C31.1 10 32 10.9 32 12V24H28V12Z" fill="white" />
      <path d="M32 14C32 12.9 32.9 12 34 12C35.1 12 36 12.9 36 14V24H32V14Z" fill="white" />
      <path d="M20 10C20 8.9 20.9 8 22 8C23.1 8 24 8.9 24 10V24H20V10Z" fill="white" />
      <path d="M16 20C16 18.9 16.9 18 18 18H36C37.1 18 38 18.9 38 20V32C38 37.5 33.5 42 28 42H26C20.5 42 16 37.5 16 32V20Z" fill="white" />
      <circle cx="26" cy="4" r="3" fill="white" fillOpacity="0.5" className="animate-ping-slow" />
    </svg>
  </div>
);

// ===== 滚动进度条 =====
const ScrollProgressBar = ({ progress }) => (
  <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
    <div className="h-full transition-all duration-100" style={{ width: `${progress * 100}%`, backgroundColor: POOL_COLOR }} />
  </div>
);

// ===== 主组件 =====
const WelcomeAnimation = ({ userName, onComplete, isGuest = false }) => {
  const isAnonymous = !userName || userName === '新朋友' || userName === 'guest';

  const [phase, setPhase] = useState(isGuest ? 'guestOnboarding' : 'welcome');
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isRaining, setIsRaining] = useState(false);
  const [poolLevel, setPoolLevel] = useState(0);
  const [cloudRemaining, setCloudRemaining] = useState(800);
  const [rainCloudRemaining, setRainCloudRemaining] = useState(800);
  const [visibleSections, setVisibleSections] = useState({ intro: true });

  const scrollContainerRef = useRef(null);
  const sectionsRef = useRef({});
  const rainCycleRef = useRef(null);

  // 背景粒子
  const particles = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      x: (i * 17 + 5) % 100,
      y: (i * 23 + 10) % 100,
      size: 12 + (i % 4) * 10,
      opacity: 0.03 + (i % 3) * 0.02,
      delay: (i * 0.2) % 3
    }));
  }, []);

  // 雨滴
  const rainDrops = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      x: 20 + (i % 8) * 8 + Math.random() * 4,
      delay: i * 0.12,
      duration: 1 + Math.random() * 0.4
    }));
  }, []);

  // 初始化
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // 下雨循环动画 - 云朵水位降到最低（接近0）
  const startRainCycle = useCallback(() => {
    if (rainCycleRef.current) return;
    rainCycleRef.current = true;

    const runCycle = () => {
      if (!rainCycleRef.current) return;

      // 重置状态：云朵满水，心愿池空
      setRainCloudRemaining(800);
      setPoolLevel(0);

      setTimeout(() => {
        if (!rainCycleRef.current) return;

        let cloudLevel = 800;
        let poolLvl = 0;

        const drainInterval = setInterval(() => {
          if (!rainCycleRef.current) {
            clearInterval(drainInterval);
            return;
          }

          // 云朵水位下降 - 降到接近0
          cloudLevel -= 12;
          // 心愿池水位上升
          poolLvl += 1.2;

          setRainCloudRemaining(Math.max(10, cloudLevel)); // 降到接近0
          setPoolLevel(Math.min(80, poolLvl));

          // 当云朵水位降到最低时
          if (cloudLevel <= 10) {
            clearInterval(drainInterval);

            // 暂停2秒展示效果
            setTimeout(() => {
              if (rainCycleRef.current) {
                runCycle();
              }
            }, 2500);
          }
        }, 50);
      }, 300);
    };

    runCycle();
  }, []);

  // 滚动处理
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight - container.clientHeight;
    const progress = Math.min(scrollTop / scrollHeight, 1);
    setScrollProgress(progress);

    Object.keys(sectionsRef.current).forEach(key => {
      const section = sectionsRef.current[key];
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const sectionTop = rect.top - containerRect.top;
      const triggerPoint = container.clientHeight * 0.6;

      if (sectionTop < triggerPoint && sectionTop > -rect.height * 0.5) {
        setVisibleSections(prev => ({ ...prev, [key]: true }));

        if (key === 'rain' && !isRaining) {
          setIsRaining(true);
          startRainCycle();
        }
      }
    });
  }, [isRaining, startRainCycle]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container && (phase === 'onboarding' || phase === 'guestOnboarding')) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [phase, handleScroll]);

  const handleComplete = () => {
    setIsExiting(true);
    rainCycleRef.current = null;
    setTimeout(() => {
      setPhase('complete');
      onComplete?.();
    }, 500);
  };

  const handleCloudTap = () => {
    setCloudRemaining(prev => Math.max(0, prev - 50));
  };

  const setSectionRef = (key) => (el) => {
    sectionsRef.current[key] = el;
  };

  const getBgColor = () => {
    if (phase === 'welcome') return POOL_COLOR;
    if (scrollProgress < 0.25) return POOL_COLOR;
    if (scrollProgress < 0.5) return '#0891B2';
    if (scrollProgress < 0.75) return '#0E7490';
    return SEABED_COLOR;
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: getBgColor() }}
    >
      {/* ===== 欢迎页（非游客）===== */}
      {phase === 'welcome' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
              <div
                key={p.id}
                className="absolute rounded-full animate-float-particle"
                style={{
                  left: `${p.x}%`, top: `${p.y}%`,
                  width: p.size, height: p.size,
                  backgroundColor: 'white', opacity: p.opacity,
                  animationDelay: `${p.delay}s`
                }}
              />
            ))}
          </div>

          <div className={`relative z-10 text-center flex flex-col items-center px-8 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
            {/* 使用 BudgetCloud 组件（带眼睛） */}
            <div className="mb-6 animate-bounce-gentle">
              <BudgetCloud
                remaining={800}
                total={1000}
                spent={200}
                showEyes={true}
              />
            </div>

            {isAnonymous ? (
              <>
                <h1 className="text-4xl font-bold text-white mb-3 font-rounded">你好呀~</h1>
                <p className="text-white/70 font-bold text-base">欢迎来到 CloudPool ☁️</p>
              </>
            ) : (
              <>
                <p className="text-white/60 font-bold text-base mb-2">欢迎回来</p>
                <h1 className="text-4xl font-bold text-white mb-3 font-rounded">{userName}</h1>
              </>
            )}

            <button
              onClick={handleComplete}
              className="mt-8 px-10 py-4 bg-white text-cyan-600 font-bold rounded-2xl border-b-4 border-gray-200 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
            >
              开始使用
            </button>
          </div>
        </div>
      )}

      {/* ===== 新手引导（游客）===== */}
      {phase === 'guestOnboarding' && (
        <>
          <ScrollProgressBar progress={scrollProgress} />

          <button
            onClick={handleComplete}
            className="fixed top-6 right-6 z-50 px-4 py-2 text-white/70 text-sm font-bold bg-white/10 rounded-xl backdrop-blur-sm border border-white/20 active:scale-95 transition-all"
          >
            跳过
          </button>

          <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden">
            {/* ===== 第一屏：欢迎 ===== */}
            <section
              ref={setSectionRef('intro')}
              className="min-h-[90vh] flex flex-col items-center justify-center px-8 relative"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map(p => (
                  <div
                    key={p.id}
                    className="absolute rounded-full animate-float-particle"
                    style={{
                      left: `${p.x}%`, top: `${p.y}%`,
                      width: p.size, height: p.size,
                      backgroundColor: 'white', opacity: p.opacity,
                      animationDelay: `${p.delay}s`
                    }}
                  />
                ))}
              </div>

              <div className={`text-center flex flex-col items-center relative z-10 transition-all duration-1000 ${visibleSections.intro ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}>
                {/* 使用 BudgetCloud 组件（带眼睛） */}
                <div className="mb-6 animate-bounce-gentle">
                  <BudgetCloud
                    remaining={800}
                    total={1000}
                    spent={200}
                    showEyes={true}
                  />
                </div>

                <h1 className="text-4xl font-bold text-white mb-4 font-rounded">你好呀~</h1>
                <p className="text-white/70 font-bold text-base">欢迎来到 CloudPool ☁️</p>
              </div>
            </section>

            {/* ===== 滚动提示 ===== */}
            <section className="h-[15vh] flex flex-col items-center justify-start pt-4">
              <span className="text-white/50 text-sm font-bold mb-2">向下滑动</span>
              <ChevronDown size={24} className="text-white/40 animate-bounce" />
            </section>

            {/* ===== 第二屏：周预算云朵 ===== */}
            <section
              ref={setSectionRef('tap')}
              className="min-h-screen flex flex-col items-center justify-center px-8"
            >
              <div className={`text-center flex flex-col items-center transition-all duration-1000 ${visibleSections.tap ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}>
                <p className="text-white/50 font-bold text-base mb-2">这是你的</p>
                <h1 className="text-3xl font-bold text-white mb-2 font-rounded">周预算云朵</h1>
                <p className="text-white/60 font-bold text-sm mb-8">轻轻一戳，记下花销</p>

                <div className="relative mb-8">
                  <div className="animate-float">
                    <BudgetCloud
                      remaining={cloudRemaining}
                      total={1000}
                      spent={1000 - cloudRemaining}
                      onClick={handleCloudTap}
                      showEyes={true}
                    />
                  </div>
                  <TapHand />
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
                  <p className="text-white/50 font-bold text-xs mb-1">剩余预算</p>
                  <p className="text-white font-bold text-2xl font-rounded">
                    ¥{cloudRemaining}
                    <span className="text-white/40 font-bold text-sm ml-1">/ ¥1000</span>
                  </p>
                </div>

                <p className="text-white/50 font-bold text-sm mt-6">👆 试试点击云朵</p>
              </div>
            </section>

            {/* ===== 第三屏：下雨 + 心愿池 ===== */}
            <section
              ref={setSectionRef('rain')}
              className="min-h-[120vh] flex flex-col items-center justify-start pt-[15vh] relative overflow-hidden"
            >
              {isRaining && rainDrops.map(drop => (
                <div
                  key={drop.id}
                  className="absolute animate-rain-fall"
                  style={{
                    left: `${drop.x}%`, top: '-30px',
                    animationDelay: `${drop.delay}s`,
                    animationDuration: `${drop.duration}s`
                  }}
                >
                  <Droplets size={20} className="text-white/60" />
                </div>
              ))}

              <div className={`text-center flex flex-col items-center w-full transition-all duration-1000 ${visibleSections.rain ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}>
                <p className="text-white/50 font-bold text-base mb-3 px-8">每周结算时</p>
                <h1 className="text-3xl font-bold text-white mb-8 font-rounded text-center px-8">
                  省下的钱<br />会化作雨水
                </h1>

                {/* 云朵水位会降到最低 */}
                <div className={`mb-8 ${isRaining ? 'animate-rain-cloud' : 'animate-float'}`}>
                  <BudgetCloud
                    remaining={rainCloudRemaining}
                    total={1000}
                    spent={1000 - rainCloudRemaining}
                    showEyes={true}
                  />
                </div>

                <p className="text-white/70 font-bold text-base mb-8 px-8">流入你的心愿池</p>

                <WishPoolPreview poolLevel={poolLevel} />
              </div>
            </section>

            {/* ===== 第四屏：许愿 ===== */}
            <section
              ref={setSectionRef('wish')}
              className="min-h-screen flex flex-col items-center justify-center px-8 relative"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <Sparkles
                    key={i}
                    size={8 + Math.random() * 10}
                    className="absolute text-yellow-300/40 animate-twinkle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 3}s`
                    }}
                  />
                ))}
              </div>

              <div className={`text-center flex flex-col items-center relative z-10 transition-all duration-1000 ${visibleSections.wish ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}>
                <p className="text-white/50 font-bold text-base mb-3">在这里许个愿</p>
                <h1 className="text-3xl font-bold text-white mb-8 font-rounded text-center">
                  用攒下的钱<br />实现它
                </h1>

                <div className="w-28 h-28 mb-8 rounded-3xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 animate-float">
                  <span className="text-5xl">🎁</span>
                </div>

                <p className="text-white/80 font-bold text-lg mb-2">这就是 CloudPool 的魔法 ✨</p>
                <p className="text-white/50 font-bold text-sm mb-10">每一分节省，都在靠近心愿</p>

                <button
                  onClick={handleComplete}
                  className="px-12 py-4 rounded-2xl font-bold text-white border-b-4 active:border-b-0 active:translate-y-1 transition-all"
                  style={{ backgroundColor: POOL_COLOR, borderColor: '#0891B2' }}
                >
                  开启旅程
                </button>
              </div>
            </section>

            <div className="h-20" />
          </div>
        </>
      )}

      {/* ===== 全局样式 ===== */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&display=swap');
        
        .font-rounded {
          font-family: 'M PLUS Rounded 1c', sans-serif;
        }
        
        @keyframes float-particle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-float-particle {
          animation: float-particle 3s ease-in-out infinite;
        }
        
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 2s ease-in-out infinite;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(-0.5deg); }
          50% { transform: translateY(-8px) rotate(0.5deg); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        @keyframes rain-cloud {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-1.5deg); }
          75% { transform: translateY(-4px) rotate(1.5deg); }
        }
        .animate-rain-cloud {
          animation: rain-cloud 0.6s ease-in-out infinite;
        }
        
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 1.2s ease-out infinite;
        }
        
        @keyframes rain-fall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.7; }
          100% { transform: translateY(70vh); opacity: 0; }
        }
        .animate-rain-fall {
          animation: rain-fall linear infinite;
        }
        
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        
        @keyframes tap-hand {
          0%, 100% { transform: translate(0, 0) rotate(-15deg); }
          50% { transform: translate(-8px, -8px) rotate(-15deg) scale(0.9); }
        }
        .animate-tap-hand {
          animation: tap-hand 1s ease-in-out infinite;
        }
        
        .overflow-y-auto::-webkit-scrollbar { display: none; }
        .overflow-y-auto { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default WelcomeAnimation;