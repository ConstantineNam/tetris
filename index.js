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

// Game config
let boardWidth = 12,            // board width in tiles
    boardHeight = 20,           // board heightin tiles     
    tileSize = 100 / boardWidth,            //  tile size in vh - ensures responsive sizing of the game
    gameSpeed = 750;           // game speed in ms - the lower the faster

// color palette
palette = { border: "#353535",
            sprite: "#FBC02D",
            background: "#1A1A1A",
            structure: "#00838F",
            body: "#1A1A1A",
            text: "#FAFAFA",
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

// initial state of board as a one-dementional array of 0`s
let board = new Array(boardHeight).fill(0);

// random number generator with ability to set range
const getRndmNum = (min,max) => {
    return Math.floor((Math.random() * (max -min) + min));
}

// returning a random sprite from the list
const getRndmSprite = () => {
    return [...sprites[getRndmNum(0, sprites.length)]];
};

let activeSprite = getRndmSprite(),                             // declaring active sprite
    upcomingSprite = getRndmSprite(),                           // declaring upcoming sprite
    spritePosition = {x: Math.round(boardWidth / 2) - 2,y: -1}; // declaring active sprite position

let score = 0,                                      // initial score
    topScoreRef = localStorage['topScore'] || 0;    // using local storage to keep top score;

const build = () => {
    locateSprite().map((xy) => {
        let x = xy[0],
            y = xy[1],
            tile = document.getElementById("tetris__tile-x" + x + "y" + y);

        board[x][y] = 3;                                // turning sprite tile into structure tiles
        tile.style.backgroundColor = palette.structure; // coloring appropriately
    })
    recalculateScore(0); // adding extra score 
};

const checkIfGameOver = () => {
    let topRow = []
    for (let x = 0; x < boardWidth - 1; x++) {   // scanning top line
        let ref = board[x][1];                   // getting tile indexes
        topRow.push(ref);
    };
    if (topRow.includes(3)) {
        resetGame();                             // resetting game if there are structure tiles
    };
};

// checking if there is a wall/bottom in the direction sprite was requested to move to, returns boolean
// this somehow wouldnt work with locateSprite(), will have to optimize later
const checkForBarrier = (direction) => {
    let i = 0;  // index to loop through the sprite array
    for (let y = spritePosition.y; y < spritePosition.y + 4; y++) {
        for (let x = spritePosition.x; x < spritePosition.x + 4; x++, i++) {
            if (activeSprite[i] == 1) {

                let tileBelow = board[x][y + 1];
                let tileToLeft = board[x - 1][y];
                let tileToRight = board[x + 1][y];
           
                if ( direction == "left" && (tileToLeft == 1 || tileToLeft == 3)) return true;
                if (direction == "right" && (tileToRight == 1 || tileToRight == 3)) return true;
                if (direction == "down" && (tileBelow == 3 || tileBelow == 2) ) {
                    placeSprite();
                    return true;
                };
            };
        };
    };
    return false;
};

// clearing row full of tile with index 3
const clearRow = (y) => {
    for (let x = 1; x < boardWidth - 1; x++) {
        let tileRef = document.getElementById("tetris__tile-x" + x + "y" + y);
        // checks if optional animation is present in the code before firing (see end of file)
        if (typeof clearRowAnim === "function") clearRowAnim(tileRef, x, y); 
        board[x][y] = 0;
        tileRef.style.backgroundColor = palette.background;
    };
};

// scanning board rows to check if any are full 
const clearSolidRows = () => {
    let clearedRows = 0;                                // counting home many rows are cleaned to add score

    for (let y = 0; y < boardHeight - 1; y++) {         // looping through each row (except bottom line)
        let row = []                                    // keeping tile indexes of each row to further scan it
            for (let x = 1; x < boardWidth - 1; x++) {  // looping through each tile in a row (except walls)
                let ref = board[x][y];
                row.push(ref);
            };
        if (row.every( tileIndex => tileIndex === 3 )) { // check if row consists of structure tiles only
            clearedRows += 1;
            clearRow(y);                                 // if yes, delete this row
            pushRowsDown(y);                             // and then push rows down
        };
    };
    if (clearedRows > 0) {
        recalculateScore(clearedRows);                   // adding scores if any rows are cleared
    };
};

// adding total score depending on number of rows cleared
const recalculateScore = (clearedRows) => {
    switch (clearedRows) {
        case 1:  score += 100;
            break;
        case 2:  score += 250;
            break;
        case 3:  score += 500;
            break;
        default: score += 10; // default adds extra points for every sprite built on board
    };
    document.getElementById("tetris__session-score").innerHTML = "Score: " + score.toString();
};

const refreshScores = () => {
    document.getElementById("tetris__session-score").innerHTML = "Score: 0";
    document.getElementById("tetris__top-score").innerHTML = "Top: " + localStorage["topScore"] || 0;
};

// refreshing all 0"s to background 
const refreshTiles = () => {
    locateSprite().map((xy) => {
        let x = xy[0],
            y = xy[1],
            tileRef = document.getElementById("tetris__tile-x" + x + "y" + y),
            cssTile = tileRef.style;
        // coloring background excluding the walls
        if (x == 0 || x == boardWidth - 1 ) {
            cssTile.backgroundColor = palette.border;
        } else cssTile.backgroundColor = palette.background;
    })
};

const renderSprite = () => {
    locateSprite().map((xy) => {
        let x = xy[0],
            y = xy[1],
            tile = document.getElementById("tetris__tile-x" + x + "y" + y);
        tile.style.backgroundColor = palette.sprite;
    })
};

const renderUpcomingSprite = () => {
    for (let i = 0; i < 16; i++) {
        let tile = document.getElementById("tetris__upcoming-" + i);
        upcomingSprite[i] == 1 ? 
            tile.style.backgroundColor = palette.sprite :
            tile.style.backgroundColor = palette.background;
    };
};

const resetBoard = () => {
    // setting all tiles as 0`s (except walls and bottom)
    for (let x = 1; x < boardWidth - 1; x++) {      // quering X coordinate
        for (let y = 0; y < boardHeight - 1; y++) { // quering Y coordinate
            let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
            board[x][y] = 0;    
            tile.style.backgroundColor = palette.background;
        };
    };
    activeSprite = getRndmSprite();     // create new active sprite
    upcomingSprite = getRndmSprite();   // create new upcoming sprite
    renderUpcomingSprite()                    // render upcoming sprite
    spritePosition = { x: Math.round(boardWidth / 2) - 2, y: -2};
};

const resetGame = () => {
    resetBoard();
    refreshScores();
    score = 0;          // resetting session score to 0
    
    let storedTopScore = localStorage['topScore'];
    // updating top score if its higher than the prev one
    if (storedTopScore && score > storedTopScore) {
        localStorage['topScore'] = score;
    }
    // updating top score on score board
    document.getElementById("tetris__top-score").innerHTML = "Top: " + localStorage["topScore"] || 0;
};

// finds and scans 4x4 sprite and returns coordinates of solid tiles
const locateSprite = () => {
    let coordinates = [],
        i = 0;  // index to loop through the sprite array

    for (let y = spritePosition.y; y < spritePosition.y + 4; y++) {   // quering Y coordinate
        for (let x = spritePosition.x; x < spritePosition.x + 4; x++, i++) { // quering X coordinate
            if (activeSprite[i] == 1) {
                let tileRef = document.getElementById("tetris__tile-x" + x + "y" + y); 
                // if tile found,pushing coordinates to further return it
                if (tileRef) coordinates.push([x,y]);
            };
        };
    };
    return(coordinates)
};

const placeSprite = () => {
    build();                                // building current tetromino onto the well
    checkIfGameOver();                      // check if game 
    clearSolidRows();                       // clear rows if completely filled
    activeSprite = [...upcomingSprite];     // swap current and upcoming sprite
    upcomingSprite = getRndmSprite();     // generate next sprite
    renderUpcomingSprite();                       // update upcoming container
    resetSpritePosition();                  // reset active sprite position
};

// pushing down rows that are above the cleared row
const pushRowsDown = (y) => {
    for (let x = 1; x < boardWidth - 1; x++) {      // looping through each column
        
        // "shifting down" an entire column by:
        board[x].splice(y, 1);                      // 1) removing last index tile
        board[x].splice(0, 0, 0);                   // 2) adding 0 index tile at front

        // looping through each row and further refreshing board look
        for (let y = 0; y < boardHeight - 1; y++) {
            let tile = document.getElementById("tetris__tile-x" + x + "y" + y);
            if (board[x][y] == 0) tile.style.backgroundColor = palette.background;
            else tile.style.backgroundColor = palette.structure;
        };
    };
};

const resetSpritePosition = () => {
    spritePosition = {x: Math.round(boardWidth / 2) - 2, y: -1};
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

// functions for sprite movements
const pushSpriteDown = () => {spritePosition.y += 1},
      pushSpriteLeft = () => {spritePosition.x -= 1},
      pushSpriteRight = () => {spritePosition.x += 1};

// setting a game turn
const handleGameTurn = () => {
    refreshTiles();                                 // refreshing all 0`s color them as background
    if (!checkForBarrier("down")) pushSpriteDown(); // pushing sprite position down
    renderSprite();                                 // coloring sprite 
}

let startGame = setInterval(handleGameTurn, gameSpeed)  // starting a game

window.onload = () => {
    document.body.style.backgroundColor = palette.body;

    let gameScreen = document.createElement("div"), // creating container for the "screen"
        cssgameScreen = gameScreen.style;

    gameScreen.setAttribute("id", "tetris__screen"); // setting id
    cssgameScreen.position = "relative"
    cssgameScreen.width = "35vh"
    cssgameScreen.paddingBottom = "35vh"; // using padding instead of height (preserves game ratio)
    
    document.body.appendChild(gameScreen);

    let gameScreenRef = document.getElementById("tetris__screen"); 

    // configuring board
    for (let x = 0; x < boardWidth; x++) {              
        board[x] = new Array( boardHeight ).fill(0);    // adding vertical lines (arrays of 0`s)  
        board[x][boardHeight - 1] = 2;                  // drawing the bottom line with 2`s
    };
    // drawing the walls with 1`s
    for (let y = 0; y < boardHeight; y++) {     
        board[boardWidth - 1][y] = board[0][y] = 1;
    };
    // initial board rendering in browser as HTML
    for (let y = 0; y < boardHeight; y++) {
        for (let x = 0; x < boardWidth; x++) {
            let tile = document.createElement("div"), // creating tile as a div
                cssTile = tile.style,              // reference to pass through addTileOptionalStyle()
                tileType = board[x][y];;              // tile type reference

            tile.setAttribute("id", "tetris__tile-x" + x + "y" + y);     // adding id with coordinates
            cssTile.left = x * tileSize + "%";                       // positioning tile on board
            cssTile.top = (tileSize * 5) + y * tileSize + "%";                           
            cssTile.position = "absolute";  
            cssTile.width = tileSize * 0.85 + "%";
            cssTile.height = tileSize * 0.85 + "%";
            if (tileType == 1) cssTile.background = palette.border;            // coloring walls
            else if (tileType == 2) cssTile.background = palette.border;     // coloring bottom
            else cssTile.background = palette.background;                    // coloring background

            // checks if optional styling is present in the code before firing (see end of file)
            if (typeof addTileOptionalStyle === "function") addTileOptionalStyle(cssTile);   

            gameScreenRef.appendChild(tile);       

        };
    };
    // rendering a container with the upcoming falling sprite
    let index = 0;
    for (let y = 0; y < 4; y++) {       // "y" is container"s height
        for (let x = 0; x < 4; x++, index++) {   // "x" is container"s width
            // creating, id"ing and positioning tiles the same way as the board
            let tile = document.createElement("div"),
                cssTile = tile.style;

            tile.setAttribute("id", "tetris__upcoming-" + index); // setting id
            // checks if optional styling is present in the code before firing (see end of file)
            if (typeof addTileOptionalStyle === "function") addTileOptionalStyle(cssTile);
            cssTile.position = "absolute";  
            cssTile.width = tileSize * 0.85 + "%";
            cssTile.height = tileSize * 0.85 + "%";
            // setting div position
            cssTile.left = tileSize + (x * tileSize) + "%";
            cssTile.top = 0 + y * tileSize + "%";

            gameScreenRef.appendChild(tile);
        };
    };
    // creating, id`ing and positioning top and session score
    let score = document.createElement("p"),
        topScore = document.createElement("p"),
        cssScoreRef = score.style,
        cssTopScoreRef = topScore.style;

        score.setAttribute("id", "tetris__session-score");
        topScore.setAttribute("id", "tetris__top-score");            
        cssScoreRef.position = cssTopScoreRef.position = "absolute";
        cssScoreRef.color    = cssTopScoreRef.color    = palette.text;
        cssScoreRef.left     = cssTopScoreRef.left      = tileSize * 6 + "%";
        cssScoreRef.top      = tileSize + "%";
        cssTopScoreRef.top   = "0";

        gameScreenRef.appendChild(score);
        gameScreenRef.appendChild(topScore);

    // on-screen control buttons
    let buttons = [ { code: "ArrowLeft", val: "◁"},
                    { code: "ArrowRight", val: "▷"},
                    { code: "ArrowDown", val: "▽"},
                    { code: "ArrowUp", val: "△"},
                    { code: "Space", val: "☉"},
                  ]
    // dynamically creating buttons
    for (let i = 0; i < buttons.length; i++) {
        let button = document.createElement("button"), 
                cssButton = button.style;

        button.setAttribute("id", "tetris__button" + i); // setting id
        // sizing and positioning
        cssButton.position = "absolute"
        cssButton.width = tileSize * 2 + "%"
        cssButton.height = tileSize * 2 + "%"
        switch (i) {
            case 0:
                cssButton.left = tileSize + "%";
                cssButton.top  = (tileSize * 29) + "%";
                break;
            case 1:
                cssButton.left = tileSize * 5 + "%";
                cssButton.top  = (tileSize * 29) + "%";
                break;
            case 2:
                cssButton.left = tileSize * 3 + "%";
                cssButton.top  = (tileSize * 31) + "%";
                break;
            case 3:
                cssButton.left = tileSize * 3 + "%";
                cssButton.top  = (tileSize * 27) + "%";
                break;
            default: 
                cssButton.left = tileSize * 9 + "%";
                cssButton.top  = (tileSize * 29) + "%";
        }; 
        gameScreenRef.appendChild(button);

        let buttonRef = document.getElementById("tetris__button" + i); 
        // inserting "icon" 
        buttonRef.innerHTML = buttons[i].val;
        // checks if optional styling is present in the code before firing (see end of file)
        if (typeof addBtnStyle === "function") addBtnStyle(buttonRef.style); 

        // switch (buttons[i].code) {
        const handleControl = (stuff) => {
            refreshTiles();
            switch (stuff.code) {
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
                    while (checkForBarrier("down") == false) pushSpriteDown();
                    break;
                case "Space":
                    // not the best rotation mechanism, but overall prevents sprite colliding with other structures
                    if (!checkForBarrier("left") && !checkForBarrier("right") && !checkForBarrier("down")) {
                        rotateSprite();
                    }
            };
            renderSprite();
        }
        let interval
        let timeOut
        // on screen controls - same as keyboard
        // TODO - merge on screen and keyboard controls as they follow same logic
        buttonRef.addEventListener("mousedown", () => {
            
            timeOut = setTimeout(()=> {
                interval = setInterval(()=>handleControl(buttons[i]), 100);
            }, 500);
          

            // checking if there is no barrier before moving sprite
            
            
        })
        buttonRef.addEventListener("mouseup", () => {
            clearInterval(interval);
            clearTimeout(timeOut)
          });

    }          
    buttonRef.addEventListener("ontouchstart", () => {
            
        timeOut = setTimeout(()=> {
            interval = setInterval(()=>handleControl(buttons[i]), 100);
        }, 500);
      

        // checking if there is no barrier before moving sprite
        
        
    })
    buttonRef.addEventListener("ontouchend", () => {
        clearInterval(interval);
        clearTimeout(timeOut)
      });

     
    resetGame(); // reset is needed for the initial load, as it also configures score board 
};

// keyboard controls
document.addEventListener("keydown", e => {
    refreshTiles();
    // checking if there is no barrier before moving sprite
    switch (e.code) {
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
            while (checkForBarrier("down") == false) pushSpriteDown();
            break;
        case "Space":
            // not the best rotation mechanism, but overall prevents sprite colliding with other structures
            if (!checkForBarrier("left") && !checkForBarrier("right") && !checkForBarrier("down")) {
                rotateSprite();
            }
    };
    renderSprite();
})

// ************ OPTIONAL STYLING ************
// below code enhances visual aspect of the game, though remains discretionary;
// from here, everything can be removed without affecting gameplay

let cssBody = document.body.style

cssBody.display = "flex"
cssBody.justifyContent = "center"
cssBody.alignItems = "center"

cssBody.fontFamily = "Lucida Console";

const addTileOptionalStyle = (cssTile) => {  
    cssTile.border = "1px solid rgba(255,255,255,.05 )"; 
    cssTile.borderRadius = "35%"; 
    cssTile.boxSizing = "border-box";
}

const addBtnStyle = (cssButton) => {

    //   .tetris__btn:active {
    //     box-shadow:  none;
    //     color:  #1A1A1A;
    //     background-color:  #FBC02D !important;
    //   }
      
      
    cssButton.fontSize =  "150%";
    cssButton.outline = "none"
    cssButton.border = `2px solid ${palette.sprite}`;
    cssButton.cursor = "pointer"
    cssButton.borderRadius = "35%"
    cssButton.transition = ".1s ease-in-out"
    cssButton.userSelect = "none";
    cssButton.background = palette.background;
    cssButton.color =  palette.sprite;
}

// const addBtnPressedStyle = (cssButton) 



// animation for clearRow()
const clearRowAnim = (tileId, x, y) => {
    for (let i = 0; i < 4; i ++) {
        let shard = document.createElement("div"),              // for each tile creating 4 "shards"
            shardId = "tetris__shard-x" + x + i + "y" + y + i,  // shard's id string
            cssShard = shard.style;     

        let shardColors = ["#F44336", "#374046", "#03A9F4", "#4CAF50", "#3F51B5", "#374046", "#F44336", "#9C27B0"];

        shard.setAttribute("id", shardId);
        // general shard styling, 
        cssShard.position = "absolute";
        cssShard.width = "50%";
        cssShard.height = "50%";
        cssShard.borderRadius = "35%";
        cssShard.backgroundColor = shardColors[getRndmNum(0, shardColors.length)];
        cssShard.zIndex = 1;

        // positioning each shard to one of the tile corners
        switch (i) {
            case 0: cssShard.left = 0; cssShard.top = 0;       // top left corner
                break;
            case 1: cssShard.right = 0; cssShard.top = 0;      // top right corner
                break;
            case 2: cssShard.right = 0; cssShard.bottom = 0;   // bottom right corner
                break;
            case 3: cssShard.left = 0; cssShard.bottom = 0;    // bottom left corner
                break;
        }

        tileId.appendChild(shard); // appending to DOM
    
        let shardRef = document.getElementById(shardId); 
        // creating random position in pixels for shard
        const rndmPx = () => {return (getRndmNum(-tileSize*20, tileSize*20) + "%")};
        // animation style
        let anim = [
            { transform: "translate(0) rotate(0)", opacity: 1},
            { transform: `translate(${rndmPx() + " , " + rndmPx()}) rotate(${getRndmNum(-180, 180)}deg)`, opacity: 0}
        ];
        // animation speed and duration
        let animTiming = {duration: 325, iterations: Infinity} // animation should be slightly longer than timeout before div removal

        shardRef.animate(anim, animTiming); // adding animation to the shard
        
        setTimeout(() => {
            shardRef.remove(); // remove shard from DOM after playing animation;
        }, 300);
    }
}
