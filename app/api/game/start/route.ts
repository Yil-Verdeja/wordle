import {
	encodeCadidates,
	getCandidates,
	getSession,
	selectRandomWord,
} from "../utils";

export async function POST(request: Request) {
	const session = await getSession();
	const data = await request.json();

	// Initialize the game if not already started or if it finished
	if (session.game.status !== "pending") {
		// set game type
		if (data.gameType && data.gameType === "absurdle") {
			session.game.type = "absurdle";
			session.game.candidates = encodeCadidates(getCandidates());
			session.game.answer = "";
		} else {
			session.game.type = "normal";
			session.game.candidates = "";
			session.game.answer = selectRandomWord();
			console.log(session.game.answer);
		}

		session.game.status = "pending";
		session.game.tries = 0;
		session.game.results = [];
		await session.save();

		return new Response(
			JSON.stringify({
				status: session.game.status,
				type: session.game.type,
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
			type: session.game.type,
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
