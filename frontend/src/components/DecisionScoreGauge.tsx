import React from 'react';

interface DecisionScoreGaugeProps {
  score: number;
  status: string;
  size?: number;
}

export const DecisionScoreGauge: React.FC<DecisionScoreGaugeProps> = ({
  score,
  status,
  size = 180
}) => {
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Display only 75% of the circle (arc opening at the bottom)
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (score / 100) * arcLength;

  // Determine color based on score
  let strokeColor = '#10b981'; // Emerald
  let glowColor = 'rgba(16, 185, 129, 0.4)';
  let bgLabel = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';

  if (score < 40) {
    strokeColor = '#ef4444'; // Red
    glowColor = 'rgba(239, 68, 68, 0.4)';
    bgLabel = 'bg-red-500/10 text-red-600 dark:text-red-400';
  } else if (score < 75) {
    strokeColor = '#f59e0b'; // Amber
    glowColor = 'rgba(245, 158, 11, 0.4)';
    bgLabel = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size * 0.85 }}>
        <svg
          className="transform -rotate-225"
          width={size}
          height={size}
          viewBox="0 0 120 120"
        >
          {/* Defs for glowing shadow */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={strokeColor} floodOpacity="0.4" />
            </filter>
          </defs>
          
          {/* Background Track */}
          <circle
            className="stroke-zinc-200 dark:stroke-zinc-800"
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />
          
          {/* Active Progress Track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease',
            }}
          />
        </svg>
        
        {/* Core Value Text (centered inside gauge) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center top-[-10px]">
          <span className="text-4xl font-extrabold tracking-tight font-sans text-zinc-900 dark:text-white">
            {score}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500 mt-0.5">
            DECISION SCORE
          </span>
        </div>
      </div>
      
      {/* Label and Status */}
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${bgLabel} text-center`}>
        {status}
      </div>
    </div>
  );
};

export default DecisionScoreGauge;
