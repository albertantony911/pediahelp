import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'specialtyCards',
  title: 'Specialty Cards',
  type: 'document',
  fields: [
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'card',
          fields: [
            defineField({
              name: 'name',
              type: 'string',
              title: 'Name',
            }),
            defineField({
              name: 'image',
              type: 'image',
              title: 'Image',
              options: { hotspot: true },
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alt text',
                }),
              ],
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'object',
              fields: [
                defineField({
                  name: 'hasLink',
                  type: 'boolean',
                  title: 'Has Link',
                  initialValue: false,
                }),
                defineField({
                  name: 'linkType',
                  title: 'Link Type',
                  type: 'string',
                  options: {
                    list: [
                      { title: 'Internal', value: 'internal' },
                      { title: 'External', value: 'external' },
                    ],
                    layout: 'radio',
                    direction: 'horizontal',
                  },
                  hidden: ({ parent }) => !parent?.hasLink,
                }),
                defineField({
                  name: 'internalLink',
                  title: 'Internal Link',
                  type: 'reference',
                  to: [{ type: 'page' }, { type: 'specialities' }],
                  hidden: ({ parent }) => !parent?.hasLink || parent?.linkType !== 'internal',
                }),
                defineField({
                  name: 'externalUrl',
                  title: 'External URL',
                  type: 'url',
                  hidden: ({ parent }) => !parent?.hasLink || parent?.linkType !== 'external',
                }),
              ],
            }),
          ],
        },
      ],
    }),
  ],
});