// BrandMenuView.jsx - 品牌菜单页面（优化版）
// 点击首页左上角logo后展示的页面

import React, { useState, useEffect } from 'react';
import { Share2, LogOut, MessageCircle, Mail, ChevronRight, HelpCircle } from 'lucide-react';
import { isAnonymousUser } from '../auth';
import { 
  PageContainer, 
  TransparentNavBar, 
  DuoButton, 
  Card, 
  Modal, 
  ConfirmModal,
  ListItem,
  ListGroup
} from '../components/design-system';

// 面状图标 SVG 组件
const HelpCircleFilled = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.875 7.5C13.8795 7.50012 15.6344 8.54951 16.6309 10.1289C16.8263 10.4407 17.1405 10.6491 17.4941 10.7041C20.3311 11.1525 22.5 13.6002 22.5 16.5635C22.4998 19.8424 19.9794 22.4998 16.875 22.5H7.5C4.70997 22.3472 2.50017 20.1625 2.5 17.501C2.5 15.4752 3.78154 13.73 5.62402 12.9453C6.00893 12.7823 6.28414 12.4259 6.37012 12.002C6.88985 9.43402 9.1552 7.5 11.875 7.5Z" fill="#D2F3F7"/>
    <path d="M16.875 7.5C18.8796 7.50002 20.6344 8.54954 21.6309 10.1289C21.8262 10.4407 22.1405 10.649 22.4941 10.7041C25.3312 11.1525 27.5 13.6002 27.5 16.5635C27.5 19.8426 24.9796 22.5 21.875 22.5H12.5C9.71 22.347 7.50005 20.1625 7.5 17.501C7.5 15.4754 8.78181 13.731 10.624 12.9463C11.0089 12.7832 11.2851 12.4259 11.3711 12.002C11.8909 9.43418 14.1553 7.5 16.875 7.5Z" fill="#94E8F3"/>
  </svg>

);

