'use client';

import clsx from 'clsx';
import { Category } from '@/types';

interface Props {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
  onReset: () => void;
}

export default function BlogCategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  onReset,
}: Props) {
  return (
    <div className="flex gap-2 flex-wrap mb-6 justify-center">
      <button
        className={clsx(
          'px-4 py-2 rounded-full border text-sm font-medium',
          selectedCategory === null
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
        onClick={onReset}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          className={clsx(
            'px-4 py-2 rounded-full border text-sm font-medium',
            selectedCategory === cat._id
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          )}
          onClick={() => onSelect(cat._id)}
        >
          {cat.title}
        </button>
      ))}
    </div>
  );
}