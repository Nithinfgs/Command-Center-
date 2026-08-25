import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Orbit,
  Pause,
  Play,
  RotateCcw,
  Rocket,
  Sparkles,
  Target,
  TimerReset,
  Wind,
  X
} from 'lucide-react';
import type { AppTab } from '../../types';

interface CompetitionTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: AppTab) => void;
}

interface TourStep {
  time: string;
  eyebrow: string;
  title: string;
  summary: string;
  equation: string;
  equationMeaning: string;
  points: string[];
  tab: AppTab;
  action: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accent: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    time: '0:00 - 0:30',
    eyebrow: 'The question',
    title: 'Can mathematics design a safer path to space?',
    summary: 'Mission Control turns invisible physical laws into a model students can build, test, compare, and explain.',
    equation: 'prediction -> simulation -> evidence',
    equationMeaning: 'Every screen follows the same modelling cycle: choose inputs, apply equations, observe outcomes, and improve the design.',
    points: [
      'Built for the Mathematics in Space Exploration theme',
      'Connects one vehicle across design, atmosphere, flight, and orbit',
      'Makes abstract equations visible through live measurements'
    ],
    tab: 'rocket-builder',
    action: 'Open the model',
    icon: Sparkles,
    accent: '#FF8A1F'
  },
  {
    time: '0:30 - 1:20',
    eyebrow: 'Build and predict',
    title: 'The rocket equation turns mass into mission capability.',
    summary: 'Each engine, tank, and stage changes mass, thrust, stability, burn time, and total velocity budget in real time.',
    equation: 'Delta-v = Isp x g0 x ln(m0 / mf)',
    equationMeaning: 'Specific impulse and the wet-to-dry mass ratio determine how much velocity the rocket can gain.',
    points: [
      'TWR = thrust / weight checks whether the rocket can lift off',
      'Center of mass and center of pressure expose flip risk',
      'Stage-by-stage Delta-v reveals where propellant is most useful'
    ],
    tab: 'rocket-builder',
    action: 'Inspect rocket maths',
    icon: Rocket,
    accent: '#FF8A1F'
  },
  {
    time: '1:20 - 2:10',
    eyebrow: 'Test and validate',
    title: 'A virtual wind tunnel finds the forces we cannot see.',
    summary: 'The same vehicle is tested from subsonic flow through hypersonic re-entry, with live drag, lift, pressure, heat, and shock geometry.',
    equation: 'q = 1/2 x rho x v^2',
    equationMeaning: 'Dynamic pressure rises with air density and the square of speed, explaining why maximum aerodynamic stress occurs during ascent.',
    points: [
      'Change Mach number, altitude, pitch, and wind direction',
      'Compare streamlines, pressure, heat, and shockwave views',
      'Export the numerical evidence as CSV, JSON, or a report'
    ],
    tab: 'wind-tunnel',
    action: 'Run the wind tunnel',
    icon: Wind,
    accent: '#38BDF8'
  },
  {
    time: '2:10 - 2:45',
    eyebrow: 'Explore and compare',
    title: 'One mathematical language explains many space missions.',
    summary: 'The suite extends the model from launch to orbital motion, satellite networks, planetary surfaces, and asteroid defense.',
    equation: 'F = G x m1 x m2 / r^2',
    equationMeaning: 'Newtonian gravitation links the orbital simulator, Lagrange points, rendezvous, and long-term deflection predictions.',
    points: [
      'N-body gravity and orbital manoeuvres',
      'Walker satellite constellations and communications coverage',
      'Impact energy: E = 1/2 mv^2, crater effects, and deflection'
    ],
    tab: 'celestial-sim',
    action: 'Explore orbital maths',
    icon: Orbit,
    accent: '#A78BFA'
  },
  {
    time: '2:45 - 3:00',
    eyebrow: 'Conclusion',
    title: 'The model is creative, interactive, and testable.',
    summary: 'Instead of showing a single answer, Mission Control lets a judge change assumptions and immediately see how the mathematics changes the mission.',
    equation: 'small Delta-v x warning time = large miss distance',
    equationMeaning: 'Planetary defense is the clearest final example: a tiny early intervention can prevent a future collision.',
    points: [
      'Creativity: a connected command-center experience',
      'Innovation: real-time, multi-domain mathematical modelling',
      'Relevance: every interaction answers a space-exploration question'
    ],
    tab: 'asteroid-impact',
    action: 'Show planetary defense',
    icon: Target,
    accent: '#F97316'
  }
];

const formatClock = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