const ShareFilled = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_502_1909)">
    <path d="M1 15C1 7.26801 7.26801 1 15 1C22.732 1 29 7.26801 29 15C29 22.732 22.732 29 15 29C7.26801 29 1 22.732 1 15Z" fill="#FFD9E7"/>
    <path d="M8.19141 15.5465L18.8898 20.8948L19.5218 19.6308L11.3551 15.5465L19.5218 11.4622L18.8898 10.1982L8.19141 15.5465Z" fill="#FF8EBF"/>
    <path d="M16.375 10.8298C16.375 11.2014 16.4482 11.5694 16.5904 11.9127C16.7326 12.256 16.9411 12.5679 17.2038 12.8307C17.4666 13.0935 17.7785 13.3019 18.1219 13.4441C18.4652 13.5863 18.8332 13.6595 19.2048 13.6595C19.5764 13.6595 19.9443 13.5863 20.2877 13.4441C20.631 13.3019 20.9429 13.0935 21.2057 12.8307C21.4685 12.5679 21.6769 12.256 21.8191 11.9127C21.9613 11.5694 22.0345 11.2014 22.0345 10.8298C22.0345 10.4582 21.9613 10.0902 21.8191 9.74686C21.6769 9.40354 21.4685 9.09159 21.2057 8.82882C20.9429 8.56605 20.631 8.35761 20.2877 8.2154C19.9443 8.07319 19.5764 8 19.2048 8C18.8332 8 18.4652 8.07319 18.1219 8.2154C17.7785 8.35761 17.4666 8.56605 17.2038 8.82882C16.9411 9.09159 16.7326 9.40354 16.5904 9.74686C16.4482 10.0902 16.375 10.4582 16.375 10.8298Z" fill="#FF8EBF"/>
    <path d="M16.375 20.2624C16.375 20.634 16.4482 21.002 16.5904 21.3453C16.7326 21.6886 16.9411 22.0006 17.2038 22.2633C17.4666 22.5261 17.7785 22.7345 18.1219 22.8768C18.4652 23.019 18.8332 23.0922 19.2048 23.0922C19.5764 23.0922 19.9443 23.019 20.2877 22.8768C20.631 22.7345 20.9429 22.5261 21.2057 22.2633C21.4685 22.0006 21.6769 21.6886 21.8191 21.3453C21.9613 21.002 22.0345 20.634 22.0345 20.2624C22.0345 19.8908 21.9613 19.5228 21.8191 19.1795C21.6769 18.8362 21.4685 18.5242 21.2057 18.2614C20.9429 17.9987 20.631 17.7902 20.2877 17.648C19.9443 17.5058 19.5764 17.4326 19.2048 17.4326C18.8332 17.4326 18.4652 17.5058 18.1219 17.648C17.7785 17.7902 17.4666 17.9987 17.2038 18.2614C16.9411 18.5242 16.7326 18.8362 16.5904 19.1795C16.4482 19.5228 16.375 19.8908 16.375 20.2624Z" fill="#FF8EBF"/>
    <path d="M6 15.5465C6 16.5471 6.39751 17.5068 7.10509 18.2144C7.81267 18.922 8.77236 19.3195 9.77302 19.3195C10.7737 19.3195 11.7334 18.922 12.441 18.2144C13.1485 17.5068 13.546 16.5471 13.546 15.5465C13.546 14.5458 13.1485 13.5861 12.441 12.8785C11.7334 12.171 10.7737 11.7734 9.77302 11.7734C8.77236 11.7734 7.81267 12.171 7.10509 12.8785C6.39751 13.5861 6 14.5458 6 15.5465Z" fill="#FF8EBF"/>
    <path d="M7.88672 15.5462C7.88672 15.7939 7.93551 16.0392 8.03032 16.2681C8.12513 16.497 8.26409 16.705 8.43927 16.8801C8.61444 17.0553 8.82241 17.1943 9.05129 17.2891C9.28018 17.3839 9.52549 17.4327 9.77323 17.4327C10.021 17.4327 10.2663 17.3839 10.4952 17.2891C10.7241 17.1943 10.932 17.0553 11.1072 16.8801C11.2824 16.705 11.4213 16.497 11.5161 16.2681C11.6109 16.0392 11.6597 15.7939 11.6597 15.5462C11.6597 15.2984 11.6109 15.0531 11.5161 14.8242C11.4213 14.5954 11.2824 14.3874 11.1072 14.2122C10.932 14.037 10.7241 13.8981 10.4952 13.8033C10.2663 13.7085 10.021 13.6597 9.77323 13.6597C9.52549 13.6597 9.28018 13.7085 9.05129 13.8033C8.82241 13.8981 8.61444 14.037 8.43927 14.2122C8.26409 14.3874 8.12513 14.5954 8.03032 14.8242C7.93551 15.0531 7.88672 15.2984 7.88672 15.5462Z" fill="white"/>
    </g>
    <defs>
    <clipPath id="clip0_502_1909">
    <rect width="30" height="30" fill="white"/>
    </clipPath>
    </defs>
</svg>

);

const MessageFilled = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_504_587)">
    <path d="M0 9C0 4.02944 4.02944 0 9 0H21C25.9706 0 30 4.02944 30 9V21C30 25.9706 25.9706 30 21 30H9C4.02944 30 0 25.9706 0 21V9Z" fill="#FFEAB4"/>
    <path d="M4 8C4 5.79086 5.79086 4 8 4H10C12.2091 4 14 5.79086 14 8V10C14 12.2091 12.2091 14 10 14H8C5.79086 14 4 12.2091 4 10V8Z" fill="#FFD339"/>
    <path d="M16 8C16 5.79086 17.7909 4 20 4H22C24.2091 4 26 5.79086 26 8V10C26 12.2091 24.2091 14 22 14H20C17.7909 14 16 12.2091 16 10V8Z" fill="#FFD339"/>
    <path d="M4 20C4 17.7909 5.79086 16 8 16H10C12.2091 16 14 17.7909 14 20V22C14 24.2091 12.2091 26 10 26H8C5.79086 26 4 24.2091 4 22V20Z" fill="#FFD339"/>
    <path d="M16 20C16 17.7909 17.7909 16 20 16H22C24.2091 16 26 17.7909 26 20V22C26 24.2091 24.2091 26 22 26H20C17.7909 26 16 24.2091 16 22V20Z" fill="#FFD339"/>
    </g>
    <defs>
    <clipPath id="clip0_504_587">
    <rect width="30" height="30" fill="white"/>
    </clipPath>
    </defs>
