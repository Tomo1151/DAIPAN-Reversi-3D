<?php
	session_start();

	function var_dump_text($text) {
		ob_start();
		var_dump($text);
		$out_text = ob_get_contents();
		ob_end_clean();
		return $out_text;
	}



	if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
		// die(var_dump_text($_SESSION["id"]));
		die(json_encode("無効なセッション"));
	} else {
		// $res = [
		// 	'request' => $_POST['token'],
		// 	'session' => $_SESSION['token']
		// ];
		// echo json_encode("有効なセッション" . var_dump_text($res), JSON_UNESCAPED_UNICODE);
		$id = session_id();
		// $res_str = <<< EOS
		// [有効なセッション]
		// SESSION_ID: {$id}
		// POST_TOKEN: {$_POST["token"]}
		// SESSION_TOKEN: {$_SESSION["token"]}
		// EOS;

		$res_str = "";

		$mysqli = new mysqli('localhost', 'root', '', 'reversi_ranking_test');
		if (mysqli_connect_error()) {
			$res_str .= "connection failed";
		} else {
			$res_str .= "{$mysqli -> server_version}\n";
			$res_str .= $_SESSION["registered"] . "\n";
			$res_str .= $_POST["name"] . " ";
			$res_str .= $_POST["score"] . " ";
			$res_str .= $_POST["result"] . "\n";

			$q = "INSERT INTO `users` (`id`, `name`, `score`, `result`, `registered_at`) VALUES (NULL, '{$_POST["name"]}', '{$_POST["score"]}', '{$_POST["result"]}', current_timestamp());";

			$stmt = $mysqli -> prepare($q);
			$stmt -> execute();

			$q = "SELECT * FROM Users";
			$stmt = $mysqli -> prepare($q);
			$stmt -> execute();
			$stmt -> bind_result($id, $name, $score, $result, $registered_at);

			while($stmt -> fetch()) {
				$result = "{$id}: {$name}, {$score}pts. {$registered_at}\n";
				$res_str .= $result;
			}

			// $_SESSION["registered"] = true;
		}

		echo json_encode($res_str, JSON_UNESCAPED_UNICODE);
		$mysqli -> close();
	}
?>