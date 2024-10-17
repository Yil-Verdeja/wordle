import { getIronSession } from "iron-session";
import { SessionData, sessionConfig } from "./types";
import { cookies } from "next/headers";
import WordleGame from "@/lib/wordle/WordleGame";
import words from "@/data/words";
import { LetterMatch } from "@/lib/wordle/types";

export const getSession = async () => {
	const session = await getIronSession<SessionData>(cookies(), sessionConfig);

	if (!session.game) {
		session.game = new WordleGame(10);
		await session.save();
	}

	return session;
};

export const getWords = (): string[] => {
	if (process.env.WORDS !== undefined) {
		return process.env.WORDS.split(", ");
	} else {
		return words;
	}
};

export const getRandomWordsSubset = (numWords: number) => {
	const words = getWords();
	const selectedIndices = new Set();
	const subset = [];

	while (subset.length < Math.min(numWords, words.length)) {
		const index = Math.floor(Math.random() * words.length);
		if (!selectedIndices.has(index)) {
			subset.push(words[index]);
			selectedIndices.add(index);
		}
	}

	return subset;
};

export const getCandidates = (): { word: string; position: number }[] => {
	const MAX_CANDIDATES = 500;
	const words = getRandomWordsSubset(MAX_CANDIDATES);
	return words.map((word, index) => ({ word: word, position: index }));
};

export const encodeCadidates = (
	candidates: { word: string; position: number }[]
) => {
	return candidates
		.reduce((acc, curr) => (acc += curr.position + ","), "")
		.slice(0, -1);
};

export const decodeCandidates = (encodedCandidates: string) => {
	const words = getWords();
	return encodedCandidates.split(",").map((position) => ({
		word: words[parseInt(position)],
		position: parseInt(position),
	}));
};

export const selectRandomWord = (): string => {
	if (process.env.WORDS !== undefined) {
		const customWords = process.env.WORDS.split(", ");
		return customWords[Math.floor(Math.random() * customWords.length)];
	} else {
		return words[Math.floor(Math.random() * words.length)];
	}
};

export const findCandidates = (
	guess: string,
	candidates: { word: string; position: number }[]
) => {
	let selectedCandidates: { word: string; position: number }[] = [];
	let minPoints = 50; // set to maximum points - H = 10, P = 1, M = 0

	// if minPoints is updated, then clear candidates, and add the new item that made minPoints change
	candidates.forEach((candidate) => {
		const result = makeGuess(guess, candidate.word);
		let points = 0;
		for (let i = 0; i <= result.length; i++) {
			const letter = result[i];
			if (letter === "H") points += 10;
			else if (letter === "P") points += 1;
		}
		if (points === minPoints) {
			selectedCandidates.push(candidate);
		} else if (points < minPoints) {
			selectedCandidates = [candidate];
			minPoints = points;
		}
	});

	return { candidates: selectedCandidates, points: minPoints };
};

export const makeGuess = (guess: string, answer: string) => {
	const result = Array<LetterMatch>(guess.length).fill(LetterMatch.Miss);
	const answerCharsTaken = Array<boolean>(answer.length).fill(false);

	// check for correct positions
	for (let i = 0; i < guess.length; i++) {
		if (guess[i] === answer[i]) {
			result[i] = LetterMatch.Hit;
			answerCharsTaken[i] = true;
		}
	}

	// check for wrong positions but correct letters
	for (let i = 0; i < guess.length; i++) {
		if (result[i] === LetterMatch.Miss) {
			// Only check those not already marked as 'H'
			for (let j = 0; j < answer.length; j++) {
				if (!answerCharsTaken[j] && guess[i] === answer[j]) {
					result[i] = LetterMatch.Present; // Correct letter, wrong position
					answerCharsTaken[j] = true;
					break; // Stop once a match is found
				}
			}
		}
	}

	return result.join("");
};

type ValidateGuessResult = {
	guess?: string;
	error?: string;
};

export const validateGuess = (guess: unknown): ValidateGuessResult => {
	if (typeof guess !== "string") return { error: "guess must be a string" };

	if (guess.length !== 5)
		return { guess, error: "guess must be 5 characters long" };

	const normalizedGuess = guess.toLowerCase();
	if (!words.includes(normalizedGuess))
		return { guess, error: "guess must be a valid word" };

	return { guess: normalizedGuess };
};