</svg>

);

const DefaultAvatar = ({ size = 30, className = '' }) => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_504_627)">
<path d="M0 9C0 4.02944 4.02944 0 9 0H21C25.9706 0 30 4.02944 30 9V21C30 25.9706 25.9706 30 21 30H9C4.02944 30 0 25.9706 0 21V9Z" fill="#00C7E4"/>
<circle cx="15" cy="15" r="12" fill="#FFCFA5"/>
<path d="M11.1008 17.1862C11.1008 18.7933 10.6285 20.0976 10.0451 20.0976C9.46329 20.0976 8.99023 18.7933 8.99023 17.1862C8.99023 15.5783 9.46332 14.2749 10.0451 14.2749C10.6285 14.2749 11.1008 15.5783 11.1008 17.1862Z" fill="#FFECE6"/>
<path d="M20.9984 17.1862C20.9984 18.7933 20.5262 20.0976 19.9436 20.0976C19.3609 20.0976 18.8887 18.7933 18.8887 17.1862C18.8887 15.5783 19.3609 14.2749 19.9436 14.2749C20.5262 14.2749 20.9984 15.5783 20.9984 17.1862Z" fill="#FFECE6"/>
<path d="M15.0083 3C8.37604 3 3 8.3752 3 15.0083C3 21.6397 8.37604 27.0165 15.0083 27.0165C21.6397 27.0165 27.0165 21.6397 27.0165 15.0083C27.0165 8.3752 21.6397 3 15.0083 3ZM15.0083 25.6339C9.13923 25.6339 4.38258 20.8766 4.38258 15.0083C4.38258 14.9035 4.39454 14.8005 4.39771 14.6958L6.975 10.3715L10.8022 12.6683L9.49083 9.82488L15.6124 13.7615L14.9572 10.4802L21.8451 13.5418L20.6424 11.0276L25.61 14.5344C25.6163 14.6926 25.634 14.8492 25.634 15.0083C25.6339 20.8765 20.8766 25.6339 15.0083 25.6339Z" fill="#FFECE6"/>
<path d="M21.6406 16.1722H20.3446C20.0326 14.4322 18.7366 13.1362 17.1766 13.1362C15.6286 13.1362 14.3326 14.4322 14.0086 16.1722H11.9086C11.5966 14.4322 10.3006 13.1362 8.74062 13.1362C7.19262 13.1362 5.89663 14.4322 5.57263 16.1722H4.36063C3.96463 16.1722 3.64062 16.4962 3.64062 16.8922C3.64062 17.2882 3.96463 17.6122 4.36063 17.6122H5.54863C5.80063 19.4482 7.13262 20.8522 8.74062 20.8522C10.3486 20.8522 11.6806 19.4482 11.9326 17.6122H13.9726C14.2246 19.4482 15.5566 20.8522 17.1646 20.8522C18.7726 20.8522 20.1046 19.4482 20.3566 17.6122H21.6406C22.0366 17.6122 22.3606 17.2882 22.3606 16.8922C22.3606 16.4962 22.0366 16.1722 21.6406 16.1722ZM6.43663 15.6682L6.23262 15.6202C6.24462 15.5722 6.50863 14.3722 7.61263 13.7002L7.72063 13.8802C6.70063 14.5162 6.43663 15.6562 6.43663 15.6682ZM14.9446 15.6682L14.7406 15.6202C14.7526 15.5722 15.0166 14.3722 16.1206 13.7002L16.2286 13.8802C15.2086 14.5162 14.9446 15.6562 14.9446 15.6682Z" fill="black"/>
<path d="M29.843 25.348C30.0262 25.2987 30.0575 25.0328 29.892 24.9398C29.0901 24.4897 27.5273 23.5272 26.7527 22.4709C25.8994 21.308 25.4253 19.2125 25.2333 18.1764C25.1979 17.9833 24.9239 17.934 24.8235 18.1029C24.2891 19.0064 23.1329 20.8005 21.9509 21.5917C20.8348 22.3384 19.0695 22.6762 18.1857 22.8055C18.0001 22.8322 17.9326 23.0859 18.0812 23.2007C18.8269 23.7761 20.3375 25.0207 21.1137 26.2159C21.8505 27.3514 22.4636 29.0905 22.7143 29.8559C22.7657 30.0142 22.977 30.0514 23.0799 29.9205C23.5909 29.2707 24.8162 27.7821 25.9363 26.9788C27.0596 26.1731 28.9238 25.5985 29.843 25.348Z" fill="#FF850F"/>
</g>
<defs>
<clipPath id="clip0_504_627">
<rect width="30" height="30" fill="white"/>
</clipPath>
</defs>
</svg>






);

