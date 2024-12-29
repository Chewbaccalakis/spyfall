import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import socketIOClient from "socket.io-client";
import Swal from "sweetalert2";
import { parseCookies, setCookie } from "nookies";
import { useI18n } from "../locales";

import NameEntry from "../components/NameEntry";
import Lobby from "../components/Lobby";
import InGame from "../components/InGame";
import Loading from "../components/Loading";
import { lockedMessage } from "../utils/misc";

const socket = socketIOClient();

const Game = ({ loading }) => {
	const router = useRouter();
	const t = useI18n();
	const { gameCode } = router.query;

	const [gameState, setGameState] = useState({
		status: "loading",
	});
	const [isRocketcrab, setIsRocketcrab] = useState(false);
	const [isConnected, setIsConnected] = useState(socket.connected);

	const cleanup = () => {
		socket.close();
		setGameState({ status: "loading" });
	};

	useEffect(() => {
		const cl = socket.on("connect", () => setIsConnected(true));
		window.addEventListener("beforeunload", cleanup);

		return () => {
			socket.off("connect", cl);
			window.removeEventListener("beforeunload", cleanup);
		};
	}, []);

	useEffect(() => {
		if (!isConnected && !socket.active) {
			socket.connect();
			return;
		}

		const { previousGameCode, previousName } = parseCookies();

		if (previousGameCode === gameCode && previousName) {
			socket.emit("joinGame", { gameCode, previousName });
		} else {
			socket.emit("joinGame", { gameCode });
		}

		socket.on("gameChange", (newGameState) => {
			setGameState(newGameState);

			// setting disconnect handler after game has been joined,
			// or else it will cause an infinite loop with the invalid handler
			if (gameCode !== "ffff") {
				socket.on("disconnect", () => {
					setIsConnected(false);
					return router.push("/" + gameCode);
				});
			}
		});
		socket.on("invalid", () => router.push("/join?invalid=" + gameCode));
		socket.on("badName", () => Swal.fire("Name already in use"));
		socket.on("lockedWarning", (minutes) =>
			Swal.fire(lockedMessage(minutes)).then(() => router.push("/")),
		);

		const urlParams = new URLSearchParams(window.location.search);

		const isRocketcrab = urlParams.get("rocketcrab") === "true";
		const name = urlParams.get("name");

		if (isRocketcrab && name) {
			setIsRocketcrab(true);
			onNameEntry(name);
		}
	}, [isConnected]);

	const onNameEntry = (name) => {
		socket.emit("name", name);
		setCookie(null, "previousGameCode", gameCode);
		setCookie(null, "previousName", name);
		console.log("Name Set:", name);
	};

	const { status, me } = gameState;

	const showLoading = status === "loading" || loading;
	const showNameEntry = !showLoading && !me.name;
	const showLobby = !showNameEntry && status.startsWith("lobby");
	const showGame = !showNameEntry && status === "ingame";

	return (
		<>
			{showLoading && (
				<>
					<h4>{t("ui.waiting for players")}</h4>
					<Loading />
					<div>{socket.connected ? "Connected" : "Disconnected"}</div>
					<button className="btn-small" onClick={() => socket.connect()}>
						Reconnect
					</button>
				</>
			)}
			{!showLoading && (
				<>
					{showNameEntry && (
						<NameEntry
							onNameEntry={onNameEntry}
							gameCode={gameState.code}
							socket={socket}
						/>
					)}
					{showLobby && (
						<Lobby
							gameState={gameState}
							socket={socket}
							isRocketcrab={isRocketcrab}
						/>
					)}
					{showGame && (
						<InGame
							gameState={gameState}
							socket={socket}
							isRocketcrab={isRocketcrab}
						/>
					)}
				</>
			)}
		</>
	);
};

export default Game;
