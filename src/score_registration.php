<?php
	session_start();

	function var_dump_text($text) {
		ob_start();
		var_dump($text);
		$out_text = ob_get_contents();
		ob_end_clean();
		return $out_text;
	}

	// echo json_encode($res, JSON_UNESCAPED_UNICODE);
	// echo $res;

	if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
		// die(var_dump_text($_SESSION["id"]));
		die(json_encode("無効なセッション"));
	} else {
		$res = [
			'request' => $_POST['token'],
			'session' => $_SESSION['token']
		];
		echo json_encode("有効なセッション" . var_dump_text($res), JSON_UNESCAPED_UNICODE);
	}
?>