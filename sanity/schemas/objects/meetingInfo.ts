// sanity/schemas/objects/meetingInfo.ts
import { defineType, defineField } from 'sanity';

export default defineType({
  name: 'meetingInfo',
  title: 'Meeting Info',
  type: 'object',
  fields: [
    defineField({ name: 'inviteId', type: 'string' }),
    defineField({ name: 'roomName', type: 'string' }),
    defineField({ name: 'startsAt', type: 'datetime' }),
    defineField({ name: 'endsAt', type: 'datetime' }),
    defineField({ name: 'status', type: 'string', options: { list: ['active', 'revoked'] }, initialValue: 'active' }),
  ],
});