<?php
	// echo "Hello, world!<br>";

	$mysqli = new mysqli('localhost', 'root', '', 'reversi_ranking_test');
	$data_0 = [];
	$data_1 = [];

	if ($mysqli->connect_error) {
	// if (true) {
		die(json_encode("connection failed"));
	} else {
		$q = "SELECT * FROM Users WHERE mode = 0";
		$stmt = $mysqli -> prepare($q);
		$stmt -> execute();
		$stmt -> bind_result($id, $name, $score, $mode, $result, $registered_at);

		while($stmt -> fetch()) {
			$result_data = [
				"id" => $id,
				"name" => $name,
				"score" => $score,
				"mode" => $mode,
				"result" => $result,
				"registered_at" => $registered_at
			];

			array_push($data_0, $result_data);
		}

		$q = "SELECT * FROM Users WHERE mode = 1";
		$stmt = $mysqli -> prepare($q);
		$stmt -> execute();
		$stmt -> bind_result($id, $name, $score, $mode, $result, $registered_at);

		while($stmt -> fetch()) {
			$result_data = [
				"id" => $id,
				"name" => $name,
				"score" => $score,
				"mode" => $mode,
				"result" => $result,
				"registered_at" => $registered_at
			];

			array_push($data_1, $result_data);

		}

		$response = [
			0 => $data_0,
			1 => $data_1
		];
		echo json_encode($response, JSON_UNESCAPED_UNICODE);
	}
?>