// A pure JavaScript scalable and responsive tetris knockoff. 
//
// Saves top score in local storage, making it available after restarting session.
//
// Some optional animation and styling made it bulkier than if using separate CSS sheet,
// but the idea was to deliver it in a single file
//
// Rotation function is simplified, and basically just prevents itself if there is an obstacle
// on either side of the active game piece. You might want to check link below if you want to
// implement a more flexible rotation system:
// https://tech.migge.io/2017/02/07/tetris-rotations/
//
// Sprites are customisable, just make sure max width remains 
//
// GitHub rep:
// https://github.com/ConstantineNam/tetris
//
// Created by:
// https://constantinenam.com

// color palette
palette = { wall: "#353535",
            bottom: "#353535",
            sprite: "#F9A825",
            background: "#1A1A1A",
            structure: "#00838F",
            body: "#1A1A1A",
            text: "#FAFAFA"
          };

// tetris sprites stored in 4x4 two-dimensial-array tile, 
let spriteA = [0,0,0,0,       // 0`s represent empty space
               0,1,1,0,
               0,1,1,0,        // 1`s represent filled squares
               0,0,0,0],      

    spriteB = [0,0,0,0,
               0,1,1,1,
               0,0,0,0,
               0,0,0,0],  

    spriteC = [0,0,0,0,
               0,0,1,1,
               0,1,1,0,
               0,0,0,0],  

    spriteD = [0,0,0,0,
               0,1,1,0,
               0,0,1,1,
               0,0,0,0],  

    spriteE = [0,0,0,0,
               0,1,1,1,
               0,1,0,0,
               0,0,0,0], 

    spriteF = [0,0,0,0,
               0,1,1,1,
               0,0,0,1,
               0,0,0,0],  

    spriteG = [0,0,0,0,
               0,1,1,1,
               0,0,1,0,
               0,0,0,0];  

// array that stores all the sprites
let sprites = [spriteA, spriteB, spriteC, spriteD, spriteE, spriteF, spriteG];

let tileSize = 3.75,            //  tile size in vw - ensures responsive sizing of the game
    boardWidth = 14,            // board width in tiles
    boardHeight = 25,           // board heightin tiles     
    gameSpeed = 750,           // game speed in ms - the lower the faster
    score = 0;                  // initial score

// initial state of board as a one-dementional array of 0`s
let board = new Array(boardHeight).fill(0);

// function to add tile styling 
const addTileStyle = (tile) => {
    tile.style.boxSizing = "border-box";
    tile.style.borderRadius = "10%"; 
    tile.style.border = "1px solid #0D0D0D";
}

window.onload = () => {
    // some extra styling
    document.body.style.backgroundColor = palette.body;
    document.body.style.fontFamily = "Lucida Console";

    // configuring board
    for (let x = 0; x < boardWidth; x++) {
        // adding "vertical"  lines (arrays of 0`s)
        board[x] = new Array( boardHeight ).fill(0);
        // drawing the bottom with 2`s
        board[x][boardHeight - 1] = 2;
    };

    // drawing the walls with 1`s
    for (let y = 0; y < boardHeight; y++) {
        board[0][y] = 1;
        board[boardWidth - 1][y] = 1;
    };

    // Rendering board in browser as HTML
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            // creating tile as a div
            let tile = document.createElement("div");
            
            // adding a unique id with its own coordinates to each div
            tile.setAttribute("id", "tetris__tile-x" + x + "y" + y);

            // styling tile
            addTileStyle(tile);

            // setting tile"s size 
            tile.style.width = tileSize + "vh";
            tile.style.height = tileSize + "vh";

            // placing each tile on board in a proper position:
            tile.style.position = "absolute";      
            tile.style.left = x * tileSize + "vh";  
            tile.style.top = y * tileSize + "vh";   
            // tile.style.zIndex = 0;
            
            let tileType = board[x][y];
            if (tileType == 0) 
                tile.style.background = palette.background; // blank tiles color
            if (tileType == 1) 
                tile.style.background = palette.wall;       // wall tiles color
            if (tileType == 2) 
                tile.style.background = palette.bottom;     //  bottom tiles color

            document.body.appendChild(tile);
        };
    };

    gameReset();

    // sprite movement consisting of several steps:
    setInterval(() => {
        // refreshing all 0`s and turn into background tiles
        refreshTiles();         
        
        // if no obstacle beneath, move sprite down
        if (!checkForBarrier("down")) {
            spritePosition.y += 1; // not using pushSpriteDown() to preserve the score
        };
        
        // render sprite according to its position
        renderSprite();

    }, gameSpeed);
};


