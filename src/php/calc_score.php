<?php
	session_start();
	if (!isset($_POST["token"]) || $_POST["token"] !== $_SESSION["token"]) {
		die(json_encode("無効なセッション"));
	} else {
		$id = session_id();
		echo json_encode("有効なセッション");
	}
?>