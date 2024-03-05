export default class Logger {
	#log_max = 8;
	#log_stuck = [];
	#logDOM;
	#display = false;
	#enabled = false;

	constructor(logDOM) {
		this.#logDOM = logDOM;
	}

	log(log_message) {
		if (!this.#display) return;

		let bottom = 0;
		let overflow = false;
		for (let el of this.#logDOM.children) {
			if (this.#logDOM.getClientRects()[0].bottom - el.getClientRects()[0].bottom < 18.5) overflow = true;
		}

		const p = document.createElement('p');
		const date = new Date();
		const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${String(date.getMilliseconds()).slice(-2)}`;
		const logContent = document.createTextNode(`${time} -> ${log_message}`);
		p.appendChild(logContent);

		this.#log_stuck.push(log_message);
		if (overflow) {
			// console.log(this.#logDOM.children[1]);
			this.#logDOM.removeChild(this.#logDOM.children[1]);
		}
		this.#logDOM.appendChild(p);
	}

	on() {
		this.#logDOM.style.display = "block";
		this.#display = true;
	}

	off() {
		this.#logDOM.style.display = 'none';
		this.#display = false;
	}

	update(){}

	set enabled(enabled) {this.#enabled = enabled;}
}