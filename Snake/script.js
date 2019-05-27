/*jslint browser: true*/
/*global $*/
function game() {
    
    // Define vars
    'use strict';
    var canvas = $('#canvas')[0], ctx = canvas.getContext("2d"), w = $("#canvas").width(), h = $("#canvas").height(), 
        cw = 15, d = "right", food, score, speed = 130, foodColor = "red", color = "green", headColor = "blue", snakeArray, game_loop;
    
    // Create the snake
    function createSnake() {
        var length = 5;
        snakeArray = [];
        
        for (var i = length - 1; i >= 0; i--) {
            snakeArray.push({x: i, y: 0});
        }
    }
    
    // Create food
    function createFood() {
        food = {
            x:Math.round(Math.random()*(w-cw)/cw),
            y:Math.round(Math.random()*(h-cw)/cw),
        };
    }
    
    function setSpeed(e) {
        speed = e;
        $('#speed').html('Speed: ' + speed);
    }
    
    // Paint
    function paint() {
        // Paint the canvas
        ctx.fillStyle = "black";
        ctx.fillRect(0,0,w,h);
        ctx.strokeStyle = "white";
        ctx.strokeRect(0,0,w,h);
        
        // Current snake position
        var nx = snakeArray[0].x;
        var ny = snakeArray[0].y;
        
        // Snake movement
        if(d == "right") nx++;
        else if(d == "left") nx--;
        else if(d == "up") ny--;
        else if(d == "down") ny++;
        
        // Snake collision
        if(nx == -1 || nx == w/cw || ny == -1 || ny == h/cw || checkCollision(nx, ny, snakeArray)) {
            //init();
            $('#final_score').html(score);
            $('#overlay').fadeIn(300);
            return;
        }
        
        if(nx == food.x && ny == food.y) {
            var tail = {x: nx, y: ny};
            score++;
            setSpeed(speed-10);
            
            // Create new food
            createFood();
            
        } else {
            tail = snakeArray.pop();
            tail.x = nx;
            tail.y = ny;
        }
        
        snakeArray.unshift(tail);
        
        for(var i = 0; i < snakeArray.length; i++) {
            var c = snakeArray[i];
            paintCell(c.x, c.y, false);
        }
        
        // Paint the snake
        paintCell(food.x, food.y, true);
        
        // Check the score
        checkScore(score);
        
        // Display score while playing
        $('#score').html('Your Score:' + score);
        
    }
    
    function paintCell(x, y, isFood, isHead) {
        if (isFood) ctx.fillStyle=foodColor;
        else if (isHead) ctx.fillStyle=headColor;
        else ctx.fillStyle=color;
        ctx.strokeStyle="black";
        ctx.fillRect(x*cw, y*cw, cw, cw);
        ctx.strokeRect(x*cw, y*cw, cw, cw);
    }
    
    // TODO: Add collision login on the snake body
    function checkCollision(x, y, array) {
        
        for(var i = 0; i < array.length; i++) {
            if(array[1].x == x && array[1].y == y) {
                return true;
                
            } else if(i == array[0]) {
                
                for(var is = 0; is < array.length; i++) {
                    
                    if(array[is].x == array[i].x || array[is].y == array[i].y) {
                        return true;
                    }  
                }         
            }
        }
        
        return false;
    }
    
    // Check Score
    function checkScore(score) {
        
        if(localStorage.getItem('highScore') === null) {
            
           localStorage.setItem('highScore', score);
            
        } else {
            if(score > localStorage.getItem('highScore')) {
                localStorage.setItem('highScore', score);
            }
        }
        
        $('#high_score').html('High Score: ' + localStorage.highScore);
    }
    
    // Init
    function init() {
        var d = "right";
        createSnake();
        createFood();
        score = 0;
        $('#speed').html('Speed: ' + speed);
        
        if (typeof game_loop !== "undefined") {
            clearInterval(game_loop);
        }
        
        game_loop = setInterval(paint, speed);
    }
    
    init();
    
    // Keyboard controller
    $(document).keydown(function(e){
        var key = e.which;
        
        if(key == "37" && d != "right") d = "left";
        else if(key == "38" && d != "down") d = "up";
        else if(key == "39" && d != "left") d = "right";
        else if(key == "40" && d != "up") d = "down";
        
    });
    
};

function resetHighScore() {
    localStorage.setItem('highScore', 0);
    $('#high_score').html('High Score: ' + localStorage.highScore);
}

$(document).ready(game);