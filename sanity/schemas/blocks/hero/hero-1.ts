import { defineField, defineType, ValidationContext } from "sanity";
import { LayoutTemplate } from "lucide-react";

// Define the expected shape of the parent object (hero-1)
interface Hero1Parent {
  showButton?: boolean;
  buttonType?: string;
}

export default defineType({
  name: "hero-1",
  title: "Hero 1",
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
      name: "layout",
      title: "Layout",
      type: "string",
      options: {
        list: [
          { title: "Image Left", value: "image-left" },
          { title: "Image Right", value: "image-right" },
        ],
      },
      initialValue: "image-right",
    }),
    defineField({
      name: "reverseOnMobile",
      title: "Reverse Layout on Mobile",
      type: "boolean",
      description: "If enabled, reverses the image position on mobile devices (below 1024px).",
      initialValue: false,
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
      name: "image",
      title: "Image",
      type: "image",
      fields: [
        {
          name: "alt",
          type: "string",
          title: "Alternative Text",
        },
      ],
    }),

    defineField({
      name: "riveAnimation",
      title: "Rive Animation (.riv)",
      type: "file",
      options: { accept: ".riv" },
      description: "Optional. Upload a .riv file to show an animation instead of the static image.",
    }),
    defineField({
      name: "stateMachines",
      title: "Rive State Machines",
      type: "array",
      of: [{ type: "string" }],
      description: "List of state machines in the .riv file. For dynamic usage.",
    }),
    defineField({
      name: "defaultStateMachine",
      title: "Default State Machine",
      type: "string",
      description: "Name of the default state machine to use. Must match one of the above.",
      validation: (rule) =>
        rule.custom((value: string | undefined, context: ValidationContext) => {
          const parent = context.parent as any;
          const stateMachines = parent?.stateMachines as string[] | undefined;
          if (parent?.riveAnimation && value && stateMachines && !stateMachines.includes(value)) {
            return "Default State Machine must match one of the listed state machines.";
          }
          return true;
        }),
    }),
    defineField({
      name: "interactionInputs",
      title: "Rive Interaction Inputs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "inputName",
              title: "Input Name",
              type: "string",
              description: "Name of the input as defined in the Rive state machine.",
            }),
            defineField({
              name: "inputType",
              title: "Input Type",
              type: "string",
              options: {
                list: [
                  { title: "Boolean", value: "boolean" },
                  { title: "Trigger", value: "trigger" },
                  { title: "Number", value: "number" },
                ],
              },
              initialValue: "boolean",
            }),
            defineField({
              name: "event",
              title: "Trigger Event",
              type: "string",
              options: {
                list: [
                  { title: "Hover", value: "hover" },
                  { title: "Click", value: "click" },
                  { title: "Scroll", value: "scroll" },
                  { title: "Custom", value: "custom" },
                ],
              },
              description: "Event that triggers this input.",
            }),
            defineField({
              name: "value",
              title: "Default Value",
              type: "number",
              hidden: ({ parent }) => parent?.inputType !== "number",
              description: "Default value for number inputs.",
            }),
          ],
        },
      ],
      description: "Define inputs for interactivity (e.g., hover, click, scroll) in the state machine.",
    }),
    
    defineField({
      name: "showButton",
      title: "Show Button",
      type: "boolean",
      description: "Enable to display a button in the hero section.",
      initialValue: true,
    }),
    defineField({
      name: "buttonType",
      title: "Button Type",
      type: "string",
      options: {
        list: [
          { title: "Primary CTA (Book Appointment)", value: "primaryCTA" },
          { title: "Custom Button", value: "custom" },
        ],
      },
      hidden: ({ parent }) => !parent?.showButton,
      initialValue: "primaryCTA",
    }),
    defineField({
      name: "customButton",
      title: "Custom Button",
      type: "object",
      hidden: ({ parent }) => !parent?.showButton || parent?.buttonType !== "custom",
      fields: [
        defineField({
          name: "label",
          title: "Button Label",
          type: "string",
          validation: (rule) =>
            rule.custom((value: string | undefined, context: ValidationContext) => {
              const parent = context.parent as Hero1Parent | undefined;
              if (parent?.showButton && parent?.buttonType === "custom" && !value) {
                return "Button Label is required when using a custom button.";
              }
              return true;
            }),
        }),
        defineField({
          name: "link",
          title: "Link",
          type: "string",
          validation: (rule) =>
            rule.custom((value: string | undefined, context: ValidationContext) => {
              const parent = context.parent as Hero1Parent | undefined;
              if (parent?.showButton && parent?.buttonType === "custom" && !value) {
                return "Link is required when using a custom button.";
              }
              return true;
            }),
        }),
        defineField({
          name: "isExternal",
          title: "External Link",
          type: "boolean",
          description: "Enable if the link points to an external website.",
          initialValue: false,
        }),
        
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Hero 1",
        subtitle: title,
      };
    },
  },
});