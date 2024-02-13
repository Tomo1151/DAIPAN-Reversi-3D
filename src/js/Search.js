self.addEventListener('message', (e) => {
	console.log(e)
	self.postMessage(e.data);
});