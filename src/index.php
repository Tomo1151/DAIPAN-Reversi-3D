<?php
	function consolelog($data) {
		echo <<< EOS
			<script>console.log("$data");</script>
		EOS;
	}
	session_start();
	consolelog(session_id());

	$token = bin2hex(openssl_random_pseudo_bytes(16));
	$_SESSION["token"] = $token;
	$_SESSION["GAME_COUNT"] = -1;
	// $_SESSION["registered"] = false;
	consolelog($_SESSION["token"]);
?>

<!DOCTYPE html>
<html lang="ja">

	<head>
		<meta charset="utf-8">
		<!-- <meta name="viewport" content="width=device-width, initial-scale=1"> -->
		<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
		<title>3Dオセロ</title>
		<!-- CSS Load -->
		<link rel="stylesheet" type="text/css" href="css/style.css">
		<!-- JS Load -->
		<script type="importmap">
			{
				"imports": {
					"three": "./lib/three.js/build/three.module.js",
					"three/addons/": "./lib/three.js/jsm/"
				}
			}
		</script>
		<script>
			document.addEventListener('touchmove', function (event) {
				if (event.scale !== 1) {
					event.preventDefault();
				}
			}, { passive: false });
		</script>
		<script defer type="module" src="js/Main.js"></script>
		<style type="text/css">
		@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600&family=Noto+Sans+Mono:wght@400;600&display=swap');
		@font-face {
			font-family: "MPlus1";
			src:
				url("fonts/MPLUS1-VariableFont_wght.ttf") format("truetype");
		}

		:root {
			--font-main-black: #333;
			--color-border-black: #444;
			--font-main-white: #FAFAFA;
			--color-bg-board: #00e62e;
		}

		* {
			margin: 0;
			box-sizing: border-box;
		}

		body {
			margin: 0;
			font-family: 'MPlus1', sans-serif;
			font-weight: 600;
			overflow: hidden;

			-webkit-touch-callout: none;
			-webkit-user-select: none;
			-khtml-user-select: none;
			-moz-user-select: none;
			-ms-user-select: none;
			user-select: none;
			outline: none;
			-webkit-tap-highlight-color: rgba(255, 255, 255, 0);
			/* mobile webkit */
		}

		.fadeIn {
			animation-name: fadeInAnimation;
			animation-duration: .5s;
			animation-fill-mode: forwards;
			opacity: 0;
		}

		.fadeOut {
			animation-name: fadeOutAnimation;
			animation-duration: 1s;
			animation-fill-mode: forwards;
			opacity: 1;
		}

		@keyframes fadeInAnimation {
			from {
				opacity: 0;
			}

			to {
				opacity: 0.85;
			}
		}

		@keyframes fadeOutAnimation {
			from {
				opacity: 1;
			}

			to {
				opacity: 0;
				display: none;
			}
		}

		@keyframes shake {
			50% {
				transform: rotate(-10deg);
			}

			100% {
				transform: rotate(10deg);
			}
		}

		#ingame_ui {
			display: none;
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;

			pointer-events: none;
		}

		.order {
			display: flex;
			background: var(--color-bg-board);
			font-size: 1.25rem;
			font-weight: bold;
			justify-content: center;
			align-items: center;
			position: absolute;
			top: -3px;
			left: 50%;
			border: 3px solid #444;
			border-radius: 0 0 10px 10px;
			padding: 0.5rem 1rem;
			opacity: 0.85;
			user-select: none;

			width: 20rem;
			max-width: 32.5%;
			height: 4.5rem;
			transform: translateX(-50%);
			pointer-events: none;
		}

		#order {
			display: flex;
			position: relative;
			font-size: 2rem;
			justify-content: center;
			align-items: center;
			border-radius: 50%;
			width: 3.5rem;
			height: 3.5rem;
			margin-right: 1rem;
		}

		#order span {
			position: relative;
			top: -3px;
			left: 0.5px;
		}

		.order-black {
			color: var(--font-main-white);
			background: #000;
			/*			border: 2px solid var(--font-main-white);*/
		}

		.order-white {
			color: var(--font-main-black);
			background: var(--font-main-white);
			border: 2px solid var(--font-main-black);
		}

		.button {
			/*			position: absolute;
			top: 1rem;
			left: 1rem;*/
			background: var(--font-main-white);
			border: 2px solid var(--color-border-black);
			border-radius: 5px;
			padding: 0.5rem 1rem;
			margin: 1rem 0;
			width: fit-content;
			user-select: none;
			transition-duration: 0.25s;
			opacity: 0.85;
/*			font-family: 'Noto Sans JP', sans-serif;*/

			text-align-last: justify;
			text-justify: inter-ideograph;
			pointer-events: all;
		}

		.button:hover {
			filter: brightness(0.8);
			transform: scale(1.1);
			cursor: pointer;
		}

		.button:active {
			transform: scale(0.95);
		}

		.buttons-wrapper {
/*			display: none;*/
			position: absolute;
			top: 1rem;
			left: 1rem;

			padding: 2rem;
		}

		.buttons-wrapper .button {
			font-size: 2rem;
			font-weight: normal;
			padding: 0.5rem 1.75rem;
			width: 10rem;
		}

		.button:hover {
			filter: brightness(0.8);
			transform: scale(1.05);
		}

		.button:active {
			transform: scale(0.975);
		}

		canvas {
			margin: 0;
			width: 100%;
			height: 100%;
		}

		#title_screen {
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			background: var(--font-main-white);

			border: 3px solid #AAA;
			border-radius: 5px;

			width: 720px;
			max-width: 50%;
			/*			height: 470px;
			max-height: 50%;*/