// choosing a returning a random sprite from the array of sprites
const createRandomSprite = () => {
    let randomNumber = Math.floor((Math.random() * sprites.length));

    return [...sprites[randomNumber]];
};

// creating active sprite that will be controlled with keyboard
let activeSprite = createRandomSprite();

// creating upcoming sprite
let upcomingSprite = createRandomSprite();

// rendering a container with the upcoming falling sprite
let index = 0;
for (let y = 0; y < 4; y++) {       // "y" is container"s height
    for (let x = 0; x < 4; x++, index++) {   // "x" is container"s width

        // creating, id"ing and positioning tiles the same way as the board
        let tile = document.createElement("div");
        tile.style.width = tileSize + "vh";
        tile.style.height = tileSize + "vh";
        tile.setAttribute("id", "tetris__upcoming-" + index);

        tile.style.position = "absolute";

        // setting position absolute to the hierarchically closest relative parent
        tile.style.left = boardWidth * tileSize + (x * tileSize) + tileSize + "vh";
        tile.style.top = 0 + y * tileSize + "vh";
        tile.style.backgroundColor = palette.background 
        // styling tile
        addTileStyle(tile);

        document.body.appendChild(tile);
    };
};

// rendering sprite inside upcoming container
const renderUpcoming = () => {
    for (let i = 0; i < 16; i++) {
        let tile = document.getElementById("tetris__upcoming-" + i);
        upcomingSprite[i] == 1 ? 
            tile.style.backgroundColor = palette.sprite :
            tile.style.backgroundColor = palette.background;
    };
};

//  create and default position the active sprite
let spritePosition = { x: Math.round(boardWidth / 2) - 2,  // centering sprite
                       y: -1                               // bringing it down by sprite"s height
                     };

const resetSpritePosition = () => {
    spritePosition = { x: Math.round(boardWidth / 2) - 2, 
                       y: -1            
                     };
};

// full board reset
const resetBoard = () => {
    // quering X coordinate
    for (let x = 1; x < boardWidth - 1; x++) {
        // quering Y coordinate
        for (let y = 0; y < boardHeight - 1; y++) {
            let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
            // declaring all tiles as 0`s (except walls and bottom)
            board[x][y] = 0;
            tile.style.backgroundColor = palette.background;
        };
    };
    // creating new active and upcoming sprite, resetting position to default
    activeSprite = createRandomSprite();
    upcomingSprite = createRandomSprite();
    renderUpcoming()
    spritePosition = { x: Math.round(boardWidth / 2) - 2,  
                       y: -2                  
                     };
};

// using local storage to keep top score; if doesnt exist - set to 0
localStorage['topScore'] = localStorage['topScore'] || 0;

// full game reset
const gameReset = () => {
    resetBoard();
    renderScoreBoard();
    // updating top score if its higher than the prev one
    let storedTopScore = localStorage['topScore'];
    if (storedTopScore && score > storedTopScore) {
        localStorage['topScore'] = score;
    }
    // updating top score on score board
    document.getElementById("tetris__top-score").innerHTML = "Top: " + localStorage["topScore"] || 0;
    // resetting session score to 0
    score = 0;
};

// keyboard controls
document.addEventListener("keydown", e => {
    let key = e.code
   
    refreshTiles();
    
    // checking if there is no barrier before moving sprite
    switch (key) {
        case "ArrowLeft":
            if (!checkForBarrier("left")) pushSpriteLeft();
            break;
        case "ArrowRight":
            if (!checkForBarrier("right")) pushSpriteRight();
            break;
        case "ArrowDown":
            if (!checkForBarrier("down")) pushSpriteDown();
            break;
        case "ArrowUp":
            // bringing sprite max down
            while (checkForBarrier("down") == false) {
                pushSpriteDown();
            }
            break;
        default:
            // not the best rotation mechanism, but overall prevents sprite colliding with other structures
            if (!checkForBarrier("left") && !checkForBarrier("right") && !checkForBarrier("down")) {
                rotateSprite();
            }
    };
   
    renderSprite();
})

const pushSpriteDown = () => {
    spritePosition.y += 1;
    // adding extra score for speeding up the game
    scoreCalc(0); 
};

const pushSpriteLeft = () => {
    spritePosition.x -=1;
};

const pushSpriteRight = () => {
    spritePosition.x += 1;
};

const placeSprite = () => {
    build();                                // build current tetromino onto the well
    scanTopRow();                           // end game if structures reaches top line
    scanRows();                             // clear rows if full
    activeSprite = [...upcomingSprite];     // swap current and upcoming sprite
    upcomingSprite = createRandomSprite();  // generate next sprite
    renderUpcoming();                       // update upcoming container
    resetSpritePosition();                  // reset active sprite position
};

