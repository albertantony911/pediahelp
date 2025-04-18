import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk'; // Later, replace this from sanity/structure when it's ready
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { codeInput } from '@sanity/code-input';

import { apiVersion, dataset, projectId } from './sanity/env';
import { schema } from './sanity/schema';
import { resolve } from '@/sanity/presentation/resolve';
import { structure } from './sanity/structure';

export default defineConfig({
  basePath: '/studio',
  title: 'Schema UI',
  projectId,
  dataset,
  schema,
  plugins: [
    deskTool({
      structure, // ✅ custom sidebar
    }),
    presentationTool({
      previewUrl: {
        draftMode: {
          enable: '/api/draft-mode/enable',
        },
      },
      resolve,
    }),
    visionTool({ defaultApiVersion: apiVersion }),
    codeInput(),
  ],
});