const LogOutFilled = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
  </svg>
);

const LoginFilled = ({ size = 22, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v14z"/>
  </svg>
);

// 云朵动画组件
const CloudAnimation = () => {
  const [waterLevel, setWaterLevel] = useState(70);
  const [isRaining, setIsRaining] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIsRaining(prev => !prev);
      if (isRaining) {
        setWaterLevel(prev => Math.max(30, prev - 15));
      } else {
        setWaterLevel(prev => Math.min(85, prev + 10));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isRaining]);
  
  return (
    <div className="relative w-40 h-32 mx-auto mb-6">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes rain-drop {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        .cloud-float { animation: float 3s ease-in-out infinite; }
        .rain-drop { animation: rain-drop 1s ease-in infinite; }
      `}</style>
      
      <svg 
        viewBox="0 0 120 100" 
        className="w-full h-full cloud-float"
      >
        <defs>
          <clipPath id="cloudClip">
            <path d="M60 20 C75 20 88 30 92 45 C108 48 115 62 110 78 C105 90 90 95 75 95 H45 C25 95 10 82 12 65 C14 50 28 42 42 45 C45 30 52 20 60 20 Z" />
          </clipPath>
          <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#0891B2" />
          </linearGradient>
        </defs>
        
        <path 
          d="M60 20 C75 20 88 30 92 45 C108 48 115 62 110 78 C105 90 90 95 75 95 H45 C25 95 10 82 12 65 C14 50 28 42 42 45 C45 30 52 20 60 20 Z" 
          fill="#E5E7EB"
        />
        
        <g clipPath="url(#cloudClip)">
          <rect 
            x="0" 
            y={100 - waterLevel} 
            width="120" 
            height={waterLevel + 10}
            fill="url(#waterGrad)"
            style={{ transition: 'y 0.8s ease-out, height 0.8s ease-out' }}
          />
        </g>
        
        {isRaining && (
          <>
            <circle cx="45" cy="98" r="2" fill="#22D3EE" className="rain-drop" style={{ animationDelay: '0s' }} />
            <circle cx="60" cy="98" r="2.5" fill="#22D3EE" className="rain-drop" style={{ animationDelay: '0.3s' }} />
            <circle cx="75" cy="98" r="2" fill="#22D3EE" className="rain-drop" style={{ animationDelay: '0.6s' }} />
          </>
        )}
      </svg>
      
      <div className="absolute -bottom-2 left-0 right-0 text-center">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isRaining ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500'}`}>
          {isRaining ? '消费中...' : '积蓄中'}
        </span>
      </div>
    </div>
  );
};

