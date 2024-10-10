/* eslint-disable @typescript-eslint/no-unused-vars */
import { cookies } from "next/headers";
import { getIronSession, SessionOptions } from "iron-session";
import words from "@/data/words";
import { NextRequest } from "next/server";
import WordleGameServer from "@/lib/wordle/WordleGameServer";

export const sessionConfig: SessionOptions = {
	password: "ELm5eycNHAZ3bJ4Nru5M47RBAUXNVgjh",
	cookieName: "wordle-game-session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		httpOnly: true,
	},
};

export interface SessionData {
	game: WordleGameServer;
}

export async function POST(request: NextRequest) {
	const session = await getIronSession<SessionData>(cookies(), sessionConfig);
	const maxTries = 6;

	// Initialize the game if not already started or if it finished
	if (!session.game || session.game.status !== "pending") {
		session.game = new WordleGameServer(maxTries);
		const randomWordsPosition = Math.floor(Math.random() * words.length);
		session.game.answer = words[randomWordsPosition];
		await session.save();

		return new Response(
			JSON.stringify({
				status: session.game.status,
				maxTries: session.game.maxNumTries,
			}),
			{
				headers: { "Content-Type": "application/json" },
			}
		);
	}

	// Return error if a new game is being requested while it's ongoing
	return new Response(
		JSON.stringify({
			status: session.game.status,
			maxTries: session.game.maxNumTries,
			tries: session.game.tries,
			error: "A game is already active",
		}),
		{
			status: 409,
			headers: { "Content-Type": "application/json" },
		}
	);
}
