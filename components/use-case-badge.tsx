'use client';

import { USE_CASE_TAG_META, type UseCaseTagId } from '@/lib/use-case-tags';
import { useTranslations } from 'next-intl';

interface UseCaseBadgeProps {
  tagId: UseCaseTagId;
  size?: 'sm' | 'md';
}

export function UseCaseBadge({ tagId, size = 'sm' }: UseCaseBadgeProps) {
  const t = useTranslations('Yachts.useCaseTags');
  const meta = USE_CASE_TAG_META[tagId];
  if (!meta) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${meta.color} ${meta.textColor} ${meta.borderColor} ${sizeClasses}`}
      title={t(`${tagId}.description`)}
    >
      {t(`${tagId}.label`)}
    </span>
  );
}

interface UseCaseBadgeGroupProps {
  tagIds: UseCaseTagId[];
  size?: 'sm' | 'md';
  max?: number;
}

export function UseCaseBadgeGroup({ tagIds, size = 'sm', max = 3 }: UseCaseBadgeGroupProps) {
  if (!tagIds || tagIds.length === 0) return null;

  const visible = tagIds.slice(0, max);
  const remaining = tagIds.length - max;

  return (
    <div className="flex flex-wrap gap-1" role="list" aria-label="Use case tags">
      {visible.map(id => (
        <span key={id} role="listitem">
          <UseCaseBadge tagId={id} size={size} />
        </span>
      ))}
      {remaining > 0 && (
        <span className={`inline-flex items-center rounded-full border font-medium bg-gray-100 text-gray-600 border-gray-200 ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-1'}`}>
          +{remaining}
        </span>
      )}
    </div>
  );
}
