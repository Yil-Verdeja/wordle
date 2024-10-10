"use client";
import GameControls from "@/components/GameControls";
import GameSettings from "@/components/GameSettings";
import GuessWordForm from "@/components/GuessWordForm";
import LetterGrid from "@/components/LetterGrid";
import { useGameContext } from "@/context/GameContext";
import { useState } from "react";

export default function Home() {
	const { gameState, submitGuess } = useGameContext();
	const [guess, setGuess] = useState("");

	return (
		<div className="w-full h-screen flex justify-center items-center gap-10">
			<div className="flex flex-col gap-4">
				<h1 className="text-3xl">Wordle</h1>
				<GameSettings />
				<GameControls />
				{gameState.inSession && (
					<GuessWordForm
						guess={guess}
						onUpdateGuess={setGuess}
						onSubmitGuess={() => {
							submitGuess(guess.toLowerCase());
							setGuess("");
						}}
					/>
				)}
			</div>
			{gameState.sessionStatus !== "stopped" && (
				<div className="flex flex-col gap-4">
					<LetterGrid guessResults={gameState.results} />
					{gameState.sessionStatus !== "pending" && (
						<div className="flex flex-col justify-center items-center">
							<p>
								{gameState.sessionStatus === "win"
									? `Congrats! You Won`
									: `Bohoo, you lost :< Try again`}
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