// 为什么用云做预算弹窗
const WhyCloudModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-3xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slide-up 0.3s ease-out' }}
      >
        <style>{`
          @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
          }
        `}</style>
        
        <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        
        <div className="px-6 pb-8">
          <CloudAnimation />
          
          <h2 className="text-2xl font-extrabold text-gray-800 text-center mb-2">
            把省下的钱，装进云里
          </h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            CloudPool 就像一朵云，不断承载着你一周的预算
          </p>
          
          <div className="bg-gray-100 rounded-[20px] p-5 mb-4">
            <h3 className="text-gray-700 font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">☁️</span> 为什么选"云"？
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-cyan-500 font-bold">💧</span>
                <div>
                  <span className="font-bold text-gray-700">云会下雨</span>
                  <p className="text-gray-500 mt-0.5">你把预算放入云里，它会按照你一周的消费需求降下来</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-cyan-500 font-bold">🌊</span>
                <div>
                  <span className="font-bold text-gray-700">云会积水</span>
                  <p className="text-gray-500 mt-0.5">剩余的预算会被重新积聚，等待下次消费</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-[20px] p-5 mb-6">
            <h3 className="text-gray-700 font-bold mb-3 flex items-center gap-2">
              <span className="text-lg">🎯</span> 云如何帮助你？
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">1</span>
                </div>
                <p><span className="font-bold text-gray-700">你控制云的水位</span> — 设置每周的消费限额</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 bg-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">2</span>
                </div>
                <p><span className="font-bold text-gray-700">云会帮你预测</span> — 根据实际支出，预测未来的预算流动</p>
              </div>
            </div>
          </div>
          
          <div className="text-center py-4 border-t border-gray-100">
            <p className="text-gray-500 text-sm leading-relaxed">
              这就是 <span className="font-bold text-cyan-500">CloudPool</span> 的意义：<br/>
              让你像管理云一样管理预算，<br/>
              让每一分钱都能"流动"，同时保持稳定。
            </p>
          </div>
          
          <DuoButton fullWidth onClick={onClose}>
            我明白了
          </DuoButton>
        </div>
      </div>
    </div>
  );
};

