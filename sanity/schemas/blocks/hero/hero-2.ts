import { defineField, defineType } from "sanity";
import { LayoutTemplate } from "lucide-react";
import type { ValidationContext } from "sanity";

export default defineType({
  name: "hero-2",
  title: "Hero 2",
  type: "object",
  icon: LayoutTemplate,
  fields: [
    defineField({
      name: "theme",
      title: "Theme Variant",
      type: "string",
      options: {
        list: [
          { title: "Dark Shade", value: "dark-shade" },
          { title: "Mid Shade", value: "mid-shade" },
          { title: "Light Shade", value: "light-shade" },
          { title: "White", value: "white" },
        ],
      },
    }),
    defineField({
      name: "tagLine",
      type: "string",
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "body",
      type: "block-content",
    }),
    defineField({
      name: "buttons",
      title: "Buttons",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "buttonLabel",
              title: "Button Label",
              type: "string",
              description: "Label for the button. Leave empty to hide the button.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "buttonType",
              title: "Button Type",
              type: "string",
              options: {
                list: [
                  { title: "Custom Button", value: "custom" },
                  { title: "WhatsApp Button", value: "whatsapp" },
                ],
                layout: "radio",
                direction: "horizontal",
              },
              initialValue: "custom",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "link",
              title: "Button Link",
              type: "object",
              description: "Choose an internal page or provide an external URL.",
              hidden: ({ parent }) => parent?.buttonType === "whatsapp",
              fields: [
                defineField({
                  name: "internalLink",
                  title: "Internal Link",
                  type: "reference",
                  to: [{ type: "page" }],
                  description: "Select an internal page for the button.",
                }),
                defineField({
                  name: "externalUrl",
                  title: "External URL",
                  type: "url",
                  description: "Provide an external URL (e.g., https://example.com).",
                }),
              ],
              validation: (Rule) =>
                Rule.custom((fields, context) => {
                  const parent = context.parent as { buttonType?: string } | undefined;
                  if (parent?.buttonType === "custom" && !fields?.internalLink && !fields?.externalUrl) {
                    return "Either an internal link or an external URL is required for custom buttons.";
                  }
                  if (fields?.internalLink && fields?.externalUrl) {
                    return "Choose either an internal link or an external URL, not both.";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "buttonVariant",
              title: "Button Variant",
              type: "string",
              options: {
                list: [
                  { title: "Default", value: "default" },
                  { title: "Secondary", value: "secondary" },
                  { title: "Ghost", value: "ghost" },
                  { title: "Outline", value: "outline" },
                  { title: "Destructive", value: "destructive" },
                  { title: "Link", value: "link" },
                ],
              },
              initialValue: "default",
              hidden: ({ parent }) => parent?.buttonType === "whatsapp",
              validation: (Rule) =>
                Rule.custom((value, context) => {
                  const parent = context.parent as { buttonType?: string } | undefined;
                  if (parent?.buttonType === "custom" && !value) {
                    return "Button variant is required for custom buttons.";
                  }
                  return true;
                }),
            }),
            defineField({
              name: "whatsappPhone",
              title: "WhatsApp Phone Number",
              type: "string",
              description: "Phone number for WhatsApp (e.g., +1234567890).",
              hidden: ({ parent }) => parent?.buttonType !== "whatsapp",
              validation: (Rule) =>
                Rule.custom((value: string | undefined, context: ValidationContext) => {
                  const parent = context.parent as { buttonType?: string } | undefined;
                  console.log("Validating whatsappPhone:", { value, parent });
                  if (parent?.buttonType === "whatsapp") {
                    if (!value) {
                      console.log("Error: WhatsApp phone number is required.");
                      return "WhatsApp phone number is required for WhatsApp buttons.";
                    }
                    const phoneRegex = /^\+[1-9]\d{9,14}$/;
                    if (!phoneRegex.test(value)) {
                      console.log("Error: Invalid phone number format:", value);
                      return "Invalid phone number format. It must start with a '+' followed by the country code and 9-14 digits (e.g., +1234567890).";
                    }
                  }
                  return true;
                }),
            }),
            defineField({
              name: "whatsappMessage",
              title: "WhatsApp Prefilled Message",
              type: "string",
              description: "Prefilled message for WhatsApp.",
              hidden: ({ parent }) => parent?.buttonType !== "whatsapp",
              validation: (Rule) =>
                Rule.custom((value: string | undefined, context: ValidationContext) => {
                  const parent = context.parent as { buttonType?: string } | undefined;
                  console.log("Validating whatsappMessage:", { value, parent });
                  if (parent?.buttonType === "whatsapp" && !value) {
                    console.log("Error: WhatsApp prefilled message is required.");
                    return "WhatsApp prefilled message is required for WhatsApp buttons.";
                  }
                  return true;
                }),
            }),
          ],
          preview: {
            select: {
              label: "buttonLabel",
              type: "buttonType",
            },
            prepare({ label, type }) {
              return {
                title: label || "Button",
                subtitle: type === "whatsapp" ? "WhatsApp Button" : "Custom Button",
              };
            },
          },
        },
      ],
      validation: (rule) => rule.max(2),
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 2",
        subtitle: title,
      };
    },
  },
});