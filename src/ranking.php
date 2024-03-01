<?php
	echo "Hello, world!";

	$mysqli = new mysqli('localhost', 'root', '', 'reversi_ranking_test');
	if (mysqli_connect_error()) {
		die("connection failed");
	} else {
		$q = "SELECT * FROM Users";
		$stmt = $mysqli -> prepare($q);
		$stmt -> execute();
		$stmt -> bind_result($id, $name, $score, $mode, $result, $registered_at);
		if ($result == 0) {
			$result = "WON";
		} else if ($result == 1) {
			$result = "LOST";
		} else {
			$result = "DRAW";
		}

		$response = [];

		while($stmt -> fetch()) {
			$mode = $mode == 0 ? "normal" : "hotheaded";
			$result_str = "{$id}: {$name}, {$score}pts. MODE: {$mode}, {$registered_at} <br>";
			$result_data = [
				"id" => $id,
				"name" => $name,
				"score" => $score,
				"mode" => $mode,
				"result" => $result,
				"registered_at" => $registered_at
			];

			array_push($response, $result_data);

			echo $result_str;
		}
		echo json_encode($response, JSON_UNESCAPED_UNICODE);
	}
?>