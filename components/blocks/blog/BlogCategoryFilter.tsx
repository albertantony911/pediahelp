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
    refine(category === 'All' ? '' : category);
  };

  return (
    <div className="flex gap-1.5 flex-wrap my-4 justify-center px-4">
      {categories.map((cat) => (
        <button
          key={cat}
          className={clsx(
            'px-3 py-1.5 rounded-full border text-xs font-normal transition-colors duration-200',
            selected === cat
              ? 'bg-light-shade text-white border-light-shade hover:bg-light-shade/80 active:bg-light-shade'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          )}
          onClick={() => handleSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}