const rotateSprite = () => {
    let activeSpriteCopy = [...activeSprite];
    // visual map on how sprite layout will look like after rotating
    let map = [ 3, 7, 11, 15,
                2, 6, 10, 14,
                1, 5, 9,  13,
                0, 4, 8,  12 ];
    activeSprite.fill(0);
    for (let i = 0; i < 16; i++) {
        activeSprite[i] = activeSpriteCopy[map[i]];
    }
};

// scans the board and returns coordinates of tiles with 1
const scanBoard = () => {
    // array that will contain all coordinates of tiles with 1
    let coordinates = [];    
    // index for the tiles found after quering Y and X 
    let i = 0;
    // quering Y coordinate
    for (let y = spritePosition.y; y < spritePosition.y + 4; y++) {
        // quering X coordinate
        for (let x = spritePosition.x; x < spritePosition.x + 4; x++, i++) {
            
            if (activeSprite[i] == 1) {
                // checking if such a tile exists as an HTML div 
                let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
                // and finally pushing coordinates of each tile with 1 as an array
                if (tile) {
                    coordinates.push([x,y]) 
                };
            };
        };
    };

    return(coordinates)
};

// "builds" structure tiles (those with index 3) on board
const build = () => {
    scanBoard().map((xy) => {
        let x = xy[0];
        let y = xy[1];
        let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
        
        board[x][y] = 3;
        tile.style.backgroundColor = palette.structure;
    })
};

// renders sprite on the board; used for both initial render and further movement on the board
const renderSprite = () => {
    scanBoard().map((xy) => {
        let x = xy[0];
        let y = xy[1];
        let tile = document.getElementById("tetris__tile-x" + x + "y" + y);

        tile.style.backgroundColor = palette.sprite;
    })
};

// checking if there is a wall/bottom in the direction sprite was requested to move to, returns boolean
// this somehow wouldnt work with scanBoard(), will have to optimize later
const checkForBarrier = (direction) => {
    let index = 0;

    for (let y = spritePosition.y; y < spritePosition.y + 4; y++) {
        for (let x = spritePosition.x; x < spritePosition.x + 4; x++, index++) {
            if (activeSprite[index] == 1) {

                let tile = document.getElementById("tetris__tile-x" + x + "y" + y);

                // reference to the tile below the current tile 
                let tileBelow = board[x][y + 1];
                let tileToLeft = board[x - 1][y];
                let tileToRight = board[x + 1][y];
           
                if (tile) {
                    // returns true if hitting left wall
                    if ( direction == "left" && (tileToLeft == 1 || tileToLeft == 3) ) {
                        return true;
                    };
                    // returns true if the 
                    if (direction == "right" && (tileToRight == 1 || tileToRight == 3) ) {
                        return true;
                    };
                    // returns true if hitting bottom, and places sprite at the bottom
                    if (direction == "down" && (tileBelow == 3 || tileBelow == 2) ) {
                        placeSprite();
                        return true;
                    };
                };
            };
        };
    };
    return false;
};

// refreshing all 0"s to background 
const refreshTiles = () => {
    scanBoard().map((xy) => {
        let x = xy[0];
        let y = xy[1];
        let tile = document.getElementById("tetris__tile-x" + x + "y" + y);

        // excluding walls
        if (x == 0 || x == boardWidth - 1 ) {
            tile.style.backgroundColor = palette.wall; 
        } else {
            tile.style.backgroundColor = palette.background;
        };
    })
};

// scanning board rows to check if any are full 
const scanRows = () => {
    // counting home many rows are cleaned
    let clearedRows = 0;

    // looping through each row (except bottom line)
    for (let y = 0; y < boardHeight - 1; y++) {
       
        let row = []

            // looping through each tile in a row (except walls)
            for (let x = 1; x < boardWidth - 1; x++) { 
                // pushing appropriate tile index by getting it from coordinates on board
                let ref = board[x][y]
                row.push(ref)
            };

        // if any row is full of tiles with index 3, clear that row by passing Y coordinate..
        // .. to clearRow() function
        if (row.every( tileIndex => tileIndex === 3 )) {
            clearedRows += 1;
            clearRow(y);
            pushRowsDown(y);
        };
    };

    if (clearedRows > 0) {
        scoreCalc(clearedRows)
    };
};

