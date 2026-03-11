import { defineType, defineField } from "sanity";

export const statusChangeType = defineType({
  name: "statusChange",
  title: "Status Change",
  type: "document",
  fields: [
    defineField({
      name: "member",
      title: "Member",
      type: "reference",
      to: [{ type: "member" }],
      description: "The member whose status was changed",
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
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "changedBy",
      title: "Changed By",
      type: "reference",
      to: [{ type: "member" }],
      description: "Who made this change (member or admin)",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "changedAt",
      title: "Changed At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { status: "status", changedAt: "changedAt" },
    prepare({ status, changedAt }) {
      return {
        title: `${status} at ${changedAt ? new Date(changedAt).toLocaleString() : "—"}`,
        subtitle: "Status change",
      };
    },
  },
});