/*			box-shadow: 0 0 25rem 2rem var(--font-main-black);*/
			opacity: 0.75;

			padding: 2rem;
		}

		#result_screen {
			display: none;
			position: absolute;
			top: 50%;
			left: 50%;
/*			font-family: 'Noto Sans Mono', monospace;*/
			transform: translate(-50%, -50%);

			background: var(--font-main-white);

			border: 3px solid #AAA;
			border-radius: 5px;

			opacity: 0.75;

			width: 720px;
			max-width: 50%;
			/*			height: 480px;
			max-height: 50%;*/

			padding: 2rem;
		}

		#result_screen h2 {
			font-size: 1.5rem;
			font-weight: normal;
			text-align: center;
		}

		#result_screen h3 {
			font-size: 2.5rem;
			font-weight: normal;
			text-align: center;
		}

		#score::before {
			content: 'Score : ';
			font-family: monospace;
		}

		#order_black::before {
			content: '[ Black ] ';
			font-family: monospace;
		}

		#order_white::before {
			content: '[ White ] ';
			font-family: monospace;
		}

		.disabled {
			filter: opacity(0.25);
			cursor: not-allowed;
		}

		.disabled:hover,
		.disabled:active {
			filter: opacity(0.2);
			transform: scale(1.0);
			cursor: not-allowed;
		}

		.active,
		.active:hover,
		.active:active {
			background: #AAA;
			transform: scale(1.0);
		}

		#player_name {
			font-size: 1rem;
			padding: 1rem;
			border: 2px solid var(--color-border-black);
			border-radius: 5px;
			width: 17.25rem;
			margin: 1rem 0;
			opacity: 0.85;
		}

		.caution {
			display: flex;
			position: absolute;
			top: 0;
			left: 0;
			background: white;
			justify-content: center;
			align-items: center;
			flex-direction: column;
			font-size: 2.5rem;
			color: var(--font-main-black);
			width: 100vw;
			height: 100vh;
			z-index: 999;
			pointer-events: none;
		}

		.phone_image {
			margin-top: 5rem;
			width: 30%;
			opacity: 0.85;
		}

		.phone_image img {
			width: 100%;
			animation: shake 2s infinite;
			transform: rotate(10deg);
		}

		.meter {
			position: absolute;
			top: 50%;
			right: 7.5rem;
			background-color: grey;
			width: 3.5rem;
			height: 50%;
			opacity: 0.85;
			border-radius: 3px;

			transform: translateY(-50%);
			pointer-events: none;
		}

		.meter-name {
			color: var(--color-border-black);
			position: absolute;
			top: 50%;
			right: -2em;
			font-size: 1.5em;
			white-space: nowrap;
			writing-mode: vertical-lr;
			font-family: monospace;
			translate: 0 -50%;
			z-index: 15;
		}

		#meter_value {
			position: absolute;
			bottom: 1%;
			left: 50%;
			background: linear-gradient(to top, yellow, red);
			width: 90%;
			height: 0%;

			transform: translateX(-50%);
			transition-duration: 2s;
		}

		.steam-left {
			position: absolute;
			top: 0;
			left: -100%;
			width: 100%;
			object-fit: contain;
			translate: 0 -100%;
			z-index: 10;
		}

		.steam-right {
			position: absolute;
			top: 0;
			left: none;
			right: -100%;
			transform: scale(-1, 1);
			width: 100%;
			object-fit: contain;
			translate: 0 -100%;
			z-index: 10;
		}

		#loading_screen {
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			font-size: 3rem;
			position: absolute;
			inset: 0;
			background-color: white;
