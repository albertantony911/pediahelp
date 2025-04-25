// lib/clearAlgoliaIndex.ts
import algoliasearch from 'algoliasearch';
import { config } from 'dotenv';

config({ path: '/Users/albert/Desktop/github_repos/pediahelp/.env.local' });

const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;

console.log('Environment variables:', { appId, apiKey });

if (!appId || !apiKey) {
  throw new Error('Missing Algolia credentials. Check NEXT_PUBLIC_ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY in .env.local');
}

const algoliaClient = algoliasearch(appId, apiKey);
const index = algoliaClient.initIndex('doctors_index');

async function clearAlgoliaIndex() {
  try {
    await index.clearObjects();
    console.log('Algolia index "doctors_index" cleared successfully');
  } catch (error) {
    console.error('Error clearing Algolia index:', error);
  }
}

clearAlgoliaIndex();