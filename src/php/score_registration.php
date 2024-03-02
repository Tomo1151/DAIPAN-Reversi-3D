<?php
	session_start();

	const DISK_WHITE = 0;
	const DISK_BLACK = 1;
	const DISK_EMPTY = 0;
	$res_str = "";

	function var_dump_text($text) {
		ob_start();
		var_dump($text);
		$out_text = ob_get_contents();
		ob_end_clean();
		return $out_text;
	}

	function comfirm_score() {
		$player_score = 0;
		$player_count = 0;
		$corner = 0;
		$enemy_count = 0;
		$bang = ($_POST["bang"]);
		$board = json_decode($_POST["board"]);
		$includeEmpty = false;

		for ($i = 0; $i < count($board); $i++) {
			if ($board[$i]->state === DISK_WHITE) {
				$player_count++;
				if ($i === 0 || $i === 7 || $i === 56 || $i === 63) $corner++;
			} else if ($board[$i]->state === DISK_BLACK) {
				$enemy_count++;
			} else {
				$includeEmpty = true;
			}
		}

		if ($player_count > $enemy_count) {
			$player_score += 1250;
			if ($includeEmpty) $player_score += 320;
		} else {
			$player_score +=  600;
		}

		$player_score += $player_count * 12.5;
		$player_score += $corner * 250;
		$player_score += $bang * 10;
		$player_score += max(360 - $_POST["time"], 0);
		$player_score = floor($player_score);

		return min($player_score, $_POST["score"]);
	}

	function score_registration($name, $score, $game_mode, $game_result, $gametime) {
		$mysqli = new mysqli('localhost', 'root', '', 'reversi_ranking_test');
		if ($mysqli->connect_error) {
			global $res_str;
			$res_str .= "connection failed";
		} else {
			global $res_str;
			$q = "INSERT INTO `users` (`id`, `name`, `score`, `mode`, `result`, `time`, `registered_at`) VALUES (?, ?, ?, ?, ?, ?, ?)";
			$id = null;
			$timestamp = null;

			$stmt = $mysqli -> prepare($q);
			$stmt -> bind_param('isiiiii', $id, $name, $score, $game_mode, $game_result, $gametime, $timestamp);
			$stmt -> execute();
		}

		$mysqli -> close();
	}

	if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
		// echo $_POST["token"];
		// echo $_SESSION["token"];
		die(json_encode("無効なセッション", JSON_UNESCAPED_UNICODE));
	} else {
		if ($_SESSION["GAME_COUNT"] === $_POST["gc"]) {
			die(json_encode("Error_0: data duplication"));
		}

		if (!isset($_POST["name"])) {
			die(json_encode("property [\"name\"] isn't set"));
		}

		$_SESSION["GAME_COUNT"] = $_POST["gc"];

		$player_score = comfirm_score();
		$res_str .= "player_score: {$player_score}\n";

		score_registration($_POST["name"], (int)$player_score, (int)$_POST["mode"], (int)$_POST["result"], (int)$_POST["gametime"]);
		echo json_encode($res_str, JSON_UNESCAPED_UNICODE);
	}
?>