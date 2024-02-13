async function sleep(ms) {
	return new Promise(res => setInterval(res, ms));
}

function isEmpty(object) {
	if (object == null) return true;
	if (object == undefined) return true;
	return Object.keys(object).length === 0
}

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

export { sleep, isEmpty, getRandomInt};