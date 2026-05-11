'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { assignUseCaseTags, type UseCaseTagId } from '@/lib/use-case-tags';
import {
  rankYachts,
  type FinderAnswers,
  type ExperienceLevel,
  type IntendedUse,
  type CrewSize,
  type BudgetTier,
  type Priority,
  type ScoredYacht,
  type YachtForScoring,
} from '@/lib/yacht-finder';
import { UseCaseBadgeGroup } from '@/components/use-case-badge';
import { PriceTierBadge } from '@/app/components/PriceTierBadge';
import { calculatePriceTier } from '@/lib/price-tier';
import { FavoriteButton } from '@/app/components/FavoriteButton';
import NewsletterSignup from '@/components/NewsletterSignup';

// ─── Step option component ───────────────────────────────────────────

function StepOption<T extends string>({
  value,
  selected,
  onSelect,
  label,
  description,
  icon,
}: {
  value: T;
  selected: boolean;
  onSelect: (v: T) => void;
  label: string;
  description?: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex items-start gap-3 w-full p-4 rounded-xl border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
      aria-pressed={selected}
    >
      {icon && <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">{icon}</span>}
      <div>
        <span className="font-medium text-gray-900">{label}</span>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
    </button>
  );
}

// ─── Multi-select option ─────────────────────────────────────────────

function MultiSelectOption<T extends string>({
  value,
  selected,
  onToggle,
  label,
  icon,
}: {
  value: T;
  selected: boolean;
  onToggle: (v: T) => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(value)}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
      }`}
      aria-pressed={selected}
    >
      {icon && <span className="text-2xl" aria-hidden="true">{icon}</span>}
      <span className="text-sm font-medium text-gray-900">{label}</span>
    </button>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current) / total) * 100;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
      <div className="bg-blue-500 rounded-full h-2 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Match score badge ───────────────────────────────────────────────

function MatchBadge({ score }: { score: number }) {
  let color = 'bg-gray-100 text-gray-600';
  if (score >= 80) color = 'bg-green-100 text-green-800';
  else if (score >= 60) color = 'bg-blue-100 text-blue-800';
  else if (score >= 40) color = 'bg-amber-100 text-amber-800';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-semibold ${color}`}>
      {score}% match
    </span>
  );
}

// ─── Score breakdown bar ─────────────────────────────────────────────

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 text-gray-500 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-blue-400 rounded-full h-1.5 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-400 w-6 text-right">{value}</span>
    </div>
  );
}

// ─── Result card ─────────────────────────────────────────────────────

function ResultCard({ yacht }: { yacht: ScoredYacht }) {
  const format = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');
  const pt = useTranslations('Yachts');

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-lg leading-tight">
          {yacht.slug ? (
            <a href={`/yachts/${yacht.slug}`} className="hover:text-blue-600 transition-colors">
              {yacht.manufacturer} {yacht.modelName}
            </a>
          ) : (
            <>{yacht.manufacturer} {yacht.modelName}</>
          )}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <MatchBadge score={yacht.score} />
          {yacht.slug && <FavoriteButton slug={yacht.slug} modelName={`${yacht.manufacturer} ${yacht.modelName}`} size="sm" />}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <p className="text-sm text-gray-600">{yacht.year ?? '—'}</p>
        <PriceTierBadge info={calculatePriceTier({
          lengthOverall: yacht.lengthOverall,
          displacement: yacht.displacement,
          beam: yacht.beam,
          cabins: yacht.cabins,
          hullMaterial: yacht.hullMaterial,
          keelType: yacht.keelType,
          rigType: yacht.rigType,
        })} />
      </div>

      {/* Use case tags */}
      {yacht.useCaseTags.length > 0 && (
        <div className="mt-2">
          <UseCaseBadgeGroup tagIds={yacht.useCaseTags as UseCaseTagId[]} />
        </div>
      )}

      {/* Key specs */}
      <dl className="mt-3 text-sm grid grid-cols-2 gap-x-4 gap-y-0.5">
        <div className="flex justify-between"><dt className="text-gray-500">{pt('specs.length')}</dt><dd className="font-medium">{format(yacht.lengthOverall)} m</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">{pt('specs.cabins')}</dt><dd className="font-medium">{format(yacht.cabins)}</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">{pt('specs.displacement')}</dt><dd className="font-medium">{format(yacht.displacement)} kg</dd></div>
        <div className="flex justify-between"><dt className="text-gray-500">{pt('specs.berths')}</dt><dd className="font-medium">{format(yacht.berths)}</dd></div>
      </dl>

      {/* Score breakdown */}
      <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
        <ScoreBar label={pt('finder.breakdown.useMatch')} value={yacht.scoreBreakdown.useMatch} max={30} />
        <ScoreBar label={pt('finder.breakdown.sizeFit')} value={yacht.scoreBreakdown.sizeFit} max={25} />
        <ScoreBar label={pt('finder.breakdown.experience')} value={yacht.scoreBreakdown.experienceFit} max={20} />
        <ScoreBar label={pt('finder.breakdown.priorities')} value={yacht.scoreBreakdown.priorityMatch} max={25} />
      </div>
    </div>
  );
}

