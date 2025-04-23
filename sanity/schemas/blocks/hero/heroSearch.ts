export default {
  name: 'heroSearch',
  title: 'Hero with Search',
  type: 'object',
  fields: [
    { name: 'tagLine', title: 'Tagline', type: 'string' },
    { name: 'title', title: 'Title', type: 'string' },
    {
      name: 'body',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image', value: 'image' },
          { title: 'Rive Animation', value: 'rive' },
        ],
        layout: 'radio',
      },
      initialValue: 'image',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      hidden: ({ parent }: { parent: { mediaType?: string } }) => parent?.mediaType !== 'image',
      options: { hotspot: true },
    },
    {
      name: 'riveFileUrl',
      title: 'Rive File URL',
      type: 'url',
      hidden: ({ parent }: { parent: { mediaType?: string } }) => parent?.mediaType !== 'image',
    },
    {
      name: 'showSearchBar',
      title: 'Show Search Bar',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'searchPlaceholder',
      title: 'Search Placeholder',
      type: 'string',
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tagLine',
      media: 'image',
    },
  },
};