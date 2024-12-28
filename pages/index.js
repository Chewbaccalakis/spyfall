import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useI18n } from "../locales";
import BuyMe from "../components/BuyMe";

import Loading from "../components/Loading";
import Swal from "sweetalert2";
import { lockedMessage } from "../utils/misc";

const isSpyfallTK = () =>
	window.location.href.startsWith("https://spyfall.tannerkrewson.com");

const Home = ({ loading }) => {
	const router = useRouter();
	const [newGameLoading, setNewGameLoading] = useState(false);
	const t = useI18n();
	const onNewGame = async (e) => {
		e.preventDefault();
		setNewGameLoading(true);

		if (isSpyfallTK()) {
			router.push("https://rocketcrab.com/transfer/tk-spyfall");
			return;
		}

		try {
			const res = await fetch(window.location.origin + "/new", {
				method: "POST",
				headers: {
					Accept: "application/json",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ name }),
			});

			if (res.status === 200) {
				const { gameCode } = await res.json();
				router.push("/" + gameCode);
			} else if (res.status === 423) {
				const { minutes } = await res.json();
				setNewGameLoading(false);

				Swal.fire(lockedMessage(minutes));
			} else {
				throw res.status + " " + res.statusText;
			}
		} catch (error) {
			console.error(error);
			Swal.fire(error);
			setNewGameLoading(false);
		}
	};

	return (
		<div className="main-menu">
			<div
				style={{
					position: "relative",
					margin: "1em auto 0",
					width: "fit-content",
				}}
			>
				<h3>{t("ui.welcome to spyfall")}</h3>
				<div className="subtitle formerly">(formerly Meteor/Crabhat)</div>
			</div>
			<hr />

			{(loading || newGameLoading) && <Loading />}
			{!loading && (
				<>
					<div className="button-container">
						<Link
							href={isSpyfallTK() ? "https://rocketcrab.com/join" : "/join"}
						>
							<button id="btn-join-game" className="btn-large">
								{t("ui.join game")}
							</button>
						</Link>
						<button id="btn-new-game" className="btn-large" onClick={onNewGame}>
							{t("ui.new game")}
						</button>
					</div>
					<p>Powered by 🚀🦀</p>
					<div className="button-container-vertical">
						<div style={{ width: "100%" }}>
							<Link href="/how-to-play">
								<button className="btn-small btn-vertical">How to Play</button>
							</Link>
						</div>
						<a
							href="https://github.com/tannerkrewson/spyfall/blob/dev/README.md#history"
							target="_blank"
							rel="noopener noreferrer"
							style={{ width: "100%" }}
						>
							<button className="btn-small btn-vertical">Crabhat?</button>
						</a>
						<a
							href="https://docs.google.com/forms/d/e/1FAIpQLSe0lIL4ZYxyKDNHqv25VkLqOg7tk2VhOcOA-yDAuYxKFx6kyw/viewform?usp=sf_link"
							target="_blank"
							rel="noopener noreferrer"
							style={{ width: "100%" }}
						>
							<button className="btn-small btn-vertical">
								Submit Feedback
							</button>
						</a>
						<div style={{ marginTop: "1em" }}>
							<BuyMe />
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default Home;
