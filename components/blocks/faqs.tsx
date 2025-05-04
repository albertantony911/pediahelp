import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { Theme, ThemeVariant } from "@/components/ui/theme/Theme";
import { PAGE_QUERYResult } from "@/sanity.types";

type FAQProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "faqs" }
>;

export default function FAQs({ theme, faqs }: FAQProps) {
  return (
    <Theme variant={theme || "white"}>
      <div className="py-20 lg:pt-40">
        {faqs && faqs?.length > 0 && (
          <Accordion className="space-y-4" type="multiple">
            {faqs.map((faq) => (
              <AccordionItem key={faq.title} value={`item-${faq._id}`}>
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
  );
}