// ─── Main wizard component ───────────────────────────────────────────

export default function FinderPage() {
  const t = useTranslations('Yachts');

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<ScoredYacht[]>([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<FinderAnswers>({
    experience: 'intermediate',
    intendedUse: 'coastal',
    crewSize: 'couple',
    budget: 'mid-range',
    priorities: [],
  });

  const updateAnswer = useCallback(<K extends keyof FinderAnswers>(key: K, value: FinderAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const togglePriority = useCallback((p: Priority) => {
    setAnswers(prev => ({
      ...prev,
      priorities: prev.priorities.includes(p)
        ? prev.priorities.filter(x => x !== p)
        : [...prev.priorities, p],
    }));
  }, []);

  const canProceed = step < 4 || (step === 4 && answers.priorities.length > 0);

  const handleNext = useCallback(async () => {
    if (step < 4) {
      setStep(s => s + 1);
      return;
    }

    // Last step — fetch all yachts and score
    setLoading(true);
    try {
      const res = await fetch('/api/yachts?limit=250', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch yachts');
      const data = await res.json();

      const yachts: YachtForScoring[] = (data.yachts || []).map((y: any) => ({
        ...y,
        lengthOverall: y.lengthOverall != null ? parseFloat(y.lengthOverall) : null,
        beam: y.beam != null ? parseFloat(y.beam) : null,
        draft: y.draft != null ? parseFloat(y.draft) : null,
        displacement: y.displacement != null ? parseFloat(y.displacement) : null,
        ballast: y.ballast != null ? parseFloat(y.ballast) : null,
        sailAreaMain: y.sailAreaMain != null ? parseFloat(y.sailAreaMain) : null,
        cabins: y.cabins != null ? Number(y.cabins) : null,
        berths: y.berths != null ? Number(y.berths) : null,
        useCaseTags: y.useCaseTags ?? assignUseCaseTags({
          lengthOverall: y.lengthOverall != null ? parseFloat(y.lengthOverall) : null,
          beam: y.beam != null ? parseFloat(y.beam) : null,
          draft: y.draft != null ? parseFloat(y.draft) : null,
          displacement: y.displacement != null ? parseFloat(y.displacement) : null,
          ballast: y.ballast != null ? parseFloat(y.ballast) : null,
          sailAreaMain: y.sailAreaMain != null ? parseFloat(y.sailAreaMain) : null,
          cabins: y.cabins != null ? Number(y.cabins) : null,
          berths: y.berths != null ? Number(y.berths) : null,
          rigType: y.rigType ?? null,
          keelType: y.keelType ?? null,
        }),
      }));

      const scored = rankYachts(yachts, answers);
      setResults(scored.slice(0, 30)); // top 30
      setStep(5); // results step
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [step, answers]);

  const handleBack = useCallback(() => {
    if (step > 0) setStep(s => s - 1);
  }, [step]);

  const handleRestart = useCallback(() => {
    setStep(0);
    setResults([]);
    setAnswers({
      experience: 'intermediate',
      intendedUse: 'coastal',
      crewSize: 'couple',
      budget: 'mid-range',
      priorities: [],
    });
  }, []);

  const totalSteps = 5;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t('finder.heading')}</h1>
        <p className="text-gray-600 text-lg mb-8">{t('finder.intro')}</p>

        {step < totalSteps && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>{t('finder.stepOf', { current: step + 1, total: totalSteps })}</span>
              <span>{Math.round(((step + 1) / totalSteps) * 100)}%</span>
            </div>
            <ProgressBar current={step + 1} total={totalSteps} />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 sm:p-8">
          {/* Step 1: Experience */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('finder.steps.experience')}</h2>
              <div className="space-y-3">
                <StepOption<ExperienceLevel>
                  value="beginner" selected={answers.experience === 'beginner'}
                  onSelect={v => updateAnswer('experience', v)}
                  icon="🌱"
                  label={t('finder.options.experience.beginner.label')}
                  description={t('finder.options.experience.beginner.description')}
                />
                <StepOption<ExperienceLevel>
                  value="intermediate" selected={answers.experience === 'intermediate'}
                  onSelect={v => updateAnswer('experience', v)}
                  icon="⛵"
                  label={t('finder.options.experience.intermediate.label')}
                  description={t('finder.options.experience.intermediate.description')}
                />
                <StepOption<ExperienceLevel>
                  value="advanced" selected={answers.experience === 'advanced'}
                  onSelect={v => updateAnswer('experience', v)}
                  icon="🌊"
                  label={t('finder.options.experience.advanced.label')}
                  description={t('finder.options.experience.advanced.description')}
                />
              </div>
            </div>
          )}

          {/* Step 2: Intended Use */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('finder.steps.intendedUse')}</h2>
              <div className="space-y-3">
                <StepOption<IntendedUse>
                  value="coastal" selected={answers.intendedUse === 'coastal'}
                  onSelect={v => updateAnswer('intendedUse', v)}
                  icon="🏖️"
                  label={t('finder.options.intendedUse.coastal.label')}
                  description={t('finder.options.intendedUse.coastal.description')}
                />
                <StepOption<IntendedUse>
                  value="bluewater" selected={answers.intendedUse === 'bluewater'}
                  onSelect={v => updateAnswer('intendedUse', v)}
                  icon="🌊"
                  label={t('finder.options.intendedUse.bluewater.label')}
                  description={t('finder.options.intendedUse.bluewater.description')}
                />
                <StepOption<IntendedUse>
                  value="racing" selected={answers.intendedUse === 'racing'}
                  onSelect={v => updateAnswer('intendedUse', v)}
                  icon="🏆"
                  label={t('finder.options.intendedUse.racing.label')}
                  description={t('finder.options.intendedUse.racing.description')}
                />
                <StepOption<IntendedUse>
                  value="weekending" selected={answers.intendedUse === 'weekending'}
                  onSelect={v => updateAnswer('intendedUse', v)}
                  icon="🌅"
                  label={t('finder.options.intendedUse.weekending.label')}
                  description={t('finder.options.intendedUse.weekending.description')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Crew Size */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('finder.steps.crewSize')}</h2>
              <div className="space-y-3">
                <StepOption<CrewSize>
                  value="solo" selected={answers.crewSize === 'solo'}
                  onSelect={v => updateAnswer('crewSize', v)}
                  icon="🧑"
                  label={t('finder.options.crewSize.solo.label')}
                  description={t('finder.options.crewSize.solo.description')}
                />
                <StepOption<CrewSize>
                  value="couple" selected={answers.crewSize === 'couple'}
                  onSelect={v => updateAnswer('crewSize', v)}
                  icon="👫"
                  label={t('finder.options.crewSize.couple.label')}
                  description={t('finder.options.crewSize.couple.description')}
                />
                <StepOption<CrewSize>
                  value="small-group" selected={answers.crewSize === 'small-group'}
                  onSelect={v => updateAnswer('crewSize', v)}
                  icon="👨‍👩‍👧"
                  label={t('finder.options.crewSize.smallGroup.label')}
                  description={t('finder.options.crewSize.smallGroup.description')}
                />
                <StepOption<CrewSize>
                  value="large-group" selected={answers.crewSize === 'large-group'}
                  onSelect={v => updateAnswer('crewSize', v)}
                  icon="👨‍👩‍👧‍👦"
                  label={t('finder.options.crewSize.largeGroup.label')}
                  description={t('finder.options.crewSize.largeGroup.description')}
                />
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">{t('finder.steps.budget')}</h2>
              <div className="space-y-3">
                <StepOption<BudgetTier>
                  value="budget" selected={answers.budget === 'budget'}
                  onSelect={v => updateAnswer('budget', v)}
                  icon="💵"
                  label={t('finder.options.budget.budget.label')}
                  description={t('finder.options.budget.budget.description')}
                />
                <StepOption<BudgetTier>
                  value="mid-range" selected={answers.budget === 'mid-range'}
                  onSelect={v => updateAnswer('budget', v)}
                  icon="💰"
                  label={t('finder.options.budget.midRange.label')}
                  description={t('finder.options.budget.midRange.description')}
                />
                <StepOption<BudgetTier>
                  value="premium" selected={answers.budget === 'premium'}
                  onSelect={v => updateAnswer('budget', v)}
                  icon="💎"
                  label={t('finder.options.budget.premium.label')}
                  description={t('finder.options.budget.premium.description')}
                />
                <StepOption<BudgetTier>
                  value="no-limit" selected={answers.budget === 'no-limit'}
                  onSelect={v => updateAnswer('budget', v)}
                  icon="🚀"
                  label={t('finder.options.budget.noLimit.label')}
                  description={t('finder.options.budget.noLimit.description')}
                />
              </div>
            </div>
          )}

          {/* Step 5: Priorities (multi-select) */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">{t('finder.steps.priorities')}</h2>
              <p className="text-sm text-gray-500 mb-4">{t('finder.prioritiesHint')}</p>
              <div className="grid grid-cols-2 gap-3">
                <MultiSelectOption<Priority>
                  value="speed" selected={answers.priorities.includes('speed')}
                  onToggle={togglePriority}
                  icon="⚡"
                  label={t('finder.options.priorities.speed')}
                />
                <MultiSelectOption<Priority>
                  value="comfort" selected={answers.priorities.includes('comfort')}
                  onToggle={togglePriority}
                  icon="🛋️"
                  label={t('finder.options.priorities.comfort')}
                />
                <MultiSelectOption<Priority>
                  value="safety" selected={answers.priorities.includes('safety')}
                  onToggle={togglePriority}
                  icon="🛡️"
                  label={t('finder.options.priorities.safety')}
                />
                <MultiSelectOption<Priority>
                  value="value" selected={answers.priorities.includes('value')}
                  onToggle={togglePriority}
                  icon="🏷️"
                  label={t('finder.options.priorities.value')}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {step === 5 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">{t('finder.results.heading')}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('finder.results.count', { count: results.length })}
                  </p>
                </div>
                <button
                  onClick={handleRestart}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  {t('finder.results.startOver')}
                </button>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">{t('finder.results.noResults')}</p>
                  <button
                    onClick={handleRestart}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {t('finder.results.tryAgain')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {results.map(yacht => (
                    <ResultCard key={yacht.id} yacht={yacht} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          {step < totalSteps && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← {t('finder.nav.back')}
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed || loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {step === 4
                  ? (loading ? t('finder.nav.loading') : t('finder.nav.seeResults'))
                  : t('finder.nav.next')
                } →
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <NewsletterSignup source="yacht-finder" compact />
        </div>
      </div>
    </div>
  );
}
