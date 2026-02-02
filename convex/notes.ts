// here functions to fetch notes, create new notes, later delete new notes
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getUserNotes = query({ // we have to call this in frontend -> notes-page.tsx
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        return await ctx.db
        .query("notes")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .order("desc")
        .collect();
    },
})

export const createNote = mutation({
    args: {
        title: v.string(),
        body: v.string(),
    },
    returns: v.id("notes"),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if(!userId) {
            throw new Error("User must be authenticated to create a note");
        }

        return await ctx.db.insert("notes", {
            title: args.title,
            body: args.body,
            userId,
        });
    },
});

export const deleteNote = mutation({
    args: {
        noteId: v.id("notes"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if(!userId) {
            throw new Error("User must be authenticated to delete a note");
        }

        const note = await ctx.db.get(args.noteId);

        if (!note) {
            throw new Error ("Note not found");
        }

        if (note.userId !== userId) {
            throw new Error("User is not authorized to delete this note");
        }

        await ctx.db.delete(args.noteId);
    },
});