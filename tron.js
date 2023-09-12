"use strict";

//Need to be edited in other functions
var SPD_1 = 0;
var SPD_2 = 0;

var waiting_start = true;

function storeTurnPoint(lumicycle) {
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];
    lumicycle.points.push([coord_x,coord_y]);
}

function constructPathOfLumicycle(ctx,lumicycle) {
    ctx.moveTo(lumicycle.points[0][0],lumicycle.points[0][1]);
    ctx.beginPath();
    for (let point of lumicycle.points) {
        ctx.lineTo(point[0],point[1]);
    }
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];
    ctx.lineTo(coord_x,coord_y);
    ctx.stroke();
}

function isColliding(lumicycle, with_lumi2, width, height, disp_size) {
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];

    let coord_x2 = with_lumi2.pos[0];
    let coord_y2 = with_lumi2.pos[1];

    if (coord_x < (disp_size/2-1) || coord_x > (width - disp_size/2+1) || coord_y < (disp_size/2-1) || coord_y > (height - disp_size/2+1)) {
        return true;
    }

    function collidingWithTrailOf(lumicycle,disp_size,self) {
        for (let i = 0; i < lumicycle.points.length; ++i) {
            let point1 = lumicycle.points[i];
            let point2;
            if (i == lumicycle.points.length-1 && self) {
                point2 = [coord_x,coord_y];
            } else if (i == lumicycle.points.length -1 && !self) {
                point2 = [coord_x2,coord_y2];
            } else {
                point2 = lumicycle.points[i+1];
            }

            if (point1[0] == point2[0]) {
                if (coord_x - disp_size/2 < point1[0] && coord_x + disp_size/2 > point1[0]) {
                    if ((point1[1] < coord_y && coord_y < point2[1]) || (point2[1] < coord_y && coord_y < point1[1])) {
                        return true;
                    }
                }
            } else if (point1[1] == point2[1]) {
                if (coord_y - disp_size/2 < point1[1] && coord_y + disp_size/2 > point1[1]) {
                    if ((point1[0] < coord_x && coord_x < point2[0]) || (point2[0] < coord_x && coord_x < point1[0])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    return (collidingWithTrailOf(lumicycle,disp_size,true) || collidingWithTrailOf(with_lumi2,disp_size,false));
}

function isDestroyed(lumicycle) {
    let spd_x = lumicycle.vector[0];
    let spd_y = lumicycle.vector[1];
    return (spd_x == 0 && spd_y == 0);
}


function particleCreateForLumicycle(lumicycle,n) {
    let particles = [];
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];
    for (let i = 0; i < n; ++i) {
        let part = {pos:[coord_x,coord_y],spd:[Math.random()*1.6-0.8,Math.random()*1.6-0.8],sz: Math.floor(Math.random()*10+5)};
        particles.push(part);
    }
    return particles;
}

function particlesUpdatePos(particles,dt) {
    for (let i = 0; i < particles.length; ++i) {
        particles[i].pos[0] += particles[i].spd[0]*dt;
        particles[i].pos[1] += particles[i].spd[1]*dt;
    }
}

function displayParticles(ctx,particles) {
    for (let i = 0; i < particles.length; ++i) {
        if (particles[i] != undefined){
            ctx.fillRect(particles[i].pos[0]-particles[i].sz/2,particles[i].pos[1]-particles[i].sz/2,particles[i].sz,particles[i].sz);
        }
    }
}


function particleCreateForTrailOf(lumicycle,particles) {
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];

    let spd_x = lumicycle.vector[0];
    let spd_y = lumicycle.vector[1];

    let part;
    if (spd_x > 0 && spd_y == 0.0) {
        part = {pos:[coord_x,coord_y],spd:[-(Math.random()*0.4),Math.random()*0.1-0.05],framesBeforeDecay:30,sz: Math.floor(Math.random()*6+2)};
    } else if (spd_x < 0 && spd_y == 0.0) {
        part = {pos:[coord_x,coord_y],spd:[Math.random()*0.4,Math.random()*0.1-0.05],framesBeforeDecay:30,sz: Math.floor(Math.random()*6+2)};
    } else if (spd_x == 0.0 && spd_y > 0) {
        part = {pos:[coord_x,coord_y],spd:[Math.random()*0.1-0.05,-(Math.random()*0.4)],framesBeforeDecay:30,sz: Math.floor(Math.random()*6+2)};
    } else if (spd_x == 0.0 && spd_y < 0) {
        part = {pos:[coord_x,coord_y],spd:[Math.random()*0.1-0.05,Math.random()*0.4],framesBeforeDecay:30,sz: Math.floor(Math.random()*6+2)};
    }
    particles.push(part);
}

function trailParticlesUpdatePos(particles,dt) {
    if (waiting_start) {
        return;
    }
    for (let i = 0; i < particles.length; ++i) {
        particles[i].pos[0] += particles[i].spd[0]*dt;
        particles[i].pos[1] += particles[i].spd[1]*dt;
        particles[i].framesBeforeDecay = Math.max(particles[i].framesBeforeDecay-1,0);
    }
}

function makeParticlesDecay(particles) {
    if (waiting_start) {
        return;
    }
    for (let i = 0; i < particles.length; ++i) {
        if (particles[i].framesBeforeDecay == 0) {
            particles.splice(i,1);
            break;
        }
    }
}


function createBonusInstance(bonuses,scrWidth,scrHeight,disp_size) {
    if (waiting_start) {
        return;
    }
    let instance = {pos: [Math.random()*(scrWidth-disp_size)+disp_size/2, Math.random()*(scrHeight-disp_size)+disp_size/2], sz: disp_size, collected: false};
    bonuses.instances.push(instance);
    console.log(bonuses);
}

function applyBonusIfCollected(lumicycle,bonuses,disp_size) {
    let coord_x = lumicycle.pos[0];
    let coord_y = lumicycle.pos[1];
    for (let inst of bonuses.instances) {
        let bonus_x = inst.pos[0];
        let bonus_y = inst.pos[1];
        if ((coord_x-disp_size/2 < bonus_x-disp_size/2 && bonus_x-disp_size/2 < coord_x+disp_size/2 && coord_y-disp_size/2 < bonus_y-disp_size/2 && bonus_y-disp_size/2 < coord_y+disp_size/2)
        || (coord_x-disp_size/2 < bonus_x-disp_size/2 && bonus_x-disp_size/2 < coord_x+disp_size/2 && coord_y-disp_size/2 < bonus_y+disp_size/2 && bonus_y+disp_size/2 < coord_y+disp_size/2)
        || (coord_x-disp_size/2 < bonus_x+disp_size/2 && bonus_x+disp_size/2 < coord_x+disp_size/2 && coord_y-disp_size/2 < bonus_y-disp_size/2 && bonus_y-disp_size/2 < coord_y+disp_size/2)
        || (coord_x-disp_size/2 < bonus_x+disp_size/2 && bonus_x+disp_size/2 < coord_x+disp_size/2 && coord_y-disp_size/2 < bonus_y+disp_size/2 && bonus_y+disp_size/2 < coord_y+disp_size/2)) {
            if (lumicycle.num == 1) {
                SPD_1 *= 1.005;
            } else {
                SPD_2 *= 1.005;
            }
            inst.collected = true;
        }
    }
}

function renderBonuses(ctx,bonuses,disp_size) {
    for (let inst of bonuses.instances) {
        if (!inst.collected) {
            let sz = Math.random()*disp_size
            ctx.fillRect(inst.pos[0]-sz/2,inst.pos[1]-sz/2,sz,sz);
        }
    }
}

/**
 *  TRON - version 2021 pour les L3 INFO
 */
document.addEventListener("DOMContentLoaded", function() {
    document.body.appendChild(new Audio("./240_Bits_Per_Mile_draft_2.ogg"));
    let audio = document.body.lastElementChild;
    audio.setAttribute("loop","");
    

    /** Récupération des informations liées au canvas */
    let canvas = document.getElementById("cvs");
    const WIDTH = canvas.width = window.innerWidth;
    const HEIGHT = canvas.height = window.innerHeight;
    let ctx = canvas.getContext("2d"); 

    const DISPLAY_SIZE = 10;
    

    /**Objet lumicycle */
    var lumi1 = {pos: [WIDTH/2,DISPLAY_SIZE], vector:[0,SPD_1], points: [[WIDTH/2,0]], num: 1};
    var lumi2 = {pos: [WIDTH/2,HEIGHT-DISPLAY_SIZE], vector:[0,-SPD_2], points: [[WIDTH/2,HEIGHT-DISPLAY_SIZE]], num: 2};

    var bonuses = {framesBeforeAppearing: 750,instances: []};

    var parts1 = undefined;
    var parts2 = undefined;

    var partsTrail1 = [];
    var partsTrail2 = [];


    /**Modifier la direction d'un lumicycle */
    document.addEventListener("keydown", function(e) {
        let audio = document.querySelector("audio");
        audio.play();

        switch (e.key) {
            case "z":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi1);
                if (lumi1.vector[1] != SPD_1) {
                    lumi1.vector = [0,-SPD_1];
                }
                break;

            case "q":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi1);
                if (lumi1.vector[0] != SPD_1) {
                    lumi1.vector = [-SPD_1,0];
                }
                break;

            case "s":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi1);
                if (lumi1.vector[1] != -SPD_1) {
                    lumi1.vector = [0,SPD_1];
                }
                break;

            case "d":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi1);
                if (lumi1.vector[0] != -SPD_1) {
                    lumi1.vector = [SPD_1,0];
                }
                break;





            case "ArrowUp":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi2);
                if (lumi2.vector[1] != SPD_2) {
                    lumi2.vector = [0,-SPD_2];
                }
                break;
    
            case "ArrowLeft":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi2);
                if (lumi2.vector[0] != SPD_2) {
                    lumi2.vector = [-SPD_2,0];
                }
                break;
    
            case "ArrowDown":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi2);
                if (lumi2.vector[1] != -SPD_2) {
                    lumi2.vector = [0,SPD_2];
                }
                break;
    
            case "ArrowRight":
                if (isDestroyed(lumi1) || isDestroyed(lumi2)) {return;}
                e.preventDefault();
                e.stopPropagation();
                storeTurnPoint(lumi2);
                if (lumi2.vector[0] != -SPD_2) {
                    lumi2.vector = [SPD_2,0];
                }
                break;

            case " ":
                if (lumi1Collided || lumi2Collided || waiting_start) {
                    waiting_start = false;
                    SPD_1 = 0.2;
                    SPD_2 = 0.2;
                    
                    lumi1 = {pos: [WIDTH/2,DISPLAY_SIZE], vector:[0,SPD_1], points: [[WIDTH/2,0]], num: 1};
                    lumi2 = {pos: [WIDTH/2,HEIGHT-DISPLAY_SIZE], vector:[0,-SPD_2], points: [[WIDTH/2,HEIGHT-DISPLAY_SIZE]], num: 2};

                    bonuses = {framesBeforeAppearing: 750,instances: []};

                    parts1 = undefined;
                    parts2 = undefined;

                    partsTrail1 = [];
                    partsTrail2 = [];

                    lumi1Collided = false;
                    lumi2Collided = false;
                }
                break;
        }
    });

    /** Dernière mise à jour de l'affichage */
    let last = Date.now();
    var lumi1Collided;
    var lumi2Collided;

    /** Dernière mise à jour */
    function update(now) {
        // delta de temps entre deux mises à jour 
        let dt = now - last;
        last = now;
        lumi1.pos[0] += lumi1.vector[0]*dt;
        lumi1.pos[1] += lumi1.vector[1]*dt;

        lumi2.pos[0] += lumi2.vector[0]*dt;
        lumi2.pos[1] += lumi2.vector[1]*dt;

        lumi1Collided = isColliding(lumi1,lumi2,WIDTH,HEIGHT,DISPLAY_SIZE);
        lumi2Collided = isColliding(lumi2,lumi1,WIDTH,HEIGHT,DISPLAY_SIZE);
        if (lumi1Collided || lumi2Collided) {
            lumi1.vector = [0,0];
            lumi2.vector = [0,0];
        }

        if (parts1 !== undefined) {
            particlesUpdatePos(parts1,dt);
        }

        if (parts2 !== undefined) {
            particlesUpdatePos(parts2,dt);
        }

        if (parts1 === undefined && lumi1Collided) {
            parts1 = particleCreateForLumicycle(lumi1,15);
        }

        if (parts2 === undefined && lumi2Collided) {
            parts2 = particleCreateForLumicycle(lumi2,15);
        }

        if (!lumi1Collided && !lumi2Collided) {
            particleCreateForTrailOf(lumi1,partsTrail1);
            particleCreateForTrailOf(lumi2,partsTrail2);

            trailParticlesUpdatePos(partsTrail1,dt);
            trailParticlesUpdatePos(partsTrail2,dt);

            makeParticlesDecay(partsTrail1);
            makeParticlesDecay(partsTrail2);
        }

        if (!lumi1Collided && !lumi2Collided) {
            if (bonuses.framesBeforeAppearing == 0) {
                createBonusInstance(bonuses,WIDTH,HEIGHT,DISPLAY_SIZE);
                bonuses.framesBeforeAppearing = 750;
            }
            --bonuses.framesBeforeAppearing;
        }

        applyBonusIfCollected(lumi1,bonuses,DISPLAY_SIZE);
        applyBonusIfCollected(lumi2,bonuses,DISPLAY_SIZE);
    }

    /** Réaffichage du contenu du canvas */
    function render() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        if (waiting_start) {
            ctx.fillStyle = "white";
            ctx.textAlign = "center";
            ctx.font = "24px helvetica";
            ctx.fillText("Press SPACE to start",WIDTH/2,HEIGHT/2);
        }

        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.font = "12px helvetica";
        ctx.fillText("Music: Freddy Fazbear's Pizzeria Simulator OST - 240 bits per mile, by Leon Riskin",10,0.05*HEIGHT);

        ctx.textAlign = "center";
        ctx.font = "24px helvetica";

        ctx.fillStyle = "Lightblue";
        ctx.strokeStyle = "Lightblue";
        ctx.fillRect(lumi1.pos[0]-DISPLAY_SIZE/2,lumi1.pos[1]-DISPLAY_SIZE/2,DISPLAY_SIZE,DISPLAY_SIZE);
        constructPathOfLumicycle(ctx,lumi1);

        ctx.fillStyle = "Orange";
        ctx.strokeStyle = "Orange";
        ctx.fillRect(lumi2.pos[0]-DISPLAY_SIZE/2,lumi2.pos[1]-DISPLAY_SIZE/2,DISPLAY_SIZE,DISPLAY_SIZE);
        constructPathOfLumicycle(ctx,lumi2);

        ctx.fillStyle = "Yellow";
        renderBonuses(ctx,bonuses,DISPLAY_SIZE);

        if (lumi1Collided && lumi2Collided) {
            ctx.fillStyle = "Lightblue";
            displayParticles(ctx,parts1);

            ctx.fillStyle = "Orange";
            displayParticles(ctx,parts2);

            ctx.fillStyle = "white";
            ctx.fillText("Draw!",0.9*WIDTH,0.9*HEIGHT);
            ctx.fillText("Press SPACE to restart",0.9*WIDTH,0.9*HEIGHT+30);

        } else if (lumi1Collided) {
            ctx.fillStyle = "Lightblue";
            displayParticles(ctx,parts1);

            ctx.fillStyle = "white";
            ctx.fillText("Orange player wins!",0.9*WIDTH,0.9*HEIGHT);
            ctx.fillText("Press SPACE to restart",0.9*WIDTH,0.9*HEIGHT+30);

        } else if (lumi2Collided) {
            ctx.fillStyle = "Orange";
            displayParticles(ctx,parts2);

            ctx.fillStyle = "white";
            ctx.fillText("Blue player wins!",0.9*WIDTH,0.9*HEIGHT);
            ctx.fillText("Press SPACE to restart",0.9*WIDTH,0.9*HEIGHT+30);

        } else {
            ctx.fillStyle = "Lightblue";
            displayParticles(ctx,partsTrail1);

            ctx.fillStyle = "Orange";
            displayParticles(ctx,partsTrail2);
        }
    }

    /** Boucle de jeu */
    (function loop() {
        requestAnimationFrame(loop);
        update(Date.now());
        render();
    })();


});

