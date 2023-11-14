import GameManager from "./game_manager_.js";
import { Disk, Board } from "./object.js";
import Player from "./player.js";
import Enemy from "./enemy.js";

console.log("Hello, world!");

// const board = new Board(8, 8);
// const player = new Player(Disk.WHITE);
// const enemy = new Enemy(Disk.BLACK);
// const gm = new GameManager([player, enemy]);

const game_manager = new GameManager();
game_manager.run();
