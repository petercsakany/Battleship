/**
 * Created by Peti on 05/03/2017.
 */

(function () {
    var view = {
        diplayMessage: function (msg) {
            var messageArea = document.getElementById("messageArea");
            messageArea.innerHTML = msg;
        },
        displayHit: function (location) {
            var cell = document.getElementById(location);
            cell.setAttribute("class", "hit");
        },
        displayMiss: function (location) {
            var cell = document.getElementById(location);
            cell.setAttribute("class", "miss");
        },
        displaySunk: function (ship) {
            for (var i = 0; i < ship.locations.length; i++) {
                var cell = document.getElementById(ship.locations[i]);
                cell.setAttribute("class", "sunk");
            }
        }
    };

    var model = {
        boardSize: 7,
        numShips: 3,
        shipLength: 3,
        shipsSunk: 0,
        gameOver: false,

        ships: (function () {
            var shipList = [
                {locations: [0, 0, 0], hits: ["", "", ""]},
                {locations: [0, 0, 0], hits: ["", "", ""]},
                {locations: [0, 0, 0], hits: ["", "", ""]}
            ];
            return {
                getShip: function (index) {
                    return shipList[index];
                },
                getLocIndexOf: function (shipIndex, locIndex) {
                    return shipList[shipIndex].locations.indexOf(locIndex);
                },
                getShipHits: function (shipIndex) {
                    return shipList[shipIndex].hits;
                },
                setShipLoc: function (shipIndex, locations) {
                    shipList[shipIndex].locations = locations;
                },
                setShipHit: function (shipIndex, hitIndex) {
                    shipList[shipIndex].hits[hitIndex] = "hit";
                }
            };
        }()),

        generateShipLocations: function () {
            var locations;
            for (var i = 0; i < this.numShips; i++) {
                do {
                    locations = this.generateShip();
                } while (this.collision(locations));
                this.ships.setShipLoc(i, locations);
            }
        },

        generateShip: function () {
            var direction = Math.floor(Math.random() * 2);
            var row;
            var col;
            if (direction === 1) {
                row = Math.floor(Math.random() * this.boardSize);
                col = Math.floor(Math.random() * (this.boardSize - (this.shipLength + 1)));
            }
            else {
                col = Math.floor(Math.random() * this.boardSize);
                row = Math.floor(Math.random() * (this.boardSize - (this.shipLength + 1)));
            }

            var newShipLocations = [];
            for (var i = 0; i < this.shipLength; i++) {
                if (direction === 1) {
                    newShipLocations.push(row + "" + (col + i));
                }
                else {
                    newShipLocations.push((row + i) + "" + col);
                }
            }
            return newShipLocations;
        },

        collision: function (locations) {
            for (var i = 0; i < this.numShips; i++) {
                for (var j = 0; j < locations.length; j++) {
                    if (model.ships.getLocIndexOf(i, locations[j]) >= 0) {
                        return true;
                    }
                }
            }
            return false;
        },

        fire: function (guess) {
            for (var i = 0; i < this.numShips; i++) {
                var ship = this.ships.getShip(i);
                var index = this.ships.getLocIndexOf(i, guess);
                if (index >= 0) {
                    this.ships.setShipHit(i, index);
                    this.playSound("hit.mp3");
                    view.displayHit(guess);
                    view.diplayMessage("HIT!");
                    if (this.isSunk(this.ships.getShipHits(i))) {
                        this.shipsSunk++;

                        if (this.shipsSunk === 3) {
                            this.playSound("g_over.mp3");
                        }
                        else {
                            this.playSound("sunk.mp3");
                        }

                        view.displaySunk(ship);
                        var msg = "You sank a squadron of battleships! " + (this.numShips - this.shipsSunk) + " squadron left to find.";
                        view.diplayMessage(msg);
                    }
                    return true;
                }
            }
            view.displayMiss(guess);
            this.playSound("miss.mp3");
            view.diplayMessage("You missed.");
            return false;
        },

        isSunk: function (shipHits) {
            for (var i = 0; i < this.shipLength; i++) {
                if (shipHits[i] !== "hit") {
                    return false;
                }
            }
            return true;
        },

        playSound: function (sound) {
            var audio = new Audio(sound);
            audio.play();
        }
    };

    var controller = {
        guesses: 0,
        guessedLocations: [],
        isCellClicked: false,

        processGuess: function (guess) {
            var location = this.parseGuess(guess);

            if (location) {
                this.guesses++;
                var hit = model.fire(location);

                if (hit && model.shipsSunk === model.numShips) {
                    view.diplayMessage("Game Over! You sank all the fleet, in " + this.guesses + " guesses!");
                    model.gameOver = true;
                }
            }
        },
        parseGuess: function (guess) {
            var alphabet = ["A", "B", "C", "D", "E", "F", "G"];
            var search = "^[" + alphabet[0] + "-" + alphabet[model.boardSize - 1] + "]" + "[0-" + (model.boardSize - 1) + "]$";
            var regex = new RegExp(search);
            var location;

            if (model.gameOver) {
                alert("The game is over! Please reload the page to start again.")
            }
            else if (!guess.match(regex) && !this.isCellClicked) {
                alert("Ooops, please enter a valid letter and number from the board.");
            }
            else {
                if (!this.isCellClicked) {
                    var firstChar = guess.charAt(0);
                    var row = alphabet.indexOf(firstChar);
                    var column = guess.charAt(1);
                    location = row + column;
                }
                else {
                    location = guess;
                }

                for (var i = 0; i < this.guessedLocations.length; i++) {
                    if (this.guessedLocations[i] === location) {
                        alert("You already guessed this location!");
                        return null;
                    }
                }
                this.guessedLocations.push(location);
                return location;
            }
            return null;
        }
    };

    function init() {
        var fireButton = document.getElementById("fireButton");
        fireButton.onclick = handleFireButton;
        var guessInput = document.getElementById("guessInput");
        guessInput.onkeypress = handleKeyPress;
        handleMouseClick();

        model.generateShipLocations();
    }

    function handleFireButton() {
        var guessInput = document.getElementById("guessInput");
        var guess = guessInput.value;
        controller.isCellClicked = false;
        controller.processGuess(guess);

        guessInput.value = "";
    }

    function handleKeyPress(e) {
        var fireButton = document.getElementById("fireButton");
        if (e.keyCode === 13) {
            fireButton.click();
            return false;
        }
    }

    function handleMouseClick() {
        var table = document.getElementById("table");
        if (table != null) {
            for (var i = 0; i < table.rows.length; i++) {
                for (var j = 0; j < table.rows[i].cells.length; j++) {
                    var guess = table.rows[i].cells[j].getAttribute("id");
                    table.rows[i].cells[j].onclick = function () {
                        controller.isCellClicked = true;
                        controller.processGuess(this.getAttribute("id"));
                    };
                }
            }
        }
    }

    init();
}());
