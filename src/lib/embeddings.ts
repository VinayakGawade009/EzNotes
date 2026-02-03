import { google } from "@ai-sdk/google";
import { embed, embedMany } from "ai";

const embeddingModel = google.embedding("text-embedding-004");

function generateChunks(input: string) {
    return input
        .split("\n\n") // separate paragraphs
        .map(chunk => chunk.trim()) // remove excess whitespaces
        .filter(Boolean);
}


// Take block of text
// turn it into chunks
// we embed this chunks
// and return this data to the color of this function so that we can use it when we create a node 
export async function generateEmbeddings(
    value: string
): Promise<Array<{ content: string, embedding: number[] }>> { // with this we will return Promise with an array that contains one or many of this embeddings together with the text itself
    const chunks = generateChunks(value);

    const { embeddings } = await embedMany({
        model: embeddingModel,
        values: chunks
    })

    return embeddings.map((embedding, index) => ({
        content: chunks[index],
        embedding,
    }));
}

export async function generateEmbedding(value: string): Promise<number[]> {
    const {embedding} = await embed({
        model: embeddingModel,
        value
    });

    return embedding;
}