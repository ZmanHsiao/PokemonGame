// Name: Zachary Hsiao
// Date: 5-9-2018
// Section: CSE 154 AJ
// Javascript file controlling the event handling on the pokedex page. Creates a
// Pokedex containing our owned Pokemon. Creates the Battle experience if we choose
// one of our Pokemon. Randomly battles a Pokemon, and if we win, add that Pokemon to 
// our collection. Gotta Catch Em All!!

"use strict";
/* global fetch */

(function() {

	let guid; // Game instance ID
	let pid; // Player instance ID
	let originalHP; //Current Selected Pokemone Original HP
	const BASE_URL = "https://webster.cs.washington.edu/pokedex/";
	const START_POKE = ['Bulbasaur', 'Charmander', 'Squirtle'];


	/*
   	 * On load, fetches the pokedex
   	 */
   	 window.onload = function() {
   	 	fetchPokedex();
   	 	$("start-btn").onclick = startGame;
   	 };

	/*
   	 * Retrieves the pokedex data for all the pokemon
   	 */
   	 function fetchPokedex() {
   	 	let url = BASE_URL + "pokedex.php?pokedex=all";
   	 	fetch (url, {mode: 'cors'})
   	 	.then(checkStatus)
   	 	.then(displayPokedex)
   	 	.catch(catchError);
   	 }

	/*
   	 * Displays the pokemon in the pokedex;
   	 * @param String containing the pokemon in pokedex and their images
   	 */
   	 function displayPokedex(pokedex) {
   	 	let pokemonCollection = pokedex.split("\n");
   	 	for (let i = 0; i < pokemonCollection.length; i++) {
   	 		let pokemon = pokemonCollection[i].split(":");
   	 		createPokemon(pokemon[0], pokemon[1]);
   	 	}
   	 	
   	 }

	/*
   	 * Creates the image for the pokemon in pokedex
   	 * Sets class found to initial pokemon that are found
   	 * @param name and picture for each pokemon
   	 */
   	 function createPokemon(name, pic) {
   	 	let img = document.createElement("img");
   	 	img.src = BASE_URL + "sprites/" + pic;
   	 	img.id = name;
   	 	img.classList.add("sprite");
   	 	$("pokedex-view").appendChild(img);
   	 	if (name == START_POKE[0] || name == START_POKE[1] || name == START_POKE[2]){
   	 		img.classList.add("found");
   	 		img.onclick = fetchMyPokemonData;
   	 	}
   	 }

	/*
   	 * AJAX call to retrieve the selected Pokemon's data
   	 * Also enables the start button to choose the Pokemon
   	 * @param Current Pokemon selected
   	 */
   	 function fetchMyPokemonData() {
   	 	let url = BASE_URL + "pokedex.php?pokemon=" + this.id;
   	 	fetch (url, {mode: 'cors'})
   	 	.then(checkStatus)
   	 	.then(JSON.parse)
   	 	.then(function(data) {
   	 		displayPokemonData(data, "#my-card");
   	 		$("start-btn").classList.remove("hidden");
   	 	})
   	 	.catch(catchError);
   	 }

	/*
   	 * Displays the pokemon Data for the pokemon selected
   	 * Including: Name, type, weakness, moves, image
   	 * @param JSON data for the selected pokemon
   	 */
   	 function displayPokemonData(pokeData, card) {
   	 	qs(card + " .name").innerHTML = pokeData.name;
   	 	qs(card + " .type").src = BASE_URL + pokeData.images.typeIcon;
   	 	qs(card + " .weakness").src = BASE_URL + pokeData.images.weaknessIcon;
   	 	qs(card + " .pokepic").src = BASE_URL + pokeData.images.photo;
   	 	qs(card + " .hp").innerHTML = pokeData.hp + "HP";
   	 	qs(card + " .info").innerHTML = pokeData.info.description;
   	 	setMoves(card, pokeData.moves);
   	 }

	/*
   	 * Sets the moves on the Pokemon card for the selected pokemon
   	 * If the pokemon has less than 4 moves, remove the additional buttons
   	 * @param Moves array for the selected pokemon
   	 */
   	 function setMoves(card, moves) {
   	 	let moveSlots = document.querySelectorAll(card + " .move");
   	 	let moveType = document.querySelectorAll(card + " .moves img");
   	 	let dpSlot = document.querySelectorAll(card + " .dp");
   	 	let buttons = document.querySelectorAll(card + " .moves button");
   	 	for (let i = 0; i < 4; i++) {
   	 		if (i < moves.length) {
   	 			buttons[i].classList.remove("hidden");
   	 			moveSlots[i].innerHTML = moves[i].name;
   	 			moveType[i].src = BASE_URL + "icons/" + moves[i].type + ".jpg";
   	 			if (moves[i].dp !== undefined) {
   	 				dpSlot[i].innerHTML = moves[i].dp + "DP";
   	 			} else {
   	 				dpSlot[i].innerHTML = "";
   	 			}
   	 		} else {
   	 			buttons[i].classList.add("hidden");
   	 		}
   	 	}
   	 }

	/*
   	 * Starts the game and sets the appropriate display.
   	 * Brings up the opponents card and other game display, 
   	 * and removes the pokedex display.
   	 * Sets global variable originalHP
   	 */
   	 function startGame() {
   	 	originalHP = parseInt(qs("#my-card .hp").innerHTML);
   	 	$("pokedex-view").classList.add("hidden");
   	 	$("their-card").classList.remove("hidden");
   	 	qs("#my-card .hp-info").classList.remove("hidden");
   	 	$("results-container").classList.remove("hidden");
   	 	changeButtonStatus();
   	 	$("start-btn").classList.add("hidden");
   	 	$("flee-btn").classList.remove("hidden");
   	 	$("flee-btn").disabled = false;
   	 	$("title").innerHTML = "Pokemon Battle Mode!";
   	 	qs("#my-card .buffs").classList.remove("hidden");
   	 	fetchGameState();
   	 }

	/*
   	 * AJAX POST request to get the current game after a pokemon is chosen.
   	 */
   	 function fetchGameState() {
   	 	let url = BASE_URL + "game.php";
   	 	let data = new FormData();
   	 	data.append("startgame", true);
   	 	data.append("mypokemon", qs("#my-card .name").innerHTML);
   	 	fetch(url, {method: "POST", body: data, credential:"include"})
   	 	.then(checkStatus)
   	 	.then(JSON.parse)
   	 	.then(setGame)
   	 	.catch(catchError);
   	 }


	/*
   	 * Sets up the game by displaying the opponent's card 
   	 * and sets up the onclick event handlers for our moves.
   	 * Sets the pid and guid for the instance of the game.
   	 * @param JSON data for the game instance
   	 */
   	 function setGame(data) {
   	 	guid = data.guid;
   	 	pid = data.pid;
   	 	displayPokemonData(data.p2, "#their-card");
   	 	let myMoves = document.querySelectorAll("#my-card .moves button");
   	 	for (let i = 0; i < myMoves.length; i++) {
   	 		myMoves[i].onclick = function() {
   	 			let move = this.childNodes[1].innerHTML.toLowerCase().replace(/\s/g, "");
   	 			playMove(move);
   	 		};
   	 	}
   	 	$("flee-btn").onclick = function() {
   	 		playMove("flee");
   	 	};
   	 }

	/*
   	 * AJAX POST request to receive the state of the game after
   	 * the selected move has been played.
   	 * @param Selected move to be played
   	 */
   	 function playMove(move) {
   	 	$("loading").classList.remove("hidden");
   	 	let url = BASE_URL + "game.php";
   	 	let data = new FormData();
   	 	data.append("move", move);
   	 	data.append("guid", guid);
   	 	data.append("pid", pid);
   	 	fetch(url, {method: "POST", body: data, credential:"include"})
   	 	.then(checkStatus)
   	 	.then(JSON.parse)
   	 	.then(battleResults)
   	 	.catch(catchError);
   	 }

	/*
   	 * Sets the state of the game after the move has been selected.
   	 * @param JSON data for the battle resutls
   	 */
   	 function battleResults(battleRes) {
   	 	$("loading").classList.add("hidden");
   	 	textBattle(battleRes.results);
   	 	damageResult("#my-card", battleRes.p1["current-hp"], battleRes.p1["hp"]);
   	 	damageResult("#their-card",  battleRes.p2["current-hp"], battleRes.p2["hp"]);
   	 	buffResult("#my-card", battleRes.p1.buffs, "buff");
   	 	buffResult("#my-card", battleRes.p1.debuffs, "debuff");
   	 	buffResult("#their-card", battleRes.p2.buffs, "buff");
   	 	buffResult("#their-card", battleRes.p2.debuffs, "debuff");
   	 	checkVictory(battleRes.p1["current-hp"], battleRes.p2["current-hp"]);
   	 }

	/*
   	 * Displays the text results for the battle.
   	 * @param Move results for the players
   	 */
   	 function textBattle(results) {
   	 	$("p1-turn-results").classList.remove("hidden");
   	 	$("p2-turn-results").classList.remove("hidden");
   	 	$("p1-turn-results").innerHTML = "Player 1 played " + results["p1-move"] + 
   	 	" and " + results["p1-result"] + "!";
   	 	$("p2-turn-results").innerHTML = "Player 2 played " + results["p2-move"] + 
   	 	" and " + results["p2-result"] + "!";
   	 	if (results["p2-move"] === null) {
   	 		$("p2-turn-results").classList.add("hidden");
   	 	}
   	 }

	/*
   	 * Sets the display of the HPs to match the battle results.
   	 * @param player card, currentHP of pokemon, and total HP
   	 */
   	 function damageResult(card, currentHP, hp) {
   	 	let percent = currentHP / hp * 100;
   	 	let healthbar = qs(card + " .health-bar");
   	 	healthbar.style.width = percent + "%";
   	 	qs(card + " .hp").innerHTML = currentHP + "HP";
   	 	if (percent < 20) {
   	 		healthbar.classList.add("low-health");
   	 	}
   	 }

	/*
   	 * Displays the buff information on the pokemon card
   	 * @param player card, buffs array, type of buff
   	 */
   	 function buffResult(card, buffs, type) {
   	 	let buffZone = qs(card + " .buffs");
   	 	let currentBuffs = document.querySelectorAll(card + " ." + type);
   	 	for (let i = currentBuffs.length; i < buffs.length; i++) {
   	 		let div = document.createElement("div");
   	 		div.classList.add(buffs[i]);
   	 		div.classList.add(type);
   	 		buffZone.appendChild(div);
   	 	}
   	 }

	/*
   	 * Checks to see if one of the Pokemon has won.
   	 * If so, set according text and initiate endgame state.
   	 * @param our pokemon HP, their pokemon HP
   	 */
   	 function checkVictory(myHP, theirHP) {
   	 	if (myHP == 0 || theirHP == 0) {
   	 		if (myHP == 0) {
   	 			$("title").innerHTML = "You lost!";
   	 		} else {
   	 			$("title").innerHTML = "You won!";
   	 			checkOwned();
   	 		}
   	 		changeButtonStatus();
   	 		$("flee-btn").disabled = true;
   	 		$("endgame").classList.remove("hidden");
   	 		$("endgame").onclick = endGame;
   	 	}
   	 }

	/*
   	 * Check if defeated pokemon is owned, if not
   	 * add to our pokedex with class found
   	 */
   	 function checkOwned() {
   	 	let theirPoke = $(qs("#their-card .name").innerHTML);
   	 	if (!theirPoke.classList.contains("found")) {
   	 		theirPoke.classList.add("found");
   	 		theirPoke.onclick = fetchMyPokemonData;
   	 	}
   	 }

	/*
   	 * Sets the end game display and reverts it back to the pokedex display.
   	 * Resets the visual state of the game.
   	 */
   	 function endGame() {
   	 	let healthbars = document.querySelectorAll(".health-bar");
   	 	let buffs = document.querySelectorAll(".buffs");
   	 	resetVisuals(healthbars[0], buffs[0]);
   	 	resetVisuals(healthbars[1], buffs[1]);
   	 	$("title").innerHTML = "Your Pokedex";
   	 	$("endgame").classList.add("hidden");
   	 	$("their-card").classList.add("hidden");
   	 	$("pokedex-view").classList.remove("hidden");
   	 	$("results-container").classList.add("hidden");
   	 	$("p1-turn-results").classList.add("hidden");
   	 	$("p2-turn-results").classList.add("hidden");
   	 	$("start-btn").classList.remove("hidden");
   	 	$("flee-btn").classList.add("hidden");
   	 	qs("#my-card .hp").innerHTML = originalHP + "HP";
   	 }

	/*
   	 * Resets the buff and healthbars to original position.
   	 */
   	 function resetVisuals(healthbar, buffs) {
   	 	healthbar.style.width = "100%";
   	 	healthbar.classList.remove("low-health");
   	 	buffs.innerHTML = "";
   	 	buffs.classList.add("hidden");
   	 }

	/**
     * Toggles the disabled of the move buttons as we switch between
     * battle and pokedoex modes.
     */
     function changeButtonStatus() {
     	let buttons = document.querySelectorAll("#my-card .card button");
     	for (let i = 0; i < buttons.length; i++) {
     		buttons[i].disabled = !buttons[i].disabled;
     	}
     }

	/**
     * Function to check the status of an Ajax call, boiler plate code to include,
     * based on: https://developers.google.com/web/updates/2015/03/introduction-to-fetch
     * @param the response text from the url call
     * @return did we succeed or not, so we know whether or not to continue with the handling of
     * this promise
     */
     function checkStatus(response) {
     	if (response.status >= 200 && response.status < 300) {
     		return response.text();
     	} else {
     		return Promise.reject(new Error(response.status +
     			": " + response.statusText));
     	}
     }

   	/*
   	 * If there is an error in the Ajax call, then send error message
   	 * @param error message
   	 */
   	 function catchError(error) {
   	 	console.log("Unable to retrieve data. " + error);
   	 }

   	/*
   	 * Returns the DOM element for the inputted ID
   	 * @param Takes in an ID
   	 * @return Returns the DOM element
   	 */
   	 function $(id) {
   	 	return document.getElementById(id);
   	 }

	/*
   	 * Returns the first DOM element for the inputted selector
   	 * @param Takes in a seletor
   	 * @return Returns the DOM element
   	 */
   	 function qs(selector) {
   	 	return document.querySelector(selector);
   	 }
   	 
   	})();