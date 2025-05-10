'use client'

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'
import type { PAGE_QUERYResult } from '@/sanity.types'

type FAQProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'faqs' }
>

export default function FAQs({
  theme,
  tagLine,
  title,
  body,
  faqs,
}: FAQProps & {
  tagLine?: string | null
  title?: string | null
  body?: any
}) {
  return (
    <Theme variant={theme || 'white'}>
      <div className="py-10  max-w-4xl mx-auto">
        <div className="text-center mb-10">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>

        {faqs && faqs.length > 0 && (
          <Accordion type="multiple" className="space-y-4">
            {faqs.map((faq) => (
              <AccordionItem className='text-white/80' key={faq._id} value={`item-${faq._id}`}>
                <AccordionTrigger>{faq.title}</AccordionTrigger>
                <AccordionContent>
                  <PortableTextRenderer value={faq.body || []} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </Theme>
  )
}