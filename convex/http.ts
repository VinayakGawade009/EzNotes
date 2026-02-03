import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { convertToModelMessages, streamText, tool, UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod/v4";
import { internal } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
    path: "/api/chat",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return Response.json({erro: "Unauthorized"}, {status: 401})
        }

        const { messages } : {messages: UIMessage[]} = await req.json();

        const lastMessages = messages.slice(-10); // 10 latest messages
        
        const coreMessages = lastMessages.map((m: any) => ({
            role: m.role,
            content: m.content,
        }));

        const result = streamText({
            model: google("gemini-2.5-flash"),
            system: `
              You are a helpful assistant that can search through the user's notes.
              Use the information from the notes to answer questions and provide insights.
              If the requested information is not available, respond with "Sorry, I can't find that information in your notes".
              You can use markdown formatting like links, bullets points, numbered lists, and bold text.
              Provide links to relevant notes using this relative URL structure (omit the base URL): '/notes?noteId=<note-id>'.
              Keep your responses concise and to the point.
            `,
            messages: convertToModelMessages(lastMessages),
            // messages: coreMessages,
            tools: {
              findRelevantNotes: tool({
                description: "Retrieve relevant notes from the database based on the user's query",
                parameters: z.object({
                  query: z.string().describe("The user's query"),
                }),
                execute: async ({query}) => {
                  console.log("findRelevantNotes query: ", query);

                  const relevantNotes = await ctx.runAction(
                    internal.notesActions.findRelevantNotes,
                    {
                      query,
                      userId
                    }
                  )

                  return relevantNotes.map(note => ({
                    id: note._id,
                    title: note.title,
                    body: note.body,
                    creationTime: note._creationTime
                  }))
                }
              })
            },
            onError(error) {
                console.error("streamText error: ", error);
            },
        });

        return result.toUIMessageStreamResponse({
            headers: new Headers({
                "Access-Control-Allow-Origin": "*",
                Vary: "origin",
            })
        });
    }),
});

http.route({
  path: "/api/chat",
  method: "OPTIONS",
  handler: httpAction(async (_, request) => {
    const headers = request.headers;
    if (
      headers.get("Origin") !== null &&
      headers.get("Access-Control-Request-Method") !== null &&
      headers.get("Access-Control-Request-Headers") !== null
    ) {
      return new Response(null, {
        headers: new Headers({
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST",
          "Access-Control-Allow-Headers": "Content-Type, Digest, Authorization",
          "Access-Control-Max-Age": "86400",
        }),
      });
    } else {
      return new Response();
    }
  }),
});

export default http;
