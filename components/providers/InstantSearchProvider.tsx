// components/providers/InstantSearchProvider.tsx
'use client'

import { InstantSearch } from 'react-instantsearch'
import algoliasearch from 'algoliasearch/lite'

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
)

export function InstantSearchProvider({ children }: { children: React.ReactNode }) {
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={process.env.NEXT_PUBLIC_ALGOLIA_DOCTORS_INDEX!}
    >
      {children}
    </InstantSearch>
  )
}