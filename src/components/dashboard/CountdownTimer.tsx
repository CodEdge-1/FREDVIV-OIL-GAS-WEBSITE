import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  seconds: number;
  onExpire: () => void;
}

export function CountdownTimer({ seconds, onExpire }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  const percentage = (timeLeft / seconds) * 100;

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <Clock className="w-5 h-5 text-yellow-500" />
        <div className="flex-1">
          <p className="text-sm text-gray-300">Balance visible for:</p>
          <p className="text-2xl font-bold text-yellow-500">{timeLeft}s</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-yellow-500 transition-all duration-1000 ease-linear"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