/*			opacity: 0.9;*/
			width: 100%;
			height: 100%;
			z-index: 1000;
		}

		.loading-image {
			width: 30%;
			max-width: 200px;
			max-height: 30%;
		}

		.loading-image img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}

		progress {
			width: 80%;
			max-width: 400px;
			margin: 0 auto;
		}

		#log {
			display: none;
			font-family: monospace;
			position: absolute;
			bottom: 2rem;
			left: 0;
			border-radius: 5px;
			height: 72.5%;
			width: 35%;
			padding: 1rem;

			background: #bbb;

			opacity: .5;
			pointer-events: none;
			overflow: hidden;
			z-index: 100000;
		}

		#cut {
/*			background-color: rgba(255, 255, 255, .6);*/
			color: var(--font-main-white);
			font-weight: bolder;
/*			box-shadow: 0 0 25rem 2.5rem #555;*/
			-webkit-text-stroke: 4px var(--font-main-black);
/*			text-shadow: 0 0 2rem var(--font-main-black);*/
/*			border-top: 1rem solid black;*/
/*			border-bottom: 1rem solid black;*/
			font-size: 7.5rem;
			text-align: center;
			position: absolute;
			top: 50%;
			left: 0;
/*			opacity: .75;*/

			padding: 1rem 0;
			width: 100%;

			translate: 0 -50%;
			z-index: 9999;
		}

		@media (max-width: 1024px) {
			html {
				font-size: 10px;
			}

			#log {
				font-size: 6px;
			}
		}
		</style>
	</head>

	<body>
		<div class="caution" id="caution_screen">
			<p>スマホを横向きにしてください</p>
			<div class="phone_image">
				<img src="img/phone_rotation.png" alt="">
			</div>
		</div>

		<div id="loading_screen">
			<p>ロード中</p>
			<div class="loading-image">
				<img src="img/loading.gif">
			</div>
			<progress value="0" max="100" id="disk_progress"></progress>
			<progress value="0" max="100" id="board_progress"></progress>
		</div>

		<div id="log">
			<h2>─ Log message ─</h2>
		</div>

		<div id="ingame_ui">
			<div class="buttons-wrapper" id="action_button">
				<div class="button disabled" id="put_button">
					<p>おく</p>
				</div>
				<div class="button disabled" id="pass_button">
					<p>パス</p>
				</div>
				<div class="button disabled" id="bang_button" style="display: none;">
					<p>台パン</p>
				</div>
			</div>
			<div class="order" id="order_div">
				<p id="order" class="order-black"><span>黒</span></p>
				<p>の手番です</p>
			</div>
			<div class="meter" id="meter">
				<img src="img/steam.gif" class="steam-left">
				<img src="img/steam.gif" class="steam-right">
				<span class="meter-name">frustration meter</span>
				<div id="meter_value"></div>
			</div>
		</div>

		<div class="cut" id="cut" style="display: none;">
			<p>ゲームスタート</p>
		</div>

		<div class="fadeIn" id="title_screen">
			<h1 style="margin-bottom: 1rem;">台パンリバーシ<sup>3D</sup></h1>
			<div>
				<input type="text" id="player_name" placeholder="プレイヤーを入力してください" maxlength="15">
				<p>※ Player 名はランキング <small>[未実装]</small> に使用します</p>
			</div>
			<div class="settings">
				<label for="game_mode">短気モード</label>
				<input type="checkbox" name="mode" id="game_mode">
			</div>
			<div class="button" id="start_button">
				<p>はじめる</p>
			</div>
		</div>

		<div class="fadeIn" id="result_screen">
			<h2>Result</h2>
			<h3 id="winner">Player の勝ち！</h3>
			<div id="result">
				<p id="score"></p>
				<p id="order_black"></p>
				<p id="order_white"></p>
				<p id="time"></p>
			</div>
			<div class="button" id="restart_button">
				<p>タイトルに戻る</p>
			</div>
		</div>

		<canvas id="main-canvas"></canvas>
		<input type="hidden" name="token" value="<?php echo $_SESSION['token']?>" id="token">
<!-- 		<script>
			function f() {
				const form = new FormData();
				const token = document.getElementById("token").value;
				form.append("token", token);
				form.append("name", "test_name");
				form.append("score", 600);
				form.append("result", 1);

				const params = {
					method: "POST",
					body: form
				};

				console.log(`value: ${token}`);

				fetch("php/score_registration.php", params)
				.then((response) => response.json())
				.then((res) => {
					console.log(`res:`);
					console.log(res);
				});
			}
		</script> -->
		<!-- <button onclick="f()" style="position: absolute; top: 0; left: 0; width: 300px; height: 100px;">fetch()</button> -->
	</body>

</html>