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
		// $res_str .= var_dump_text($board);

		for ($i = 0; $i < count($board); $i++) {
			// $res_str .= (string) $board[$i]->state . "\n";
			if ($board[$i]->state === DISK_WHITE) {
				$player_count++;
				if ($i === 0 || $i === 7 || $i === 56 || $i === 63) $corner++;
			} else if ($board[$i]->state === DISK_BLACK) {
				$enemy_count++;
			}
		}

		$player_score += ($player_count > $enemy_count) ? 1250 : 600;

		$player_score += $player_count * 12.5;
		$player_score += $corner * 250;
		$player_score += $bang * 10;
		$player_score += max(360 - $_POST["time"], 0);
		$player_score = floor($player_score);

		return min($player_score, $_POST["score"]);
	}

	function score_registration($name, $score, $game_result, $game_mode) {
		$mysqli = new mysqli('localhost', 'root', '', 'reversi_ranking_test');
		if (mysqli_connect_error()) {
			$res_str .= "connection failed";
		} else {
			// $res_str .= "{$mysqli -> server_version}\n";
			// $res_str .= $_SESSION["registered"] . "\n";
			// $res_str .= $_POST["name"] . " ";
			// $res_str .= $_POST["score"] . " ";
			// $res_str .= $_POST["result"] . "\n";

			$q = "INSERT INTO `users` (`id`, `name`, `score`, `mode`, `result`, `registered_at`) VALUES (?, ?, ?, ?, ?, ?)";
			// $res_str .= $q . "n";
			$id = null;
			$timestamp = null;

			$stmt = $mysqli -> prepare($q);
			$stmt -> bind_param('isiiii', $id, $name, $score, $game_mode, $game_result, $timestamp);
			// $stmt -> execute();

			$q = "SELECT * FROM Users";
			$stmt = $mysqli -> prepare($q);
			$stmt -> execute();
			$stmt -> bind_result($id, $name, $score, $mode, $result, $registered_at);

			while($stmt -> fetch()) {
				$result_str = "{$id}: {$name}, {$score}pts. {$registered_at}\n";
				global $res_str;
				$res_str .= $result_str;
			}

			// $_SESSION["registered"] = true;
		}

		$mysqli -> close();
	}

	if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
		// die(var_dump_text($_SESSION["id"]));
		die(json_encode("無効なセッション"));
	} else {
		// $res_str .= "{$_SESSION["GAME_COUNT"]} !== {$_POST["gc"]}n";
		if ($_SESSION["GAME_COUNT"] === $_POST["gc"]) {
			die(json_encode("Error_0: data duplication"));
		}

		// $res = [
		// 	'request' => $_POST['token'],
		// 	'session' => $_SESSION['token']
		// ];
		// echo json_encode("有効なセッション" . var_dump_text($res), JSON_UNESCAPED_UNICODE);
		// $res_str = <<< EOS
		// [有効なセッション]
		// SESSION_ID: {$id}
		// POST_TOKEN: {$_POST["token"]}
		// SESSION_TOKEN: {$_SESSION["token"]}
		// EOS;


		$_SESSION["GAME_COUNT"] = $_POST["gc"];

		$player_score = comfirm_score();
		$res_str .= "player_score: {$player_score}\n";

		score_registration($_POST["name"], (int)$player_score, (int)$_POST["result"], (int)$_POST["mode"]);
		echo json_encode($res_str, JSON_UNESCAPED_UNICODE);
	}
?>