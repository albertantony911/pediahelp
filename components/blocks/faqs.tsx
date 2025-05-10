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
      <div className="py-10 max-w-5xl mx-auto">
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
          <Accordion type="multiple" className="divide-y-[0.5px] divide-gray-300">
            {faqs.map((faq) => (
              <AccordionItem key={faq._id} value={`item-${faq._id}`} className="text-white/90 py-2 ">
                <AccordionTrigger className="py-2 font-normal">{faq.title}</AccordionTrigger>
                <AccordionContent className="py-2 ">
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