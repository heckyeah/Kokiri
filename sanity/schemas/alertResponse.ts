import { defineType, defineField } from "sanity";

export const alertResponseType = defineType({
  name: "alertResponse",
  title: "Alert Response",
  type: "document",
  fields: [
    defineField({
      name: "member",
      title: "Member",
      type: "reference",
      to: [{ type: "member" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "alert",
      title: "Alert",
      type: "reference",
      to: [{ type: "alert" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Safe", value: "safe" },
          { title: "Need Help", value: "need_help" },
          { title: "Unconfirmed", value: "unconfirmed" },
        ],
        layout: "radio",
      },
      initialValue: "unconfirmed",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "adminMarkedSafe",
      title: "Admin Marked Safe",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "markedSafeBy",
      title: "Marked Safe By",
      type: "reference",
      to: [{ type: "member" }],
      description: "Admin (member) who marked this response as safe",
      hidden: ({ document }) => !document?.adminMarkedSafe,
    }),
    defineField({
      name: "respondedAt",
      title: "Responded At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "lat",
      title: "Latitude",
      type: "number",
    }),
    defineField({
      name: "lng",
      title: "Longitude",
      type: "number",
    }),
  ],
  preview: {
    select: { status: "status" },
    prepare({ status }) {
      return {
        title: `Response: ${status}`,
        subtitle: "Alert response",
      };
    },
  },
});