export const CompetitionTourModal: React.FC<CompetitionTourModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(180);
  const [isRunning, setIsRunning] = useState(false);
  const step = TOUR_STEPS[stepIndex];
  const StepIcon = step.icon;
  const progress = useMemo(() => ((180 - secondsLeft) / 180) * 100, [secondsLeft]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft(current => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, secondsLeft]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetTimer = () => {
    setSecondsLeft(180);
    setIsRunning(false);
    setStepIndex(0);
  };

  const navigateToStep = () => {
    onNavigate(step.tab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#05070B]/92 p-3 backdrop-blur-md sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="competition-tour-title"
      onClick={onClose}
    >
      <section
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#353D4A] bg-[#10131A] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
        onClick={event => event.stopPropagation()}
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#252B36] bg-[#0B0E13] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FF8A1F]/35 bg-[#FF8A1F]/10">
              <Calculator className="h-5 w-5 text-[#FF8A1F]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#FF8A1F]/30 bg-[#FF8A1F]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-[#FFB36D]">
                  Mathlet '26
                </span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-[#69717E]">Judge presentation</span>
              </div>
              <h2 id="competition-tour-title" className="mt-1 text-sm font-bold tracking-wide text-[#F2F4F7] sm:text-base">
                Mathematics in Space Exploration - 3-Minute Tour
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono-num ${secondsLeft === 0 ? 'border-[#D95757]/50 bg-[#D95757]/10 text-[#FF8A8A]' : 'border-[#353D4A] bg-[#151820] text-[#E6E8EB]'}`}>
              <TimerReset className="h-4 w-4 text-[#FF8A1F]" />
              <span className="text-sm font-bold tabular-nums">{formatClock(secondsLeft)}</span>
              <button
                type="button"
                onClick={() => setIsRunning(current => !current)}
                className="rounded p-1 text-[#A4ABB6] hover:bg-[#252B36] hover:text-white"
                aria-label={isRunning ? 'Pause presentation timer' : 'Start presentation timer'}
              >
                {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={resetTimer}
                className="rounded p-1 text-[#69717E] hover:bg-[#252B36] hover:text-white"
                aria-label="Reset presentation timer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-[#69717E] hover:bg-[#1B1F28] hover:text-[#E6E8EB]"
              aria-label="Close 3-minute tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="h-1 bg-[#161B23]" aria-hidden="true">
          <div className="h-full bg-[#FF8A1F] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[220px_1fr]">
          <nav className="hidden border-r border-[#252B36] bg-[#0D1016] p-3 lg:block" aria-label="Presentation sections">
            {TOUR_STEPS.map((tourStep, index) => {
              const Icon = tourStep.icon;
              const active = index === stepIndex;
              return (
                <button
                  key={tourStep.time}
                  type="button"
                  onClick={() => setStepIndex(index)}
                  aria-current={active ? 'step' : undefined}
                  className={`mb-1.5 flex w-full items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-colors ${active ? 'border-[#FF8A1F]/40 bg-[#FF8A1F]/10 text-white' : 'border-transparent text-[#7F8794] hover:border-[#252B36] hover:bg-[#151820] hover:text-[#D7DBE1]'}`}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: active ? tourStep.accent : undefined }} />
                  <span className="min-w-0">
                    <span className="block font-mono-num text-[9px] uppercase tracking-wider text-[#69717E]">{tourStep.time}</span>
                    <span className="block truncate text-[11px] font-semibold">{tourStep.eyebrow}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="min-h-0 overflow-y-auto p-5 sm:p-7 lg:p-9">
            <div className="mx-auto max-w-3xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <StepIcon className="h-6 w-6" style={{ color: step.accent }} />
                  </div>
                  <div>
                    <span className="font-mono-num text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: step.accent }}>
                      {step.eyebrow}
                    </span>
                    <span className="ml-2 text-[10px] text-[#69717E]">{step.time}</span>
                  </div>
                </div>
                <span className="text-[10px] text-[#69717E]">Step {stepIndex + 1} of {TOUR_STEPS.length}</span>
              </div>

              <h3 className="max-w-2xl text-2xl font-bold leading-tight tracking-tight text-[#F4F6F8] sm:text-3xl">
                {step.title}
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#AEB5C0] sm:text-[15px]">
                {step.summary}
              </p>

              <div className="my-6 rounded-xl border border-[#38BDF8]/20 bg-[#08131B] p-4 sm:p-5">
                <div className="mb-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#5FBDE8]">
                  <Calculator className="h-3.5 w-3.5" />
                  Mathematical model
                </div>
                <div className="overflow-x-auto font-mono-num text-lg font-bold tracking-tight text-[#E6F5FC] sm:text-2xl">
                  {step.equation}
                </div>
                <p className="mt-2 text-xs leading-5 text-[#8196A3]">{step.equationMeaning}</p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-3">
                {step.points.map((point, index) => (
                  <div key={point} className="rounded-xl border border-[#252B36] bg-[#151820] p-3.5">
                    <span className="mb-2 block font-mono-num text-[10px] font-bold text-[#FF8A1F]">0{index + 1}</span>
                    <p className="text-xs leading-5 text-[#C5CBD4]">{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#252B36] pt-5">
                <button
                  type="button"
                  onClick={navigateToStep}
                  className="flex items-center gap-2 rounded-lg bg-[#FF8A1F] px-4 py-2.5 text-xs font-bold text-[#090A0D] shadow-lg shadow-orange-950/30 transition-colors hover:bg-[#FFA24A]"
                >
                  {step.action}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStepIndex(index => Math.max(0, index - 1))}
                    disabled={stepIndex === 0}
                    className="flex items-center gap-1 rounded-lg border border-[#353D4A] bg-[#151820] px-3 py-2 text-xs font-semibold text-[#A4ABB6] hover:bg-[#1B1F28] hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setStepIndex(index => Math.min(TOUR_STEPS.length - 1, index + 1))}
                    disabled={stepIndex === TOUR_STEPS.length - 1}
                    className="flex items-center gap-1 rounded-lg border border-[#353D4A] bg-[#151820] px-3 py-2 text-xs font-semibold text-[#E6E8EB] hover:border-[#FF8A1F]/50 hover:bg-[#1B1F28] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