// scanning top line to end the game once structure reaches it
const scanTopRow = () => {
    let topRow = []
    // looping through each column 
    for (let x = 0; x < boardWidth - 1; x++) {
        let ref = board[x][1]
        topRow.push(ref)
    };
    // checking if any of the tiles at the top row include structure tile
    if (topRow.includes(3)) {
        // if yes, reset the game
        gameReset();
    };
};

// create score board, using on window load or game reset
const renderScoreBoard = () => {
    // creating, id`ing and positioning top and session score
    let sessionScore = document.createElement("p"),
        topScore = document.createElement("p");

    sessionScore.setAttribute("id", "tetris__session-score");
    sessionScore.style.position = "absolute";
    sessionScore.style.color = palette.text;
    sessionScore.style.left = boardWidth * tileSize + tileSize + "vh";
    sessionScore.style.top = 7 * tileSize + "vh";

    topScore.setAttribute("id", "tetris__top-score");
    topScore.style.position = "absolute";
    topScore.style.color = palette.text;
    topScore.style.left = boardWidth * tileSize + tileSize + "vh";
    topScore.style.top = 5 * tileSize + "vh";

    document.body.appendChild(sessionScore);
    document.body.appendChild(topScore);

    document.getElementById("tetris__session-score").innerHTML = "Score: 0";
    document.getElementById("tetris__top-score").innerHTML = "Top: " + localStorage["topScore"] || 0;
};

// adding total score depending on number of rows cleared
const scoreCalc = (clearedRows) => {
    switch (clearedRows) {
        case 1:
            score += 1000
            break;
        case 2:
            score += 2500
            break;
        case 3:
            score += 5000
            break;
        default:
            score +=5;
            
    };
    document.getElementById("tetris__session-score").innerHTML = "Score: " + score.toString();
};

// clearing row full of tile with index 3
const clearRow = (y) => {

    for (let x = 1; x < boardWidth - 1; x++) {
        let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
        clearAnimation(tile, x, y)
        board[x][y] = 0;
        tile.style.backgroundColor = palette.background;
    };
};

// animation for clearRow()
const clearAnimation = (tileId, x, y) => {
    for (let i = 0; i < 4; i ++) {
        // for each tile creating 4 "shards"
        let shard = document.createElement("div");
        // adding id to refer to shard later
        let shardId = "tetris__shard-x" + x + i + "y" + y + i
        shard.setAttribute("id", shardId);
        // basic styling
        shard.style.position = "absolute";
        shard.style.width = (tileSize / 2) + "vh";
        shard.style.height = (tileSize / 2) + "vh";
        shard.style.borderRadius = "10%";
        shard.style.backgroundColor = palette.structure 
        shard.style.zIndex = 1;

        // positioning each shard to one of the tile corners
        switch (i) {
            case 0:
                shard.style.left = 0;
                shard.style.top = 0;
                break;
            case 1:
                shard.style.right = 0;
                shard.style.top = 0;
                break;
            case 2:
                shard.style.right = 0;
                shard.style.bottom = 0;
                break;
            case 3:
                shard.style.left = 0;
                shard.style.bottom = 0;
                break;
        }

        const randomNumber = (min,max) => {
            return Math.floor((Math.random() * (max -min) + min));
        }
        // creating random position in pixels for shard
        let rndm = randomNumber(-tileSize*2, tileSize*2) + "vh," + randomNumber(-tileSize*2, tileSize*2) + "vh"

        // appending shard to the tile
        tileId.appendChild(shard);

        let shardRef = document.getElementById(shardId);   

        // animation style
        let anim = [
            { transform: "translate(0)",
              opacity: 1},
            { transform: `translate(${rndm})`,
              opacity: -1}
        ];
        // animation speed and duration
        let animTiming = {
            duration: 275,
            iterations: Infinity
          }

        shardRef.animate(
            anim,
            animTiming
        )
        // delete shard from DOM; timeout is a bit shorter than anim duration to prevent anim replay 
        setTimeout(() => {
            shardRef.remove()
        }, 250);
    }
}

// pushing down rows that are above the cleared row
const pushRowsDown = (y) => {
    // looping through each column 
    for (let x = 1; x < boardWidth - 1; x++) {
        
        // "shifting down" an entire column by:
        board[x].splice(y, 1);              // 1) removing last index tile
        board[x].splice(0, 0, 0);           // 2) adding 0 index tile at front

        // looping through each row and further refreshing board look
        for (let y = 0; y < boardHeight - 1; y++) {
            let tile = document.getElementById("tetris__tile-x" + x + "y" + y);

            if (board[x][y] == 0) {
                tile.style.backgroundColor = palette.background;
            }
            else {
                tile.style.backgroundColor = palette.structure;
            };
        };
    };
};