import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { presentationTool } from 'sanity/presentation';
import { codeInput } from '@sanity/code-input';

import { apiVersion, dataset, projectId } from './sanity/env';
import { schema } from './sanity/schema';
import { resolve } from '@/sanity/presentation/resolve';
import { structure } from './sanity/structure';
import { CancelBookingAction } from '@/components/sanity-actions/CancelBookingAction';

export default defineConfig({
  basePath: '/studio',
  title: 'Schema UI',
  projectId,
  dataset,
  schema,
  plugins: [
    deskTool({
      structure,
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
  // ✅ ✅ Put it here, outside plugins
  document: {
    actions: (prev: any, context: any) => {
      if (context.schemaType === 'booking') {
        return [...prev, CancelBookingAction];
      }
      return prev;
    },
  },
});