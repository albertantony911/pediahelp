import { defineType, defineField } from 'sanity';

const specialtyCard = defineType({
  name: 'specialty-card',
  type: 'object',
  title: 'Specialty Card Block',
  fields: [
    defineField({
      name: 'theme',
      title: 'Theme Variant',
      type: 'string',
      options: {
        list: [
          { title: 'Dark Shade', value: 'dark-shade' },
          { title: 'Mid Shade', value: 'mid-shade' },
          { title: 'Light Shade', value: 'light-shade' },
          { title: 'White', value: 'white' },
        ],
      },
    }),
    defineField({
      name: 'tagLine',
      title: 'Tagline',
      type: 'string',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Blockquote', value: 'blockquote' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Strong', value: 'strong' },
              { title: 'Emphasis', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'cards',
      title: 'Specialty Cards',
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
              options: {
                hotspot: true,
              },
              fields: [
                {
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative Text',
                },
              ],
            }),
            defineField({
              name: 'link',
              title: 'Link',
              type: 'object',
              fields: [
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
                  initialValue: 'internal',
                }),
                defineField({
                  name: 'internalLink',
                  title: 'Internal Link',
                  type: 'reference',
                  to: [{ type: 'page' }, { type: 'specialities' }], // Changed to 'specialities'
                  description: 'Select an internal page or speciality for the link.',
                  hidden: ({ parent }) => parent?.linkType !== 'internal',
                  validation: (Rule) =>
                    Rule.custom((value, context) => {
                      const parent = context.parent as { linkType?: string } | undefined;
                      if (parent?.linkType === 'internal' && !value) {
                        return 'Internal link is required for internal link type.';
                      }
                      return true;
                    }),
                }),
                defineField({
                  name: 'externalUrl',
                  title: 'External URL',
                  type: 'url',
                  description: 'Provide an external URL (e.g., https://example.com) or a relative path (e.g., /specialities/nephrology).',
                  hidden: ({ parent }) => parent?.linkType !== 'external',
                  validation: (Rule) =>
                    Rule.uri({
                      scheme: ['http', 'https', '/'],
                      allowRelative: true,
                    }).custom((value, context) => {
                      const parent = context.parent as { linkType?: string } | undefined;
                      if (parent?.linkType === 'external' && !value) {
                        return 'External URL is required for external link type.';
                      }
                      return true;
                    }),
                }),
              ],
              validation: (Rule) =>
                Rule.custom((fields) => {
                  if (!fields?.linkType) {
                    return 'Link type is required.';
                  }
                  if (fields?.internalLink && fields?.externalUrl) {
                    return 'Choose either an internal link or an external URL, not both.';
                  }
                  return true;
                }),
            }),
          ],
        },
      ],
    }),
  ],
});

export default specialtyCard;