// 分享弹窗组件
const ShareModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = 'https://cloudpool.app';
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CloudPool - 周预算工具',
          text: '一个帮你养成储蓄习惯的预算工具，把省下的钱变成心愿池的水滴 💧',
          url: shareUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="分享给朋友">
      <p className="text-gray-500 text-sm mb-5 text-center">
        邀请朋友一起使用，一起养成储蓄好习惯 ✨
      </p>
      
      <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl mb-5">
        <span className="flex-1 text-gray-600 text-sm truncate font-medium">{shareUrl}</span>
        <button
          onClick={handleCopy}
          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
            copied 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-gray-600 active:scale-95 shadow-sm'
          }`}
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      
      <DuoButton fullWidth onClick={handleShare}>
        分享
      </DuoButton>
    </Modal>
  );
};

// 反馈弹窗组件
const FeedbackModal = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState('');
  
  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(type);
      setTimeout(() => setCopied(''), 2000);
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="联系我们">
      <p className="text-gray-500 text-sm mb-5 text-center">
        有任何问题或建议，欢迎随时联系 💬
      </p>
      
      <div className="bg-gray-100 rounded-[20px] p-4 mb-3">
        <div className="flex items-center gap-3">
          <Mail size={20} className="text-cyan-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs mb-0.5">邮箱</p>
            <p className="text-gray-700 font-bold text-sm truncate">feedback@cloudpool.app</p>
          </div>
          <button
            onClick={() => handleCopy('feedback@cloudpool.app', 'email')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
              copied === 'email'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 shadow-sm active:scale-95'
            }`}
          >
            {copied === 'email' ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-[20px] p-4 mb-5">
        <div className="flex items-center gap-3">
          <MessageCircle size={20} className="text-green-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-gray-400 text-xs mb-0.5">微信</p>
            <p className="text-gray-700 font-bold text-sm">CloudPool_Beta</p>
          </div>
          <button
            onClick={() => handleCopy('CloudPool_Beta', 'wechat')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex-shrink-0 ${
              copied === 'wechat'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600 shadow-sm active:scale-95'
            }`}
          >
            {copied === 'wechat' ? '已复制' : '复制'}
          </button>
        </div>
      </div>
      
      <DuoButton fullWidth variant="secondary" onClick={onClose}>
        关闭
      </DuoButton>
    </Modal>
  );
};

const BrandMenuView = ({ 
  onBack, 
  onLogout,
  onSwitchToLogin,
  currentUser 
}) => {
  const [showWhyCloudModal, setShowWhyCloudModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  const isAnonymous = isAnonymousUser();
  
  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };
  
  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };
  
  return (
    <PageContainer>
      {/* 导航栏 */}
      <TransparentNavBar onBack={onBack} />
      
      {/* 主内容区 */}
      <div className="px-[30px] px-5 pt-20 pb-8">
        {/* 顶部问候 */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-cyan-500 mb-2">
            {getGreeting()}，{isAnonymous ? '朋友' : (currentUser?.username || '用户')}
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            CloudPool是一个周预算工具，掌控这朵云，就是掌控这一周的生活。
          </p>
        </div>
        
        {/* 功能菜单 */}
        <ListGroup className="mb-6">
          <ListItem
            icon={HelpCircleFilled}
            iconColor="text-pink-500"
            title="为什么用云做预算"
            onClick={() => setShowWhyCloudModal(true)}
          />
          
          <ListItem
            icon={ShareFilled}
            iconColor="text-green-500"
            title="分享给朋友"
            onClick={() => setShowShareModal(true)}
          />
          
          <ListItem
            icon={MessageFilled}
            iconColor="text-cyan-500"
            title="反馈与建议"
            onClick={() => setShowFeedbackModal(true)}
          />
        </ListGroup>
        
        {/* 分割线 */}
        <div className="flex justify-center my-6">
          <div className="w-24 h-px bg-gray-200" />
        </div>
        
        {/* 账户卡片 */}
        <Card className="!p-0 overflow-hidden ">
          {/* 账户信息 */}
          <div className="px-3 py-4 flex items-center gap-3 border-b border-gray-200">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden">
              <DefaultAvatar/>
            </div>
            <div className="flex-1">
              <p className="text-gray-700 font-bold">
                {isAnonymous ? '游客模式' : (currentUser?.username || '用户')}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {isAnonymous ? '数据仅保存在此设备' : '数据已同步到云端'}
              </p>
            </div>
          </div>
          
          {/* 游客模式下显示登录按钮 */}
          {isAnonymous && onSwitchToLogin && (
            <button
              onClick={onSwitchToLogin}
              className="w-full px-7 py-3.5 flex items-center gap-6 border-b border-gray-200 active:bg-gray-50 transition-colors"
            >
              <LoginFilled size={20} className="text-cyan-500" />
              <span className="flex-1 text-left text-cyan-500 font-bold">登录账号</span>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
          )}
          
          {/* 退出登录 */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full px-7 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors"
          >
            <LogOutFilled size={20} className="text-red-400" />
            <span className="flex-1 text-left text-red-400 font-bold">
              退出登录
            </span>
          </button>
        </Card>
      </div>
      
      {/* 弹窗 */}
      <WhyCloudModal 
        isOpen={showWhyCloudModal} 
        onClose={() => setShowWhyCloudModal(false)} 
      />
      <ShareModal 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title={isAnonymous ? '退出游客模式' : '退出登录'}
        message={isAnonymous 
          ? '退出后本地数据将被清除，确定要退出吗？'
          : '退出后将回到登录页，当前账号数据仍会保留在云端。'
        }
        confirmText="退出"
        cancelText="取消"
        confirmVariant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </PageContainer>
  );
};

export default BrandMenuView;