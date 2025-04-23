'use client';

import clsx from 'clsx';
import { useSearchBox } from 'react-instantsearch';
import { useState } from 'react';

const categories = [
  'All',
  'Nephrology',
  'Gastroenterology',
  'Parenting Tips',
  'Neonatology',
  'Neurology',
  'Lactation',
  'Sleep',
  'Respiratory Medicine',
];

export default function BlogCategoryFilter() {
  const { refine } = useSearchBox();
  const [selected, setSelected] = useState<string | null>('All');

  const handleSelect = (category: string) => {
    setSelected(category);
    if (category === 'All') {
      refine('');
    } else {
      refine(category);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap my-6 justify-center px-4">
      {categories.map((cat) => (
        <button
          key={cat}
          className={clsx(
            'px-4 py-2 rounded-full border text-sm font-medium transition',
            selected === cat
              ? 'bg-light-shade text-white border-light-shade'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-300'
          )}
          onClick={() => handleSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}