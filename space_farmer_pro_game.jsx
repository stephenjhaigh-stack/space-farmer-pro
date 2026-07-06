import { useState, useReducer, useMemo, useEffect, useRef } from "react";
// Remote play needs the Firebase SDK: `npm install firebase` in your project.
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ─── FIREBASE (remote play) ────────────────────────────────
// Paste your own project's config here — see the Firebase Console:
// console.firebase.google.com → your project → gear icon → Project settings →
// scroll to "Your apps" → the </> (web) icon → register an app → copy this object.
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3pLn9WEYkudlriF6PTPtUupEEtLM30Ks",
  authDomain: "space-farmer-pro.firebaseapp.com",
  projectId: "space-farmer-pro",
  storageBucket: "space-farmer-pro.firebasestorage.app",
  messagingSenderId: "1061049568693",
  appId: "1:1061049568693:web:a9644f5a0b662a73285dfc",
};
let _fbDb = null;
function getDb() {
  if (!_fbDb) {
    const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
    _fbDb = getFirestore(app);
  }
  return _fbDb;
}
function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — easier to read aloud
  let code = "";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ── Audio tracks ────────────────────────────────────────────
// Local files under /audio next to this component. If your bundler serves static assets
// from a different folder (e.g. Vite/CRA's public/), move this audio/ folder there —
// a 404 in the network tab on these paths is the tell.
const AUDIO_INTRO = "audio/intro-theme.mp3";
const AUDIO_GAMEPLAY = "audio/gameplay-theme.mp3";
const AUDIO_STORY = "audio/story-theme.mp3";
const IMG_EARTH = "images/earth-cutout.png";
const IMG_ASTEROID = "images/asteroid-farm-cutout.png";

// Pixel-art pointing-hand cursor (inline SVG data URI, no external asset needed).
const CURSOR_HAND = 'url("data:image/png;base64,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") 12 4, auto';
// Grasping-fist variant — swapped in globally while any mouse button is held down.
const CURSOR_FIST = 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAwCAYAAABjezibAAAJeklEQVR42u2YeXBV1R3Hv79zl7e/vCSQvJeA7EgtaOuwiIGmI0oJm7Y0amV0qo7axXaqVilqtbaVcamOW6BA2Wy1SlBLVarIFhQQoa5VEWKAELNBQpK35d17z/n1j7zQgCQvZHA64/CbOfNmfu+9ez73nt/5/r7nAmfiTJyJM3Emvj5RWlqqAcU6UKyXlpZqzKyVlq7uc+5r8VB6fRfMrIVCkQt2b9/xU5dhlPziV3c427ZVhEP9I0Pf2fHujV63f/rNt9xub3tzczjUf+DQd3bsPj4Xigx9+603b/SYrpLbf3OPU1GxMW/w4MFNa9eudXqalzKDgYjAK1asCC9atubQ0dxJujA8yD6yFauWPIxf3vpb7EvmQ3d5kR37CAsfvx/zf7sAlclIOvchljz1AObdvQD7tTEg3Q1/3UaseXYRBg0sGEFElcwsiEj1CRAo1YBymd1/2DS3P3vdWeNn2/F2W9S/94oI5waovrGZ9UC+IhKwWuuEx21Qst1iIxhO52qF3+ehWDzFrsFFKi8S4S92/VO7Z/7PEjf/5LoxRHSgJ0DRm+UlAtqaG9xTp0yiuRNDWvWWZXrArYtoPElFF4wVLyy/X//HygX6zJKLhN/no+LJFxzLzZp+sTB0g4YNGSDG+Gv1mq3LqDA/WzxVtvzXAA6huFjvDq7XgMyg/uEhqe07duPBJ1bisScfw2WXzUBdTS1ycrJx4cQJGD9+LPLz87B37+cIZQWP5Xw+H6qra3DppdPxyr/W4qFHHqVoPIHmlpZvE5HMNLfo7R4hwxhoWRYWlz3M115dCgJgJdshpUQ0nkAiZUFKCWVZSKVstFs2jhxtwYVFE7DmhVWYMX0qauvqce3Vc7RLZ06V0WjypiEjx/4cFRVORxn1DZCAcjVjxlXZTU1H7plUNB4zpl0kOpad0C+cBxKEgM8Lr8tEeyqF/MII/AEf2lM2jrbGMGjQWdiy5S2UlS3FWYVhAIBtO2LihPOV0IyHQqHBg4By2R1LBpkp1oGDqqnVuWnY8KGX1zc0yJycHK22rgELF6/Egj/ehZfWrkMwGER9w2G8tn4z5s+7BePGn489n1XiUHUN5s37HaZPm4KX1q5Dbm4uausb8PiTS2jJwj/JQzV1rt0f/sciGd0AFGvAQXUqfUMDzjE1QRCegk2PPbVMbdj0pjO+qITHFZXw0uXPMjPz6hde5inTLucHHl3E23d9wNW1jbx957tcMnsuT5g8ncsWr2Jm5jUvvcoTi2fy+KISXrL8GWZmuXTF35U7OOgjZqbuFIW6yREAJQiQivVQ3tkH/rpqYeGskimqNRoXRASfz4vaugbYUsJxJHweDwxdg2kacJkGWqNxtLRF4Xa74DFN5OSEkEqloJSCy+WGUpLf/+BjumzONXGf4Ru2f//OhvS83BVGPwkcC0FsBIZMsVLtl2fnnT3ONI1IVjCARLslHMcBA6j6ZC+UUvB63AgFA/C4XSAhEIsn8EVdA5RiZAX98Hk90DQNrW1RaKKjzFpbo/D7PfD7fXC7XJ6mtpgfQEZAAoBp0+YGN297a+HI4UPmls6ZhZEjh2H+nX+A4zjQdS39Q0IoKwCfxwOPxwWlGLF4Ai2tbZBSISvoR8DvgxACSikw8zE4ANA00dk+wcxMJLi7QtP/B3cvbb73u2LGE9e9eMUVP5jy4P13OuG8fmg+2ibuEuK4HSYEITc7BGZGWzR+HFgw4IcQBCkVpFK9aVU9RhqwWCPc50x95C/Xf2fy5CmLyx60HMcxm1va0BaNflmbhEA01j2YIxnUuz7aW8AKRYIghH7N9T/+kXKbhtbQGoXX68EJDw+KGbX1jbAdidBXCNZVqAmAmjPneS3g9w0YMKBAtFsOddbJybZ4wO/DwIJ8hLICYGY4UvXWefQJkAGI1atLVSKRaGxsPKxMU2elVDfGgRDw+wDgKwU7odUVC0HElm0/9/QzawQAaZombNvByUA7c18l2AmAFZIB8f3pF/5546Yt7952x+9NXdfsnFBAer1e1fnkTncQEYiImBVlMgsMAOXl5cmBQ0bMXLxkxRsls+Yai5b+Tfv4k88EESEajXVAMp8GNIYggUQigZRlpbLcZjKTDgKAAkB7/v16naaJqTt3Ole9vXPXlXn9+41ui0YH7qus0mZpl5A6BY/Ww/kGhsvgffv2o60tVp1oqapPrxBnslsMgKRUsOM1z6pk7eyicSNG2Za1YP2GrZSybEeI07PUBKhXX9tIjnQ2CEGqwzllBuxyF6WaUpP18vJy6/zRo8p2vL2rdc2Lr4jcUJayLLvPYJZlIycnxOs3VNAbb2yyCwvzn+yomgrVx0sW6wCQHRl1w7BvFPHu9z6ymVkdbjrKjU1H+UhzCzcdbeUjzScfHd+1cOfvJTNXVh20zh17CQf7jbibjlm7Pq8EBIggBCE77+wFI0ZP4ufXvKxStsOSmZMpi+PJdo4nU+nPrqMjl0xZLBWzIxWve32zOm/cJRzsN3wlM4u0aaY+n4vTEUpvqKQ3NPg2Etq84skT3bNnfk+M/uYoBIMBKOYvXYwBCCLE4wl8umcvXl23QW3YtNVJ2VaZ1XrwVtWxtnSy2ssEKABwTs7wQsPnXdI/r99YKNZ0Qxe6obW2J1ORWDxhOk7HSwFBhK4y2alEnTmlGAzAMHR4fT7b0PWa+vrGmlg0flOsed+n6flO5eB+rwDu4/wBY9b/8MrSi8ecew4AoLHxMKSUiETCkFLCNE1UVVUhHoujoKAAlm3DNAw0Hm6EdCQikQgsy4LP70cyGYfjSITDHQenysr9eO7pZz6sOfD+OAD28Ru0e0edhr5PAcjK7Zc77rxvjZZKKdI0QcwKSklomkZSdhxpvV4v3G438sN5SFkWXKYJqSQcx0F+OA+WZUE3DMRiUUgpoWkabNtW54wexeHCgjE1Bz4tBFL7u/iCjIBdbB9Jy7I0IQSLLgKYdsJgZkjZAWNZNmzLBoFg2/axXIck0XEirZQiK2UJgJxM+0D03JBAmXpwup9mHCf7H8B0ut4s/N9CZBBB5tNiDk7ejwHiXlr+bq+hGYahpJTH1d3pGIZhKKLML1C768UCQFtTU/Oeyn1VwuVyCV03yDRNMk2TDMM4NvqS83q9dPBAtaivqz8ApGp7EuuehFr5c0eOCmUFVkYKwqOZWWiaRiQAx5LotIaaruGUcrZkIYgb6hs/b25quSHavG9nH4QaJ7Qg1zCAT9OG6qy71MG0QPfY6v4L+vMCgOixU0kAAAAASUVORK5CYII=") 14 14, auto';

// ── Grid helpers ──────────────────────────────────────────
const tR = id => Math.floor((id-1)/3);
const tC = id => (id-1)%3;
const tID = (r,c) => r*3+c+1;
const ortho = id => [[tR(id)-1,tC(id)],[tR(id)+1,tC(id)],[tR(id),tC(id)-1],[tR(id),tC(id)+1]].filter(([r,c])=>r>=0&&r<3&&c>=0&&c<3).map(([r,c])=>tID(r,c));
const all8 = id => { const o=[]; for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){if(!dr&&!dc)continue;const nr=tR(id)+dr,nc=tC(id)+dc;if(nr>=0&&nr<3&&nc>=0&&nc<3)o.push(tID(nr,nc));} return o; };
const adjDir = (id,dir) => { const m={up:[-1,0],down:[1,0],left:[0,-1],right:[0,1]};const[dr,dc]=m[dir]||[0,0];const nr=tR(id)+dr,nc=tC(id)+dc;return(nr>=0&&nr<3&&nc>=0&&nc<3)?tID(nr,nc):null; };

// ── Game data ─────────────────────────────────────────────
const SUN=[
  {core:[1,2,4,5],edge:[3,6,7,8],shadow:[9],label:"Top-Left (R1/R5)"},
  {core:[2,3,5,6],edge:[1,4,8,9],shadow:[7],label:"Top-Right (R2/R6)"},
  {core:[5,6,8,9],edge:[2,3,4,7],shadow:[1],label:"Bottom-Right (R3)"},
  {core:[4,5,7,8],edge:[1,2,6,9],shadow:[3],label:"Bottom-Left (R4)"},
];
const DEMAND=[null,{g:3,gr:0,ex:0},{g:3,gr:1,ex:0},{g:2,gr:2,ex:1},{g:2,gr:3,ex:1},{g:2,gr:3,ex:2},{g:3,gr:3,ex:3}];
// Minimum guaranteed seed cards (by crop) that must appear in each round's draft row,
// sized against Earth's cumulative demand (15/12/7 across 6 rounds) plus one player's
// full Colony Board (6 Greens/4 Grain/3 Exotic) so a single "defector" playthrough and a
// single cooperative playthrough are both achievable — but not both at once, by design.
const DRAFT_MIN=[null,{g:4,gr:0,ex:0},{g:4,gr:1,ex:0},{g:3,gr:1,ex:1},{g:3,gr:2,ex:1},{g:3,gr:2,ex:1},{g:4,gr:2,ex:1}];
const shuf = a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=0|Math.random()*(i+1);[b[i],b[j]]=[b[j],b[i]];}return b;};

const makeSeedDeck = () => shuf([
  ...Array(24).fill(0).map((_,i)=>({id:`g${i}`,t:"seed",crop:"g",lr:1,wr:1,yld:1,name:"Greens"})),
  ...[["L1W1",1,1],["L1W1",1,1],["L1W1",1,1],["L1W2",1,2],["L1W2",1,2],["L2W1",2,1],["L2W1",2,1],["L2W1",2,1],["L2W2",2,2],["L2W2",2,2]]
    .map(([n,lr,wr],i)=>({id:`gr${i}`,t:"seed",crop:"gr",lr,wr,yld:2,name:`Grain ${n}`})),
  ...["L2W2","L2W2","L2W2","L3W2"].map((n,i)=>({id:`ex${i}`,t:"seed",crop:"ex",lr:n==="L3W2"?3:2,wr:2,yld:3,name:`Exotic ${n}`})),
]);
const makeHWDeck = () => shuf([
  ...Array(4).fill(0).map((_,i)=>({id:`bm${i}`,t:"hw",hwt:"bMirror",name:"Basic Mirror",avail:1,desc:"+1L→1 adj tile"})),
  {id:"um0",t:"hw",hwt:"uMirror",name:"Upg Mirror",avail:3,desc:"+1L→2 adj tiles"},
  {id:"um1",t:"hw",hwt:"uMirror",name:"Upg Mirror",avail:3,desc:"+1L→2 adj tiles"},
  ...Array(4).fill(0).map((_,i)=>({id:`bi${i}`,t:"hw",hwt:"bIrrig",name:"Irrigator",avail:1,desc:"+1W self+ortho"})),
  {id:"ui0",t:"hw",hwt:"uIrrig",name:"Upg Irrigator",avail:3,desc:"+1W self+all8"},
  {id:"ui1",t:"hw",hwt:"uIrrig",name:"Upg Irrigator",avail:3,desc:"+1W self+all8"},
  {id:"cr0",t:"hw",hwt:"cReg",name:"Climate Reg",avail:5,desc:"+1L+1W self+all8"},
  {id:"cr1",t:"hw",hwt:"cReg",name:"Climate Reg",avail:5,desc:"+1L+1W self+all8"},
]);
const makeEventDeck = () => shuf([
  {id:"e1",et:"meteor",icon:"☄️",name:"Meteorite Strike",desc:"Random tile destroyed — 3-round damage."},
  {id:"e2",et:"meteor",icon:"☄️",name:"Meteorite Strike",desc:"Random tile destroyed — 3-round damage."},
  {id:"e3",et:"meteor",icon:"☄️",name:"Meteorite Strike",desc:"Random tile destroyed — 3-round damage."},
  {id:"e4",et:"pressure",icon:"📡",name:"Emergency Transmission",desc:"Demand +4 Greens this round."},
  {id:"e5",et:"pressure",icon:"🍞",name:"Famine Crisis",desc:"Exotic demand doubles this round."},
  {id:"e6",et:"pressure",icon:"👥",name:"Population Surge",desc:"Greens demand +2 this round."},
  {id:"e7",et:"bonus",icon:"🌾",name:"Bumper Crop",desc:"All harvests yield +1 extra crop."},
  {id:"e8",et:"bonus",icon:"⚡",name:"Tech Breakthrough",desc:"Hardware free in draft. +1 extra card."},
  {id:"e9",et:"bonus",icon:"🌌",name:"Calm Orbit",desc:"No negatives. Free hardware reposition."},
  {id:"e10",et:"wildcard",icon:"📦",name:"Supply Shortage",desc:"Seeds only in draft this round."},
  {id:"e11",et:"wildcard",icon:"☀️",name:"Solar Flare",desc:"+1L all tiles. Mirrors malfunction."},
  {id:"e12",et:"wildcard",icon:"🚫",name:"Trade Embargo",desc:"No trading this round."},
  {id:"e13",et:"vitdamage",icon:"⚠️",name:"Global Unrest",desc:"Earth's Vitality drops by 3, immediately."},
  {id:"e14",et:"vitheal",icon:"🤝",name:"Emergency Coalition",desc:"Earth's Vitality rises by 2, immediately."},
]);

// ── Tile value computation ────────────────────────────────
function computeTiles(player, sunPos, efx={}) {
  const sun=SUN[sunPos%4];
  const v={};
  for(let t=1;t<=9;t++){
    let l=sun.core.includes(t)?2:sun.edge.includes(t)?1:0;
    if(efx.solarFlare) l=Math.min(3,l+1);
    v[t]={l,w:0};
  }
  player.grid.forEach(tile=>{
    if(tile.dmg>0||!tile.c||tile.c.t!=="hw") return;
    const{hwt}=tile.c.card, id=tile.id;
    if(hwt==="bIrrig"){v[id].w+=1;ortho(id).forEach(n=>v[n].w+=1);}
    else if(hwt==="uIrrig"){v[id].w+=1;all8(id).forEach(n=>v[n].w+=1);}
    else if(hwt==="bMirror"&&!efx.mirrorsDown){const tgt=adjDir(id,tile.c.dirs?.[0]);if(tgt)v[tgt].l=Math.min(3,v[tgt].l+1);}
    else if(hwt==="uMirror"&&!efx.mirrorsDown){(tile.c.dirs||[]).slice(0,2).forEach(d=>{const tgt=adjDir(id,d);if(tgt)v[tgt].l=Math.min(3,v[tgt].l+1);});}
    else if(hwt==="cReg"){v[id].l=Math.min(3,v[id].l+1);v[id].w+=1;all8(id).forEach(n=>{v[n].l=Math.min(3,v[n].l+1);v[n].w+=1;});}
  });
  if(player.colony.agriWater) v[player.colony.agriWater].w=Math.min(3,(v[player.colony.agriWater].w||0)+1);
  return v;
}

function calcDP(p, vit) {
  const ls=p.colony.ls.filter(Boolean).length, ag=p.colony.ag.filter(Boolean).length, re=p.colony.re.filter(Boolean).length;
  let dp=ls*1-(6-ls)*2+ag*2-(4-ag)*2+re*4-(3-re)*3;
  if(ls>0&&ag>0&&re>0) dp+=5;
  dp+=(p.roundWins||0)*2; // +2 DP per round spent as the harvest leader
  const m=vit>=7?1:vit>=4?0.5:0.25;
  return Math.floor(dp*m);
}

// ── Initial state ─────────────────────────────────────────
const blankEfx = ()=>({bumper:false,solarFlare:false,mirrorsDown:false,embargo:false,seedsOnly:false,extraCard:false,freeHW:false,demG:0,demExDouble:false});

function makeState(names) {
  return {
    phase:"event", round:1, sunPos:0, vit:10,
    players:names.map((name,id)=>({id,name,
      grid:Array.from({length:9},(_,i)=>({id:i+1,c:null,dmg:0})),
      colony:{ls:[null,null,null,null,null,null],ag:[null,null,null,null],re:[null,null,null],agriWater:null},
      stockpile:{g:0,gr:0,ex:0},hand:[],roundWins:0,
    })),
    seedDeck:makeSeedDeck(), hwDeck:makeHWDeck(), evDeck:makeEventDeck(),
    draft:[], draftOrder:names.map((_,i)=>i), draftIdx:0, passStreak:0,
    event:null, efx:blankEfx(), meteorHit:null, eventDrawn:false, meteorResolved:false,
    harvestResults:null, shipResult:null, harvestLeaders:[], outcome:null,
    contribs:names.map((_,id)=>({id,ship:{g:0,gr:0,ex:0},invest:{g:0,gr:0,ex:0},done:false})),
    contribIdx:0, contribsRevealed:false,
    engIdx:0, tradePile:[], selCard:null,
    log:["Mission started. Round 1 begins."],
    gameStarted: false,
  };
}

// ── Reducer ───────────────────────────────────────────────
function appendLog(log, msg){return[...log, msg].slice(-10);}

// Start-of-round setup: rotate the sun and tick down meteor damage. Runs every round
// (including round 1) whenever a round begins. The event card itself is drawn separately,
// on demand, via the DRAW_EVENT action below — it's a player-triggered reveal, not
// something that happens invisibly behind the scenes.
function startRound(s) {
  const sunPos=(s.round-1)%4;
  let players=s.players.map(p=>({...p,grid:p.grid.map(t=>({...t,dmg:Math.max(0,t.dmg-1)}))}));
  let log=appendLog(s.log, `Round ${s.round} — ☀️ ${SUN[sunPos].label}`);
  return{...s,sunPos,players,log,phase:"event",event:null,efx:blankEfx(),meteorHit:null,
    eventDrawn:false,meteorResolved:false,harvestResults:null,shipResult:null};
}

function reducer(s, a) {
  switch(a.type) {
  case "RESET": return {...startRound(makeState(a.names)), gameStarted: true};

  case "DRAW_EVENT": {
    if(s.eventDrawn) return s;
    const evDeck=[...s.evDeck]; const event=evDeck.shift()||null;
    let efx=blankEfx();
    let log=s.log;
    let vit=s.vit;
    if(event){
      log=appendLog(log,`Event: ${event.icon} ${event.name}`);
      // Meteor targeting is deliberately NOT resolved here — it needs its own "Activate
      // Strike" step (see RESOLVE_METEOR) so the dice-roll reveal has something to animate.
      if(event.id==="e4") efx={...efx,demG:4};
      if(event.id==="e5") efx={...efx,demExDouble:true};
      if(event.id==="e6") efx={...efx,demG:2};
      if(event.id==="e7") efx={...efx,bumper:true};
      if(event.id==="e8") efx={...efx,extraCard:true,freeHW:true};
      if(event.id==="e10") efx={...efx,seedsOnly:true};
      if(event.id==="e11") efx={...efx,solarFlare:true,mirrorsDown:true};
      if(event.id==="e12") efx={...efx,embargo:true};
      if(event.id==="e13") vit=Math.max(0,vit-3);
      if(event.id==="e14") vit=Math.min(10,vit+2);
    }
    if(vit<=0) return{...s,evDeck,event,efx,vit:0,meteorHit:null,meteorResolved:false,eventDrawn:true,
      log:appendLog(log,"Earth collapsed."),phase:"gameover",outcome:"collapse",gameoverMsg:"Earth collapsed. Everyone loses."};
    return{...s,evDeck,event,efx,vit,meteorHit:null,meteorResolved:false,eventDrawn:true,log};
  }

  case "RESOLVE_METEOR": {
    if(!s.event||s.event.et!=="meteor"||s.meteorResolved) return s;
    const pi=0|Math.random()*s.players.length;
    const free=s.players[pi].grid.filter(t=>t.dmg===0);
    let meteorHit=null, players=s.players, log=s.log;
    if(free.length){
      const hit=free[0|Math.random()*free.length];
      meteorHit={name:players[pi].name,tile:hit.id,had:!!hit.c};
      players=players.map((p,i)=>i!==pi?p:{...p,grid:p.grid.map(t=>t.id===hit.id?{...t,c:null,dmg:3}:t)});
      log=appendLog(log,`☄️ ${meteorHit.name} Tile ${hit.id} struck!`);
    }
    return{...s,players,meteorHit,meteorResolved:true,log};
  }

  case "DEAL_DRAFT": {
    const n=s.players.length, v=s.vit;
    // Draft size ramps smoothly with Vitality (n at 0 up to n*2+2 at full 10) instead of
    // 3 flat tiers — Earth's shipments shrink proportionally with the damage it's taken.
    // The per-round DRAFT_MIN guarantee below is untouched by this, so a low count never
    // blocks the minimums a round needs — it only thins out the extra/random filler.
    let count=n+Math.round((v/10)*(n+2));
    if(s.efx.extraCard) count+=1;
    const sd=[...s.seedDeck], hd=[...s.hwDeck];
    // Hardware is a small, non-renewable pool — deal ALL currently-unlocked hardware every
    // round instead of randomly sampling it, so "no Irrigator showed up" can never happen.
    // Climate Regulators additionally require a Research slot filled somewhere (rulebook 6.3).
    const hasResearch=s.players.some(p=>p.colony.re.filter(Boolean).length>0);
    const avHW=s.efx.seedsOnly?[]:hd.filter(h=>s.round>=h.avail&&!(v<=3&&h.avail>1)&&(h.hwt!=="cReg"||hasResearch));
    // Seeds: guarantee the per-round minimum of each crop type (see DRAFT_MIN), drawn from
    // that crop's own remaining pile first, then top up to the vitality-based count with
    // random draws from whatever's left.
    const min=DRAFT_MIN[s.round]||{g:0,gr:0,ex:0};
    const seedPicks=[];
    for(const crop of["g","gr","ex"]){
      const need=min[crop]||0;
      seedPicks.push(...sd.filter(c=>c.crop===crop).slice(0,need));
    }
    const pickedIds=new Set(seedPicks.map(c=>c.id));
    const seedTarget=Math.max(count-avHW.length,seedPicks.length);
    const remainder=sd.filter(c=>!pickedIds.has(c.id));
    // Don't let the random "bonus" draw eat cards that LATER rounds' guarantees will need —
    // reserve enough of each crop for every future round's DRAFT_MIN before pulling extras.
    const reserve={g:0,gr:0,ex:0};
    for(let fr=s.round+1;fr<=6;fr++){const fm=DRAFT_MIN[fr]||{g:0,gr:0,ex:0};reserve.g+=fm.g;reserve.gr+=fm.gr;reserve.ex+=fm.ex;}
    const protectedIds=new Set();
    for(const crop of["g","gr","ex"]){
      const avail=remainder.filter(c=>c.crop===crop);
      avail.slice(0,Math.min(reserve[crop]||0,avail.length)).forEach(c=>protectedIds.add(c.id));
    }
    const eligible=remainder.filter(c=>!protectedIds.has(c.id));
    const extra=shuf(eligible).slice(0,Math.max(0,seedTarget-seedPicks.length));
    const seedsPicked=[...seedPicks,...extra];
    const picked=shuf([...avHW,...seedsPicked]);
    const usedS=new Set(seedsPicked.map(c=>c.id));
    const usedH=new Set(avHW.map(c=>c.id));
    // Nobody chooses which card they get — Earth hands them out at random. Card count
    // per player stays fair (each player gets floor/ceil(picked/n) cards) — and when the
    // total doesn't divide evenly, WHO gets the leftover extra card(s) is itself randomized
    // per round, not always the same seat. (Building the recipient list via draftOrder[i%n]
    // and merely shuffling its ORDER does NOT achieve this — the count of each player index
    // in that list is fixed by construction, so draftOrder[0] would win every single odd
    // round. The fix picks the "gets +1" players randomly first, then fills counts.)
    const dOrd=s.draftOrder, dn=dOrd.length;
    const base=Math.floor(picked.length/dn), rem=picked.length%dn;
    const extraSet=new Set(shuf(dOrd).slice(0,rem));
    let recipients=[];
    dOrd.forEach(pi=>{for(let k=0;k<base+(extraSet.has(pi)?1:0);k++) recipients.push(pi);});
    recipients=shuf(recipients);
    let players=s.players;
    picked.forEach((card,i)=>{
      const pi=recipients[i];
      players=players.map((p,idx)=>idx!==pi?p:{...p,hand:[...p.hand,card]});
    });
    return{...s,players,draft:[],seedDeck:sd.filter(c=>!usedS.has(c.id)),hwDeck:hd.filter(c=>!usedH.has(c.id)),
      draftIdx:0,passStreak:0,phase:s.efx.embargo?"engineering":"trade",engIdx:0,tradePile:[],
      log:appendLog(s.log,`Draft: ${picked.length} cards dealt at random.`)};
  }

  case "TRADE_OFFER": {
    if(s.efx.embargo) return s;
    const fromIdx=a.fromIdx, toIdx=a.toIdx;
    if(fromIdx==null||toIdx==null||fromIdx===toIdx) return s;
    const from=s.players[fromIdx];
    if(!from) return s;
    const card=from.hand.find(c=>c.id===a.cardId);
    if(!card) return s;
    const players=s.players.map((p,i)=>i!==fromIdx?p:{...p,hand:p.hand.filter(c=>c.id!==card.id)});
    const tradePile=[...(s.tradePile||[]),{id:card.id,fromIdx,toIdx,card}];
    return{...s,players,tradePile};
  }
  case "TRADE_RETRACT": {
    const entry=(s.tradePile||[]).find(o=>o.id===a.cardId);
    if(!entry) return s;
    const tradePile=s.tradePile.filter(o=>o.id!==a.cardId);
    const players=s.players.map((p,i)=>i!==entry.fromIdx?p:{...p,hand:[...p.hand,entry.card]});
    return{...s,players,tradePile};
  }
  case "TRADE_INITIATE": {
    const pile=s.tradePile||[];
    let players=s.players;
    pile.forEach(o=>{players=players.map((p,i)=>i!==o.toIdx?p:{...p,hand:[...p.hand,o.card]});});
    const log=pile.length
      ? appendLog(s.log, `Trade finalized: ${pile.map(o=>`${s.players[o.fromIdx].name}→${s.players[o.toIdx].name} ${o.card.name}`).join(", ")}`)
      : s.log;
    return{...s,players,tradePile:[],phase:"engineering",engIdx:0,log};
  }

  case "SEL_CARD": return{...s,selCard:s.selCard?.id===a.card.id?null:a.card};

  case "PLACE": {
    const pi=s.engIdx, card=s.selCard;
    if(!card) return s;
    const tile=s.players[pi].grid.find(t=>t.id===a.tileId);
    if(!tile||tile.c||tile.dmg>0) return s;
    const dirs=card.hwt==="uMirror"?["up","right"]:["up"];
    const c=card.t==="seed"?{t:"seed",card,dormant:0}:{t:"hw",card,dirs};
    const players=s.players.map((p,i)=>i!==pi?p:{...p,
      hand:p.hand.filter(h=>h.id!==card.id),
      grid:p.grid.map(t=>t.id===a.tileId?{...t,c}:t)});
    return{...s,players,selCard:null,log:appendLog(s.log,`${s.players[pi].name}: ${card.name}→T${a.tileId}`)};
  }

  case "LIFT": {
    const pi=s.engIdx, tile=s.players[pi].grid.find(t=>t.id===a.tileId);
    if(!tile?.c) return s;
    const isHW=tile.c.t==="hw";
    // Hardware can always be repositioned. A seed can only be picked back up if it was
    // planted THIS round (dormant:0) — once it's survived a harvest attempt and gone
    // dormant, it's a committed risk from an earlier round and can't be undone.
    if(!isHW&&(tile.c.dormant||0)>0) return s;
    const players=s.players.map((p,i)=>i!==pi?p:{...p,
      hand:[...p.hand,tile.c.card],
      grid:p.grid.map(t=>t.id===a.tileId?{...t,c:null}:t)});
    return{...s,players,selCard:null};
  }

  case "SWAP": {
    const pi=s.engIdx, card=s.selCard;
    if(!card) return s;
    const tile=s.players[pi].grid.find(t=>t.id===a.tileId);
    if(!tile||!tile.c||tile.dmg>0) return s;
    const isHW=tile.c.t==="hw";
    // Same eligibility as LIFT — only a same-round, not-yet-harvested seed can be swapped
    // out; hardware can always be swapped since it's always repositionable.
    if(!isHW&&(tile.c.dormant||0)>0) return s;
    const oldCard=tile.c.card;
    const dirs=card.hwt==="uMirror"?["up","right"]:["up"];
    const c=card.t==="seed"?{t:"seed",card,dormant:0}:{t:"hw",card,dirs};
    const players=s.players.map((p,i)=>i!==pi?p:{...p,
      hand:[...p.hand.filter(h=>h.id!==card.id),oldCard],
      grid:p.grid.map(t=>t.id===a.tileId?{...t,c}:t)});
    return{...s,players,selCard:null,log:appendLog(s.log,`${s.players[pi].name}: ${oldCard.name}↔${card.name} T${a.tileId}`)};
  }

  case "SET_DIR": {
    const pi=s.engIdx;
    const players=s.players.map((p,i)=>i!==pi?p:{...p,
      grid:p.grid.map(t=>t.id===a.tileId&&t.c?.t==="hw"?{...t,c:{...t.c,dirs:a.dirs}}:t)});
    return{...s,players};
  }

  case "NEXT_ENG": {
    const next=s.engIdx+1;
    if(next>=s.players.length) return{...s,phase:"harvest",engIdx:0,selCard:null};
    return{...s,engIdx:next,selCard:null};
  }

  case "HARVEST": {
    const hLog=[];
    const players=s.players.map(p=>{
      const tv=computeTiles(p,s.sunPos,s.efx);
      const gained={g:0,gr:0,ex:0};
      const grid=p.grid.map(tile=>{
        if(!tile.c||tile.c.t!=="seed"||tile.dmg>0) return tile;
        const sd=tile.c.card, {l,w}=tv[tile.id];
        if(l>=sd.lr&&w>=sd.wr){
          const yld=sd.yld+(s.efx.bumper?1:0);
          gained[sd.crop]+=yld;
          hLog.push({player:p.name,tile:tile.id,name:sd.name,ok:true,yld,l,w,lr:sd.lr,wr:sd.wr});
          return{...tile,c:null};
        }
        const dormant=(tile.c.dormant||0)+1;
        hLog.push({player:p.name,tile:tile.id,name:sd.name,ok:false,dormant,died:dormant>=3,l,w,lr:sd.lr,wr:sd.wr});
        return dormant>=3?{...tile,c:null}:{...tile,c:{...tile.c,dormant}};
      });
      return{...p,stockpile:{g:p.stockpile.g+gained.g,gr:p.stockpile.gr+gained.gr,ex:p.stockpile.ex+gained.ex},grid};
    });
    const ok=hLog.filter(h=>h.ok).length;
    // Whoever harvested the most crops this round leads next round's draft and banks a
    // round-win toward end-game DP (calcDP). Ties share the lead.
    const counts=players.map(p=>hLog.filter(h=>h.player===p.name&&h.ok).length);
    const maxCount=Math.max(0,...counts);
    const harvestLeaders=maxCount>0?counts.map((c,i)=>c===maxCount?i:-1).filter(i=>i>=0):[];
    const leadPlayers=players.map((p,i)=>harvestLeaders.includes(i)?{...p,roundWins:(p.roundWins||0)+1}:p);
    const leadMsg=harvestLeaders.length?` · 🏆 Lead: ${harvestLeaders.map(i=>players[i].name).join(", ")} (${maxCount})`:"";
    return{...s,players:leadPlayers,harvestResults:hLog,harvestLeaders,phase:"contribute",
      contribs:s.players.map(p=>({id:p.id,ship:{g:0,gr:0,ex:0},invest:{g:0,gr:0,ex:0},done:false})),
      contribIdx:0,contribsRevealed:false,
      log:appendLog(s.log,`Harvest: ${ok} crops collected${leadMsg}`)};
  }

  case "SUBMIT": {
    const contribs=s.contribs.map(c=>c.id===a.id?{...c,...a.data,done:true}:c);
    return{...s,contribs,contribIdx:s.contribIdx+1};
  }

  case "REVEAL": {
    const tot={g:0,gr:0,ex:0};
    s.contribs.forEach(c=>{tot.g+=c.ship.g;tot.gr+=c.ship.gr;tot.ex+=c.ship.ex;});
    const base=DEMAND[s.round]||{g:0,gr:0,ex:0};
    const dem={g:base.g+s.efx.demG,gr:base.gr,ex:s.efx.demExDouble?base.ex*2:base.ex};
    const mG=tot.g>=dem.g, mGr=tot.gr>=dem.gr, mEx=tot.ex>=dem.ex, allMet=mG&&mGr&&mEx;
    let vd=0;
    if(!allMet){vd=-1;if(!mG&&dem.g>0)vd--;if(!mGr&&dem.gr>0)vd--;if(!mEx&&dem.ex>0)vd--;vd=Math.max(-4,vd);}
    else if((tot.g-dem.g)+(tot.gr-dem.gr)+(tot.ex-dem.ex)>0) vd=1;
    const newVit=Math.min(10,Math.max(0,s.vit+vd));

    // deduct ships, apply invests
    let players=s.players.map(p=>{
      const c=s.contribs.find(x=>x.id===p.id);
      let sp={g:p.stockpile.g-c.ship.g,gr:p.stockpile.gr-c.ship.gr,ex:p.stockpile.ex-c.ship.ex};
      let col={...p.colony,ls:[...p.colony.ls],ag:[...p.colony.ag],re:[...p.colony.re]};
      let{g:ig,gr:igr,ex:iex}=c.invest;
      while(ig>0){const i=col.ls.findIndex(x=>!x);if(i<0)break;col.ls[i]="x";sp.g--;ig--;}
      while(igr>0){const i=col.ag.findIndex(x=>!x);if(i<0)break;col.ag[i]="x";if(i===1&&!col.agriWater)col.agriWater=5;sp.gr--;igr--;}
      while(iex>0){const i=col.re.findIndex(x=>!x);if(i<0)break;col.re[i]="x";sp.ex--;iex--;}
      return{...p,stockpile:sp,colony:col};
    });
    const log=appendLog(s.log,`Ships G${tot.g}/${dem.g} Gr${tot.gr}/${dem.gr} Ex${tot.ex}/${dem.ex} → Vit${vd>=0?"+":""}${vd}=${newVit}`);
    const shipResult={tot,dem,mG,mGr,mEx,allMet,vd,newVit};
    if(newVit<=0) return{...s,players,contribsRevealed:true,shipResult,vit:0,log,phase:"gameover",outcome:"collapse",gameoverMsg:"Earth collapsed. Everyone loses."};
    return{...s,players,contribsRevealed:true,shipResult,vit:newVit,log};
  }

  case "END_ROUND": {
    for(const p of s.players){
      if(p.colony.ls.every(Boolean)&&p.colony.ag.every(Boolean)&&p.colony.re.every(Boolean))
        return{...s,phase:"gameover",outcome:"selfsuff",gameoverMsg:`${p.name} achieved self-sufficiency — Instant Win!`,winner:p.name};
    }
    if(s.round>=6){
      const sc=s.players.map(p=>({name:p.name,dp:calcDP(p,s.vit)})).sort((a,b)=>b.dp-a.dp);
      return{...s,phase:"gameover",outcome:"earthsaved",gameoverMsg:`Game over! ${sc.map(x=>`${x.name}: ${x.dp}DP`).join(" · ")}`,winner:sc[0].name};
    }
    // This round's harvest leader(s) get first pick in next round's draft; everyone else
    // keeps their existing relative order behind them.
    const leaders=s.harvestLeaders||[];
    const rest=s.players.map((_,i)=>i).filter(i=>!leaders.includes(i));
    const draftOrder=[...leaders,...rest];
    return startRound({...s,round:s.round+1,contribIdx:0,contribsRevealed:false,selCard:null,engIdx:0,
      draftOrder,
      contribs:s.players.map(p=>({id:p.id,ship:{g:0,gr:0,ex:0},invest:{g:0,gr:0,ex:0},done:false}))});
  }

  // Wholesale replace — used when a Firestore snapshot arrives from a remote peer.
  // Not something a player triggers; it's how the two browsers stay in sync.
  case "__SET_REMOTE_STATE__": return a.state;

  default: return s;
  }
}

// ── Styled helpers ────────────────────────────────────────
const CC={g:"#4ade80",gr:"#facc15",ex:"#c084fc"};
const CL={g:"Greens",gr:"Grain",ex:"Exotic"};
// NOTE: these must be real style objects, not CSS strings — `style={S.panel}` needs an
// object, and `{...S.panel}` spread on a string silently produces numeric-indexed
// characters instead of CSS properties (no crash, but every style below was being dropped).
// Retro 8-bit tokens: sharp pixel corners (no border-radius), pixel font on headers/
// buttons/chrome only — body text, tables, and logs stay in monospace, since Press Start
// 2P at reading sizes is a legibility disaster. `PIXEL` is the shared font-family string.
const PIXEL="'Press Start 2P',monospace";
const S={
  page:{background:"#02040a",minHeight:"100vh",fontFamily:"monospace",color:"#c0ccdd"},
  card:(crop)=>({background:crop==="g"?"#052010":crop==="gr"?"#1a1000":"#0f0518",border:`1px solid ${CC[crop]||"#334"}`,borderRadius:2,padding:"6px 8px",cursor:"pointer"}),
  hw:{background:"#060d1a",border:"1px solid #1e3a5a",borderRadius:2,padding:"6px 8px",cursor:"pointer"},
  btn:{fontFamily:PIXEL,fontSize:10,lineHeight:1.6,background:"#134e4a",color:"#99f6e4",border:"2px solid #0d9488",borderRadius:2,padding:"10px 14px",cursor:"pointer",boxShadow:"3px 3px 0 #042f2e",letterSpacing:0.5},
  btnSm:{fontFamily:PIXEL,fontSize:8,lineHeight:1.6,background:"#1e3a5a",color:"#93c5fd",border:"2px solid #1d4ed8",borderRadius:2,padding:"7px 10px",cursor:"pointer",boxShadow:"2px 2px 0 #0c1e3a"},
  panel:{background:"rgba(10,15,28,0.88)",border:"2px solid #1e2d3d",borderRadius:2,padding:12},
  label:{fontSize:10,color:"#607890",letterSpacing:1,textTransform:"uppercase"},
  h2:{fontFamily:PIXEL,fontSize:12,fontWeight:"normal",color:"#40d9c4",marginBottom:10,letterSpacing:0.5,lineHeight:1.6},
  teal:{color:"#40d9c4",fontWeight:"bold"},
  dim:{color:"#607890",fontSize:11},
};

// ── 8-bit pixel spaceship sprite ─────────────────────────────
// Each character is one "pixel"; row length must stay consistent (7 across).
const SHIP_SPRITE=[
  "..ccc..",
  ".ccccc.",
  ".cabac.",
  ".cabac.",
  "ccabacc",
  "ccayacc",
  "ccabacc",
  "rcabacr",
  "rr.b.rr",
  "..fff..",
];
const SHIP_COLORS={c:"#1e3a8a",a:"#e2e8f0",b:"#60a5fa",y:"#fde047",r:"#f97316",f:"#fb923c"};
function PixelShip({size=12,still=false}){
  return(
    <div style={{animation:still?undefined:"sfp-bob 2.2s ease-in-out infinite",display:"inline-block"}}>
      <div style={{display:"grid",gridTemplateColumns:`repeat(7,${size}px)`,gridTemplateRows:`repeat(${SHIP_SPRITE.length},${size}px)`,gap:1}}>
        {SHIP_SPRITE.flatMap((row,ri)=>row.split("").map((ch,ci)=>(
          <div key={`${ri}-${ci}`} style={{
            width:size,height:size,
            background:ch==="."?"transparent":SHIP_COLORS[ch],
            animation:!still&&ch==="f"?"sfp-flame 0.3s steps(2) infinite":undefined,
            boxShadow:ch==="y"?"0 0 4px #fde047":undefined,
          }}/>
        )))}
      </div>
    </div>
  );
}

// ── Starfield background (shared by every screen, not just loading) ─────────
// Three star layers (far/dim -> near/bright) drifting at different speeds for a subtle
// parallax depth effect, plus a faint nebula haze behind everything for atmosphere.
const STAR_LAYER_FAR="radial-gradient(0.88px 0.88px at 231px 443px,#c7d2fe,transparent),radial-gradient(1.03px 1.03px at 231px 260px,#fff,transparent),radial-gradient(0.84px 0.84px at 411px 262px,#fff,transparent),radial-gradient(0.82px 0.82px at 95px 48px,#fff,transparent),radial-gradient(1.05px 1.05px at 275px 414px,#fff,transparent),radial-gradient(1.08px 1.08px at 304px 202px,#fff,transparent),radial-gradient(0.68px 0.68px at 315px 332px,#fff,transparent),radial-gradient(0.63px 0.63px at 270px 32px,#fff,transparent),radial-gradient(0.62px 0.62px at 123px 307px,#fff,transparent),radial-gradient(1.02px 1.02px at 225px 302px,#fff,transparent),radial-gradient(0.85px 0.85px at 327px 150px,#fff,transparent),radial-gradient(0.74px 0.74px at 234px 335px,#dbe4ff,transparent),radial-gradient(0.76px 0.76px at 362px 130px,#fff,transparent),radial-gradient(0.64px 0.64px at 147px 15px,#c7d2fe,transparent),radial-gradient(0.75px 0.75px at 55px 433px,#fff,transparent),radial-gradient(0.94px 0.94px at 8px 433px,#fff,transparent),radial-gradient(0.63px 0.63px at 474px 466px,#fff,transparent),radial-gradient(0.81px 0.81px at 362px 203px,#fff,transparent),radial-gradient(0.94px 0.94px at 101px 398px,#fff,transparent),radial-gradient(0.61px 0.61px at 159px 170px,#fff,transparent),radial-gradient(0.67px 0.67px at 472px 60px,#fff,transparent),radial-gradient(0.83px 0.83px at 5px 30px,#fff,transparent),radial-gradient(0.69px 0.69px at 349px 286px,#fff,transparent),radial-gradient(0.67px 0.67px at 374px 393px,#fff,transparent),radial-gradient(0.81px 0.81px at 59px 202px,#fff,transparent),radial-gradient(1.09px 1.09px at 138px 442px,#c7d2fe,transparent),radial-gradient(0.71px 0.71px at 453px 10px,#fff,transparent),radial-gradient(0.92px 0.92px at 437px 308px,#fff,transparent),radial-gradient(0.82px 0.82px at 74px 109px,#fff,transparent),radial-gradient(1.02px 1.02px at 312px 168px,#fff,transparent),radial-gradient(0.7px 0.7px at 38px 46px,#fff,transparent),radial-gradient(0.78px 0.78px at 7px 307px,#fff,transparent),radial-gradient(0.89px 0.89px at 65px 491px,#dbe4ff,transparent),radial-gradient(0.69px 0.69px at 443px 197px,#fff,transparent),radial-gradient(1.01px 1.01px at 465px 116px,#fff,transparent),radial-gradient(0.97px 0.97px at 97px 81px,#dbe4ff,transparent),radial-gradient(0.79px 0.79px at 351px 486px,#fff,transparent),radial-gradient(0.62px 0.62px at 40px 215px,#fff,transparent),radial-gradient(0.73px 0.73px at 262px 492px,#fff,transparent),radial-gradient(0.81px 0.81px at 200px 131px,#c7d2fe,transparent),radial-gradient(0.69px 0.69px at 150px 266px,#fff,transparent)";
const STAR_LAYER_MID="radial-gradient(1.02px 1.02px at 71px 124px,#fde047,transparent),radial-gradient(1.52px 1.52px at 359px 61px,#fde047,transparent),radial-gradient(1.67px 1.67px at 118px 137px,#fff,transparent),radial-gradient(1.65px 1.65px at 307px 91px,#60a5fa,transparent),radial-gradient(1.4px 1.4px at 362px 24px,#fff,transparent),radial-gradient(1.3px 1.3px at 135px 159px,#fff,transparent),radial-gradient(1.37px 1.37px at 57px 298px,#f0abfc,transparent),radial-gradient(1.23px 1.23px at 31px 357px,#fff,transparent),radial-gradient(1.22px 1.22px at 94px 201px,#f0abfc,transparent),radial-gradient(1.2px 1.2px at 263px 72px,#fff,transparent),radial-gradient(1.3px 1.3px at 354px 94px,#fff,transparent),radial-gradient(1.65px 1.65px at 16px 214px,#fff,transparent),radial-gradient(1.28px 1.28px at 264px 209px,#fde047,transparent),radial-gradient(1.26px 1.26px at 157px 288px,#60a5fa,transparent),radial-gradient(1.39px 1.39px at 294px 304px,#fff,transparent),radial-gradient(1.63px 1.63px at 387px 344px,#fff,transparent),radial-gradient(1.25px 1.25px at 46px 227px,#fff,transparent),radial-gradient(1.65px 1.65px at 206px 29px,#f0abfc,transparent),radial-gradient(1.0px 1.0px at 122px 205px,#fff,transparent),radial-gradient(1.02px 1.02px at 99px 87px,#fff,transparent),radial-gradient(1.64px 1.64px at 91px 168px,#60a5fa,transparent),radial-gradient(1.37px 1.37px at 18px 32px,#f0abfc,transparent),radial-gradient(1.46px 1.46px at 378px 103px,#fff,transparent),radial-gradient(1.09px 1.09px at 99px 210px,#fff,transparent)";
const STAR_LAYER_NEAR="radial-gradient(2.11px 2.11px at 292px 85px,#60a5fa,transparent),radial-gradient(2.3px 2.3px at 245px 333px,#fde047,transparent),radial-gradient(2.35px 2.35px at 333px 315px,#fff,transparent),radial-gradient(1.98px 1.98px at 351px 270px,#fff,transparent),radial-gradient(1.66px 1.66px at 344px 325px,#fff,transparent),radial-gradient(2.32px 2.32px at 265px 254px,#60a5fa,transparent),radial-gradient(2.04px 2.04px at 143px 163px,#fde047,transparent),radial-gradient(2.38px 2.38px at 28px 163px,#fff,transparent),radial-gradient(2.2px 2.2px at 109px 33px,#fff,transparent),radial-gradient(2.01px 2.01px at 164px 124px,#fff,transparent)";
function Starfield(){
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:"-10%",
        background:"radial-gradient(ellipse 60% 40% at 25% 30%,rgba(88,60,140,0.16),transparent 70%),radial-gradient(ellipse 55% 45% at 75% 70%,rgba(20,90,110,0.14),transparent 70%)",
      }}/>
      <div style={{position:"absolute",inset:0,backgroundImage:STAR_LAYER_FAR,backgroundSize:"500px 500px",backgroundRepeat:"repeat",animation:"sfp-stars 140s linear infinite",opacity:0.55}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:STAR_LAYER_MID,backgroundSize:"420px 420px",backgroundRepeat:"repeat",animation:"sfp-stars 90s linear infinite",opacity:0.75}}/>
      <div style={{position:"absolute",inset:0,backgroundImage:STAR_LAYER_NEAR,backgroundSize:"380px 380px",backgroundRepeat:"repeat",animation:"sfp-stars 55s linear infinite",opacity:0.85}}/>
    </div>
  );
}

// ── Volume control ────────────────────────────────────────
function VolumeControl({volume,muted,onVolume,onMute,dark}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <span onClick={onMute} style={{cursor:"pointer",fontSize:16}}>{muted||volume===0?"🔇":volume<0.5?"🔉":"🔊"}</span>
      <input type="range" min={0} max={1} step={0.05} value={muted?0:volume}
        onChange={e=>onVolume(+e.target.value)}
        style={{width:80,accentColor:"#40d9c4"}}/>
    </div>
  );
}

// ── Loading / intro screen ───────────────────────────────────
function LoadingScreen({onBegin,volume,muted,onVolume,onMute,onUnlockAudio}){
  const[slid,setSlid]=useState(false);
  const[engaged,setEngaged]=useState(false);
  const[landed,setLanded]=useState(false);
  useEffect(()=>{
    // inject the pixel font once, self-contained (no reliance on host index.html)
    if(!document.getElementById("sfp-pixel-font")){
      const link=document.createElement("link");
      link.id="sfp-pixel-font";
      link.rel="stylesheet";
      link.href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
      document.head.appendChild(link);
    }
    if(!document.getElementById("sfp-anim-style")){
      const style=document.createElement("style");
      style.id="sfp-anim-style";
      style.textContent=`
        @keyframes sfp-slidedown{from{transform:translateY(-100%);}to{transform:translateY(0);}}
        @keyframes sfp-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}
        @keyframes sfp-flame{0%{opacity:1;}100%{opacity:0.4;}}
        @keyframes sfp-blink{0%,100%{opacity:1;}50%{opacity:0.2;}}
        @keyframes sfp-stars{from{background-position:0 0;}to{background-position:0 -1000px;}}
        @keyframes sfp-shipdrop{from{transform:translateY(-160px);opacity:0;}to{transform:translateY(0);opacity:1;}}
        @keyframes sfp-fadein{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        button:active{transform:translate(2px,2px);box-shadow:none!important;}
        ::selection{background:#0d9488;color:#02040a;}
        :root{--sfp-cursor:${CURSOR_HAND};}
        *{cursor:var(--sfp-cursor) !important;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;}
        img{-webkit-user-drag:none;user-drag:none;}
        input[type="text"]{cursor:text !important;-webkit-user-select:text;user-select:text;}
      `;
      document.head.appendChild(style);
    }
    const t=setTimeout(()=>setSlid(true),40);
    return()=>clearTimeout(t);
  },[]);
  const starBg={
    backgroundImage:"radial-gradient(1px 1px at 20px 30px,#fff,transparent),radial-gradient(1px 1px at 90px 120px,#fff,transparent),radial-gradient(1.5px 1.5px at 160px 60px,#fde047,transparent),radial-gradient(1px 1px at 210px 200px,#fff,transparent),radial-gradient(1px 1px at 55px 190px,#fff,transparent),radial-gradient(1.5px 1.5px at 260px 40px,#60a5fa,transparent)",
    backgroundSize:"300px 300px",backgroundRepeat:"repeat",animation:"sfp-stars 40s linear infinite",
  };
  const engage=()=>{if(!engaged){onUnlockAudio();setEngaged(true);setTimeout(()=>setLanded(true),3000);}};
  return(
    <div onClick={engage} style={{
      position:"fixed",inset:0,background:"#02040a",display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",transform:"translateY(-100%)",
      animation:slid?"sfp-slidedown 800ms cubic-bezier(.2,.7,.3,1) forwards":undefined,
      zIndex:50,fontFamily:"monospace",
    }}>
      <div style={{position:"absolute",inset:0,...starBg}}/>
      <div style={{position:"absolute",top:16,right:20}}>
        <VolumeControl volume={volume} muted={muted} onVolume={onVolume} onMute={onMute}/>
      </div>
      <div style={{position:"relative",textAlign:"center"}}>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:22,color:"#40d9c4",letterSpacing:2,textShadow:"3px 3px 0 #134e4a",marginBottom:8}}>SPACE</div>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:22,color:"#fde047",letterSpacing:2,textShadow:"3px 3px 0 #a16207",marginBottom:engaged?28:8}}>FARMER PRO</div>
        {!engaged&&<div style={{fontFamily:"'Press Start 2P',monospace",fontSize:11,color:"#40d9c4",letterSpacing:1,marginTop:20,animation:"sfp-blink 1.4s ease-in-out infinite"}}>▶ CLICK TO START</div>}
        {engaged&&<div style={{marginBottom:28,animation:"sfp-shipdrop 3000ms cubic-bezier(.2,.7,.3,1) both"}}><PixelShip/></div>}
        {engaged&&<div style={{
          opacity:landed?1:0,transform:landed?"translateY(0)":"translateY(8px)",
          transition:"opacity 500ms ease-out, transform 500ms ease-out",pointerEvents:landed?"auto":"none",
        }}>
          <button onClick={onBegin} style={{
            fontFamily:"'Press Start 2P',monospace",fontSize:13,color:"#99f6e4",background:"#134e4a",
            border:"2px solid #0d9488",borderRadius:2,padding:"14px 22px",cursor:"pointer",
            animation:"sfp-blink 1.6s ease-in-out infinite",letterSpacing:1,
          }}>▶ BEGIN MISSION</button>
          <div style={{color:"#374151",fontSize:11,marginTop:16}}>Earth is dying. You are its last hope.</div>
        </div>}
      </div>
    </div>
  );
}

// ── Remote play: connect / waiting screens ──────────────────
function ConnectScreen({onLocal,onCreate,onJoin,volume,muted,onVolume,onMute}){
  const[mode,setMode]=useState(null); // null | "join"
  const[codeInput,setCodeInput]=useState("");
  return(
    <div style={{background:"#02040a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,position:"relative"}}>
      <Starfield/>
      <div style={{position:"absolute",top:16,right:20}}>
        <VolumeControl volume={volume} muted={muted} onVolume={onVolume} onMute={onMute}/>
      </div>
      <div style={{...S.panel,width:"100%",maxWidth:420,border:"2px solid #134e4a",boxShadow:"0 0 24px rgba(19,78,74,0.4)"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontFamily:PIXEL,fontSize:13,color:"#40d9c4",letterSpacing:1,lineHeight:1.8}}>HOW ARE YOU<br/>PLAYING?</div>
        </div>
        {mode===null&&(
          <>
            <button onClick={onLocal} style={{...S.btn,width:"100%",marginBottom:10}}>🖥️ Same Device (Hotseat)</button>
            <button onClick={onCreate} style={{...S.btn,width:"100%",marginBottom:10,background:"#0d3d38"}}>🌍 Create Online Room</button>
            <button onClick={()=>setMode("join")} style={{...S.btn,width:"100%",background:"#0d3d38"}}>🔑 Join Online Room</button>
            <div style={{fontSize:10,color:"#4b5563",marginTop:14,lineHeight:1.6}}>Online play is built for two people, each on their own device. Same-device hotseat still supports 2-4 players.</div>
          </>
        )}
        {mode==="join"&&(
          <>
            <div style={{fontSize:11,color:"#607890",marginBottom:8}}>Enter the room code your friend sent you:</div>
            <input value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase().slice(0,5))}
              style={{...S.panel,width:"100%",textAlign:"center",fontSize:20,letterSpacing:6,marginBottom:10,color:"#c0ccdd",boxSizing:"border-box"}}
              placeholder="ABCDE"/>
            <button onClick={()=>onJoin(codeInput)} disabled={codeInput.length<5}
              style={{...S.btn,width:"100%",opacity:codeInput.length<5?0.4:1,cursor:codeInput.length<5?"default":"pointer"}}>Join →</button>
            <button onClick={()=>setMode(null)} style={{...S.btnSm,width:"100%",marginTop:8}}>← Back</button>
          </>
        )}
      </div>
    </div>
  );
}
function RoomWaiting({roomCode,volume,muted,onVolume,onMute}){
  return(
    <div style={{background:"#02040a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16,position:"relative"}}>
      <Starfield/>
      <div style={{position:"absolute",top:16,right:20}}>
        <VolumeControl volume={volume} muted={muted} onVolume={onVolume} onMute={onMute}/>
      </div>
      <div style={{...S.panel,width:"100%",maxWidth:420,textAlign:"center",border:"2px solid #134e4a"}}>
        <div style={{fontFamily:PIXEL,fontSize:12,color:"#40d9c4",marginBottom:16,lineHeight:1.8}}>WAITING FOR HOST</div>
        <div style={{color:"#607890",fontSize:12,marginBottom:16}}>You're connected to room <b style={{color:"#facc15"}}>{roomCode}</b>. The game will appear as soon as your friend finishes setting it up.</div>
        <PixelShip/>
      </div>
    </div>
  );
}

// ── Story + how-to-play intro ─────────────────────────────
const STORY_PAGES=[
  {img:"earth",lines:["Earth is dying.","Catastrophic warming. Failing harvests. Billions starving."]},
  {img:"earth",lines:["You are part of the Exodus Project —","a last chance to build self-sustaining colonies in the asteroid belt."]},
  {img:"asteroid",lines:["Earth sends you seeds and technology.","In return, you must ship food back to keep it alive."]},
  {img:"asteroid",lines:["But every resource you send home is one you could keep for yourself.","Build too slowly and you fall behind. Hoard too much, and Earth collapses — taking everyone with it."]},
];
const HOWTO_PAGES=[
  {title:"HOW TO PLAY — GROWING",bullets:[
    "Each round: Draft seeds & hardware → Trade → Engineer your grid → Harvest.",
    "Crops need enough Light ☀ and Water 💧 on their tile to mature — check both before you plant.",
    "A crop that falls short goes dormant. Three dormant rounds in a row and it dies.",
  ]},
  {title:"HOW TO PLAY — WINNING",bullets:[
    "Ship harvested crops to Earth to keep its Vitality up — fall short and Earth weakens.",
    "Or invest crops in your Colony Board instead, for Development Points.",
    "Fill all three Colony tracks completely for an instant win — but Earth must still survive for anyone to win at all.",
  ]},
];
function IntroStory({onDone}){
  const[page,setPage]=useState(0);
  const total=STORY_PAGES.length+HOWTO_PAGES.length;
  const isStory=page<STORY_PAGES.length;
  const sp=isStory?STORY_PAGES[page]:null;
  const hp=!isStory?HOWTO_PAGES[page-STORY_PAGES.length]:null;
  const next=()=>page+1>=total?onDone():setPage(p=>p+1);
  return(
    <div style={{position:"fixed",inset:0,background:"#02040a",overflow:"hidden",fontFamily:"monospace"}}>
      <Starfield/>
      <button onClick={onDone} style={{position:"absolute",top:16,right:20,...S.btnSm,background:"transparent",border:"1px solid #1e2d3d",color:"#607890",zIndex:5}}>Skip Intro →</button>
      {isStory&&(
        <>
          <img src={sp.img==="earth"?IMG_EARTH:IMG_ASTEROID} alt="" draggable={false}
            style={sp.img==="earth"
              ?{position:"absolute",left:"50%",bottom:"-30%",transform:"translateX(-50%)",width:"min(900px,110vw)"}
              :{position:"absolute",left:"50%",top:"54%",transform:"translate(-50%,-50%)",width:"min(520px,70vw)"}}/>
          <div style={{position:"absolute",top:"14%",left:"50%",transform:"translateX(-50%)",width:"min(720px,84vw)",textAlign:"center"}}>
            {sp.lines.map((l,i)=>(
              <div key={i} style={{fontSize:18,color:"#e8edf5",lineHeight:1.7,textShadow:"0 2px 10px rgba(0,0,0,0.9)",marginBottom:8}}>{l}</div>
            ))}
          </div>
        </>
      )}
      {!isStory&&(
        <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"min(640px,86vw)"}}>
          <div style={{fontFamily:PIXEL,fontSize:14,color:"#40d9c4",marginBottom:22,textAlign:"center",lineHeight:1.8}}>{hp.title}</div>
          {hp.bullets.map((b,i)=>(
            <div key={i} style={{...S.panel,marginBottom:10,fontSize:13,color:"#c0ccdd",lineHeight:1.6}}>▸ {b}</div>
          ))}
        </div>
      )}
      <div style={{position:"absolute",bottom:30,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <button onClick={next} style={{...S.btn,fontSize:11}}>{page+1>=total?"▶ Start Mission":"Continue →"}</button>
        <div style={{display:"flex",gap:5}}>
          {Array.from({length:total}).map((_,i)=>(
            <div key={i} style={{width:6,height:6,borderRadius:3,background:i===page?"#40d9c4":"#1e2d3d"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Vitality bar ──────────────────────────────────────────
function VitBar({v}){
  const col=v>=7?"#22c55e":v>=4?"#eab308":v>=1?"#f97316":"#ef4444";
  const label=v>=7?"Stable":v>=4?"Struggling":v>=1?"Crisis":"DEAD";
  return(
    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{fontSize:10,color:"#607890",letterSpacing:2}}>VITALITY</span>
      <div style={{display:"flex",gap:2}}>
        {Array.from({length:10},(_,i)=><div key={i} style={{width:14,height:14,borderRadius:2,background:i<v?col:"#1a2030"}}/>)}
      </div>
      <span style={{fontSize:11,color:col,fontWeight:"bold"}}>{v}/10 {label}</span>
    </div>
  );
}

// ── Sun dial visual ───────────────────────────────────────
function SunDial({pos}){
  const sun=SUN[pos%4];
  return(
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,width:"100%",maxWidth:180}}>
      {[1,2,3,4,5,6,7,8,9].map(t=>{
        const type=sun.core.includes(t)?"core":sun.edge.includes(t)?"edge":"shadow";
        const bg=type==="core"?"rgba(234,179,8,0.25)":type==="edge"?"rgba(234,179,8,0.08)":"rgba(20,25,40,0.8)";
        const col=type==="core"?"#fde047":type==="edge"?"#78716c":"#374151";
        return<div key={t} style={{background:bg,border:type==="core"?"1px solid rgba(253,224,71,0.4)":"1px solid transparent",borderRadius:2,padding:"7px 0",textAlign:"center",fontSize:14,color:col,fontWeight:"bold"}}>{t}</div>;
      })}
    </div>
  );
}

// ── Meteor strike dice-roll reveal ─────────────────────────
function MeteorReveal({meteorHit, meteorResolved, players}){
  const[stage,setStage]=useState("idle");
  const[flickName,setFlickName]=useState("");
  const[flickTile,setFlickTile]=useState(1);
  useEffect(()=>{
    if(!meteorResolved){ setStage("idle"); return; }
    setStage("player");
    let n=0;
    const iv1=setInterval(()=>{
      n++; setFlickName(players[0|Math.random()*players.length].name);
      if(n>=8){
        clearInterval(iv1);
        setStage("tile");
        let m=0;
        const iv2=setInterval(()=>{
          m++; setFlickTile(1+(0|Math.random()*9));
          if(m>=8){clearInterval(iv2); setStage("done");}
        },90);
      }
    },90);
    return()=>clearInterval(iv1);
  },[meteorResolved]);
  if(stage==="idle") return null;
  return(
    <div style={{marginTop:10,padding:8,background:"rgba(127,29,29,0.15)",border:"1px solid #7f1d1d",borderRadius:2}}>
      <div style={{fontSize:11,color:"#f87171",marginBottom:4}}>☄️ Impact roll</div>
      <div style={{fontSize:13,color:"#fca5a5"}}>Player (d4): {stage==="player"?flickName:meteorHit?.name||"—"}</div>
      <div style={{fontSize:13,color:"#fca5a5"}}>Zone (d10): {stage==="player"?"—":stage==="tile"?`T${flickTile}`:meteorHit?`T${meteorHit.tile}`:"10 (miss)"}</div>
      {stage==="done"&&<div style={{fontSize:11,color:"#f87171",marginTop:4}}>{meteorHit?(meteorHit.had?"Contents destroyed. ":"Was empty. ")+"Zone blocked 3 rounds.":"Roll of 10 — miss, no effect."}</div>}
    </div>
  );
}

// ── Player grid ───────────────────────────────────────────
function Grid({player,sunPos,efx,isActive,selCard,onPlace,onLift,onSwap,onSetDir}){
  const tv=useMemo(()=>computeTiles(player,sunPos,efx),[player,sunPos,efx]);
  const sun=SUN[sunPos%4];
  const[hoverId,setHoverId]=useState(null);
  return(
    <div>
      <div style={{fontSize:11,color:isActive?"#40d9c4":"#607890",marginBottom:4}}>
        {isActive?"▶ ":""}{player.name}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>
        {player.grid.map(tile=>{
          const{l,w}=tv[tile.id];
          const dmg=tile.dmg>0;
          const sunT=sun.core.includes(tile.id)?"core":sun.edge.includes(tile.id)?"edge":"shadow";
          const bg=dmg?"rgba(180,30,30,0.15)":sunT==="core"?"rgba(120,80,0,0.15)":sunT==="edge"?"rgba(20,28,45,0.9)":"rgba(8,12,20,0.9)";
          const bc=dmg?"#7f1d1d":sunT==="core"?"rgba(161,98,7,0.4)":"#1e2d3d";
          const canPlace=isActive&&selCard&&!tile.c&&!dmg;
          const canLift=isActive&&tile.c&&!dmg&&(tile.c.t==="hw"||(tile.c.dormant||0)===0);
          const canSwap=selCard&&canLift;
          return(
            <div key={tile.id}
              onClick={()=>canPlace?onPlace(tile.id):canSwap?onSwap(tile.id):canLift?onLift(tile.id):null}
              onMouseEnter={()=>setHoverId(tile.id)} onMouseLeave={()=>setHoverId(null)}
              style={{background:bg,border:`1px solid ${canPlace?"#0d9488":canSwap?"#a16207":bc}`,borderRadius:2,padding:"4px 5px",minHeight:66,cursor:canPlace||canLift?"pointer":"default",position:"relative",boxSizing:"border-box"}}>
              <div style={{fontSize:9,color:"#374151"}}>{tile.id}</div>
              {dmg&&<div style={{color:"#f87171",fontSize:10}}>☄️{tile.dmg}r</div>}
              {!dmg&&tile.c&&(
                <div style={{marginTop:2}}>
                  {tile.c.t==="seed"&&(
                    <>
                      <div style={{fontSize:10,fontWeight:"bold",color:CC[tile.c.card.crop],wordBreak:"break-word"}}>{tile.c.card.name}</div>
                      <div style={{fontSize:9,color:"#607890"}}>L{tile.c.card.lr}W{tile.c.card.wr}</div>
                      {(tile.c.dormant||0)>0&&<div style={{fontSize:9,color:"#f97316"}}>💤{tile.c.dormant}/3</div>}
                    </>
                  )}
                  {tile.c.t==="hw"&&(
                    <>
                      <div style={{fontSize:10,fontWeight:"bold",color:"#93c5fd",wordBreak:"break-word"}}>{tile.c.card.name}</div>
                      {(tile.c.card.hwt==="bMirror"||tile.c.card.hwt==="uMirror")&&isActive&&(
                        <div style={{display:"flex",gap:2,flexWrap:"wrap",marginTop:2}}>
                          {["U","R","D","L"].map((label,i)=>{
                            const dir=["up","right","down","left"][i];
                            const sel=(tile.c.dirs||[]).includes(dir);
                            return<button key={dir} onClick={e=>{e.stopPropagation();
                              const cur=tile.c.dirs||[], max=tile.c.card.hwt==="uMirror"?2:1;
                              const nd=sel?cur.filter(x=>x!==dir):[...cur,dir].slice(-max);
                              onSetDir(tile.id,nd);
                            }} style={{fontSize:9,padding:"4px 6px",background:sel?"#854d0e":"#1e3a5a",color:sel?"#fde047":"#93c5fd",border:"none",borderRadius:2,cursor:"pointer"}}>{label}</button>;
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <div style={{position:"absolute",bottom:3,right:3,display:"flex",gap:3,fontSize:10}}>
                <span style={{color:"#facc15"}}>☀{l}</span>
                <span style={{color:"#60a5fa"}}>💧{w}</span>
              </div>
              {hoverId===tile.id&&tile.c&&(
                <div style={{position:"absolute",bottom:"calc(100% + 9px)",left:"50%",transform:"translateX(-50%)",
                  background:"#0a0f1c",border:"1px solid #40d9c4",borderRadius:2,padding:"9px 11px",
                  fontSize:12,color:"#c0ccdd",width:220,lineHeight:1.5,zIndex:200,textAlign:"left",
                  boxShadow:"0 6px 16px rgba(0,0,0,0.6)",pointerEvents:"none"}}>
                  {tile.c.t==="hw"?hwFullDesc(tile.c.card):seedFullDesc(tile.c.card)}
                  <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",width:0,height:0,
                    borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"6px solid #40d9c4"}}/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Colony display ────────────────────────────────────────
function Colony({player}){
  const{ls,ag,re}=player.colony;
  const Track=({slots,dpEach,col,label})=>(
    <div style={{marginBottom:6}}>
      <div style={{fontSize:10,color:col,marginBottom:2}}>{label} <span style={{color:"#607890"}}>×{dpEach}DP</span></div>
      <div style={{display:"flex",gap:3}}>
        {slots.map((s,i)=><div key={i} style={{width:18,height:18,borderRadius:0,border:`1px solid ${s?"#4b5563":"#1e2d3d"}`,background:s?"#374151":"#0a0f1c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:s?"#d1d5db":"transparent"}}>✓</div>)}
      </div>
    </div>
  );
  return(
    <div>
      <Track slots={ls} dpEach={1} col="#4ade80" label="🌿 Life Support"/>
      <Track slots={ag} dpEach={2} col="#facc15" label="🌾 Agriculture"/>
      <Track slots={re} dpEach={4} col="#c084fc" label="✨ Research"/>
      {player.colony.agriWater&&<div style={{fontSize:10,color:"#60a5fa"}}>★ +1W tile {player.colony.agriWater}</div>}
    </div>
  );
}

// ── Per-player trade hand — offer a card into the shared trade pile ───────
function PlayerTradeHand({player,others,interactive,onOffer}){
  const[toIdx,setToIdx]=useState(others[0]?others[0].idx:null);
  const toName=others.find(o=>o.idx===toIdx)?.name||"";
  return(
    <div style={{...S.panel,padding:8}}>
      <div style={{fontSize:11,fontWeight:"bold",color:interactive?"#40d9c4":"#607890",marginBottom:6}}>
        {player.name}{!interactive?" (view only)":""}
      </div>
      {interactive&&others.length>1&&(
        <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
          {others.map(o=>(
            <button key={o.idx} onClick={()=>setToIdx(o.idx)}
              style={{...S.btnSm,fontSize:9,padding:"6px 9px",background:toIdx===o.idx?"#134e4a":"#0a0f1c",color:toIdx===o.idx?"#40d9c4":"#607890"}}>
              → {o.name}
            </button>
          ))}
        </div>
      )}
      {player.hand.length ? (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {player.hand.map(c=>{
            const isSeed=c.t==="seed";
            const border=isSeed?CC[c.crop]:"#1e3a5a";
            const bg=isSeed?(c.crop==="g"?"rgba(0,50,25,0.9)":c.crop==="gr"?"rgba(50,38,0,0.9)":"rgba(35,8,55,0.9)"):"rgba(0,20,50,0.9)";
            return(
              <button key={c.id} disabled={!interactive} onClick={()=>interactive&&toIdx!=null&&onOffer(toIdx,c.id)}
                style={{display:"block",width:"100%",textAlign:"left",background:bg,border:`2px solid ${border}`,borderRadius:4,padding:"9px 11px",cursor:interactive?"pointer":"default",opacity:interactive?1:0.65}}>
                <div style={{fontSize:12,fontWeight:"bold",color:isSeed?CC[c.crop]:"#93c5fd"}}>{c.name}</div>
                {interactive&&<div style={{fontSize:10,color:"#40d9c4",marginTop:3}}>🤝 Tap to offer to {toName}</div>}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{color:"#374151",fontSize:10}}>Empty</div>
      )}
    </div>
  );
}

// ── Contribution form ─────────────────────────────────────
function ContribForm({player,onSubmit}){
  const[shown,setShown]=useState(false);
  const[confirming,setConfirming]=useState(false);
  const sp=player.stockpile;
  const[ship,setShip]=useState({g:0,gr:0,ex:0});
  const[inv,setInv]=useState({g:0,gr:0,ex:0});
  const keep={g:sp.g-ship.g-inv.g,gr:sp.gr-ship.gr-inv.gr,ex:sp.ex-ship.ex-inv.ex};
  const valid=Object.values(keep).every(v=>v>=0);
  const adj=(type,k,delta)=>{
    if(type==="s") setShip(o=>{const n={...o,[k]:Math.max(0,o[k]+delta)};return sp[k]-n[k]-inv[k]>=0?n:o;});
    else setInv(o=>{const n={...o,[k]:Math.max(0,o[k]+delta)};return sp[k]-ship[k]-n[k]>=0?n:o;});
  };
  if(!shown) return(
    <div style={{...S.panel,textAlign:"center",padding:24}}>
      <div style={{color:"#c0ccdd",marginBottom:6,fontWeight:"bold"}}>{player.name}</div>
      <div style={{color:"#607890",fontSize:12,marginBottom:16}}>Other players look away from screen</div>
      <button onClick={()=>setShown(true)} style={S.btn}>🔓 Show My Screen</button>
    </div>
  );
  if(confirming) return(
    <div style={S.panel}>
      <div style={{...S.teal,marginBottom:8}}>{player.name} — Confirm Allocation</div>
      <div style={{fontSize:12,color:"#c0ccdd",lineHeight:1.8,marginBottom:14}}>
        <div><span style={{color:"#22c55e"}}>→ Ship to Earth:</span> G{ship.g} Gr{ship.gr} Ex{ship.ex}</div>
        <div><span style={{color:"#a855f7"}}>→ Invest in Colony:</span> G{inv.g} Gr{inv.gr} Ex{inv.ex}</div>
        <div><span style={{color:"#607890"}}>→ Keep in Stockpile:</span> G{keep.g} Gr{keep.gr} Ex{keep.ex}</div>
      </div>
      <div style={{fontSize:11,color:"#f97316",marginBottom:14}}>This locks in once confirmed — check it before continuing.</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>setConfirming(false)} style={{...S.btnSm,color:"#607890",background:"transparent",border:"1px solid #1e2d3d",flex:1}}>← Back to edit</button>
        <button onClick={()=>{onSubmit(player.id,{ship,invest:inv});setShown(false);setConfirming(false);setShip({g:0,gr:0,ex:0});setInv({g:0,gr:0,ex:0});}}
          style={{...S.btn,flex:1}}>✅ Confirm & Lock In</button>
      </div>
    </div>
  );
  return(
    <div style={S.panel}>
      <div style={{...S.teal,marginBottom:8}}>{player.name} — Allocate Crops</div>
      <div style={{fontSize:11,color:"#607890",marginBottom:8}}>Stockpile: G{sp.g} Gr{sp.gr} Ex{sp.ex}</div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:10}}>
        <thead>
          <tr style={{borderBottom:"1px solid #1e2d3d"}}>
            <th style={{textAlign:"left",color:"#607890",padding:"3px 6px",fontSize:10}}>Crop</th>
            <th style={{color:"#607890",padding:"3px",fontSize:10}}>Have</th>
            <th style={{color:"#22c55e",padding:"3px",fontSize:10}}>→Ship</th>
            <th style={{color:"#a855f7",padding:"3px",fontSize:10}}>→Invest</th>
            <th style={{color:"#607890",padding:"3px",fontSize:10}}>Keep</th>
          </tr>
        </thead>
        <tbody>
          {["g","gr","ex"].map(k=>(
            <tr key={k} style={{borderBottom:"1px solid #0d1526"}}>
              <td style={{padding:"4px 6px",color:CC[k]}}>{CL[k]}</td>
              <td style={{textAlign:"center",color:"#c0ccdd"}}>{sp[k]}</td>
              <td style={{padding:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                  <button onClick={()=>adj("s",k,-1)} style={{background:"#1e2d3d",color:"#60a5fa",border:"1px solid #2d4a6a",borderRadius:4,width:30,height:30,cursor:"pointer",fontSize:17,fontWeight:"bold",lineHeight:1}}>-</button>
                  <span style={{color:"#4ade80",minWidth:18,textAlign:"center"}}>{ship[k]}</span>
                  <button onClick={()=>adj("s",k,1)} style={{background:"#1e2d3d",color:"#60a5fa",border:"1px solid #2d4a6a",borderRadius:4,width:30,height:30,cursor:"pointer",fontSize:17,fontWeight:"bold",lineHeight:1}}>+</button>
                </div>
              </td>
              <td style={{padding:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                  <button onClick={()=>adj("i",k,-1)} style={{background:"#1e2d3d",color:"#60a5fa",border:"1px solid #2d4a6a",borderRadius:4,width:30,height:30,cursor:"pointer",fontSize:17,fontWeight:"bold",lineHeight:1}}>-</button>
                  <span style={{color:"#c084fc",minWidth:18,textAlign:"center"}}>{inv[k]}</span>
                  <button onClick={()=>adj("i",k,1)} style={{background:"#1e2d3d",color:"#60a5fa",border:"1px solid #2d4a6a",borderRadius:4,width:30,height:30,cursor:"pointer",fontSize:17,fontWeight:"bold",lineHeight:1}}>+</button>
                </div>
              </td>
              <td style={{textAlign:"center",color:keep[k]<0?"#f87171":"#607890"}}>{keep[k]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{fontSize:10,color:"#607890",marginBottom:10}}>Ship → Earth maintains vitality. Invest → colony tracks (Greens=LS, Grain=Ag, Exotic=Re).</div>
      <div style={{fontSize:11,color:"#c0ccdd",marginBottom:10}}>→Earth: G{ship.g} Gr{ship.gr} Ex{ship.ex} &nbsp;·&nbsp; →Colony: G{inv.g} Gr{inv.gr} Ex{inv.ex}</div>
      <div style={{marginBottom:10,paddingTop:8,borderTop:"1px solid #1e2d3d"}}>
        <div style={{fontSize:10,color:"#607890",marginBottom:6}}>Your Colony Board (before this round's investment):</div>
        <Colony player={player}/>
      </div>
      {!valid&&<div style={{color:"#f87171",fontSize:11,marginBottom:6}}>Can't allocate more than you have.</div>}
      <button disabled={!valid} onClick={()=>setConfirming(true)}
        style={{...S.btn,width:"100%",opacity:valid?1:0.4,cursor:valid?"pointer":"not-allowed"}}>
        Review & Confirm →
      </button>
    </div>
  );
}

// ── Full-sentence card descriptions (for hover tooltips) ────
const HW_FULL_DESC={
  bMirror:"Basic Solar Mirror — redirects +1 Light onto one adjacent tile of your choice. Rotate it during Engineering to change which tile it lights up.",
  uMirror:"Upgraded Solar Mirror — redirects +1 Light onto two different adjacent tiles at the same time.",
  bIrrig:"Basic Irrigator — adds +1 Water to its own tile and every orthogonally adjacent tile (up to 5 tiles total).",
  uIrrig:"Upgraded Irrigator — adds +1 Water to its own tile and all 8 surrounding tiles (up to 9 tiles total).",
  cReg:"Climate Regulator — adds +1 Light and +1 Water to its own tile and every surrounding tile. Requires a Research colony slot filled before it can be drafted.",
};
function hwFullDesc(card){ return HW_FULL_DESC[card.hwt]||card.desc; }
function seedFullDesc(card){
  return `${CL[card.crop]} seed — needs Light ${card.lr}+ and Water ${card.wr}+ to mature. On success it yields ${card.yld} ${CL[card.crop]} into your stockpile; otherwise it stays dormant and dies after 3 consecutive failed rounds.`;
}

// ── Hover tooltip (custom, matches the retro theme — not the native title attr) ──
function HoverTip({text,children}){
  const[show,setShow]=useState(false);
  if(!text) return children;
  return(
    <div style={{position:"relative"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      {children}
      {show&&(
        <div style={{position:"absolute",bottom:"calc(100% + 9px)",left:"50%",transform:"translateX(-50%)",
          background:"#0a0f1c",border:"1px solid #40d9c4",borderRadius:2,padding:"9px 11px",
          fontSize:12,color:"#c0ccdd",width:230,lineHeight:1.5,zIndex:200,
          boxShadow:"0 6px 16px rgba(0,0,0,0.6)",pointerEvents:"none"}}>
          {text}
          <div style={{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",width:0,height:0,
            borderLeft:"6px solid transparent",borderRight:"6px solid transparent",borderTop:"6px solid #40d9c4"}}/>
        </div>
      )}
    </div>
  );
}

// ── Card chip ─────────────────────────────────────────────
function Chip({card,sel,onClick}){
  const isSeed=card.t==="seed";
  const bg=isSeed?(card.crop==="g"?"rgba(0,40,20,0.8)":card.crop==="gr"?"rgba(40,30,0,0.8)":"rgba(25,5,40,0.8)"):"rgba(0,15,40,0.8)";
  const bc=sel?"#0d9488":isSeed?CC[card.crop]:"#1e3a5a";
  const tip=isSeed?seedFullDesc(card):hwFullDesc(card);
  return(
    <HoverTip text={tip}>
      <div onClick={onClick} style={{background:bg,border:`1px solid ${bc}`,borderRadius:2,padding:"9px 13px",cursor:"pointer",minWidth:110,boxShadow:sel?"0 0 0 2px #0d9488":"none"}}>
        <div style={{fontSize:13,fontWeight:"bold",color:isSeed?CC[card.crop]:"#93c5fd"}}>{card.name}</div>
        <div style={{fontSize:12,color:"#607890",marginTop:2}}>{isSeed?`L${card.lr}W${card.wr}→${card.yld}`:card.desc}</div>
      </div>
    </HoverTip>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App(){
  const[started,setStarted]=useState(false);
  const[storyDone,setStoryDone]=useState(false);
  const[introDone,setIntroDone]=useState(false);
  const[volume,setVolume]=useState(0.5);
  const[muted,setMuted]=useState(false);
  const introAudio=useRef(null), storyAudio=useRef(null), gameAudio=useRef(null);
  const[playerNames,setPlayerNames]=useState(["Player 1","Player 2"]);
  const[state,dispatch]=useReducer(reducer,null,()=>makeState(["Player 1","Player 2"]));
  // Remote play: null = not decided yet, "local" = same-device hotseat (unchanged
  // behavior), "online" = synced through Firestore. mySeat is which player index THIS
  // browser controls — never synced, it's purely local knowledge of "who am I."
  const[connectMode,setConnectMode]=useState(null);
  const[roomCode,setRoomCode]=useState(null);
  const[mySeat,setMySeat]=useState(0);
  const[copied,setCopied]=useState(false);
  const copyRoomCode=()=>{
    const fallback=()=>{
      const ta=document.createElement("textarea");ta.value=roomCode;document.body.appendChild(ta);ta.select();
      try{document.execCommand("copy");}catch(e){}
      document.body.removeChild(ta);
    };
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(roomCode).catch(fallback);
    else fallback();
    setCopied(true);
    setTimeout(()=>setCopied(false),1500);
  };
  const[isNarrow,setIsNarrow]=useState(()=>typeof window!=="undefined"&&window.innerWidth<=820);
  useEffect(()=>{
    const onResize=()=>setIsNarrow(window.innerWidth<=820);
    onResize();
    window.addEventListener("resize",onResize);
    return()=>window.removeEventListener("resize",onResize);
  },[]);
  const stateRef=useRef(state);
  stateRef.current=state;
  const D=a=>{
    dispatch(a);
    if(roomCode){
      const next=reducer(stateRef.current,a);
      setDoc(doc(getDb(),"rooms",roomCode),{state:next}).catch(()=>{});
    }
  };
  useEffect(()=>{
    if(!roomCode) return;
    const unsub=onSnapshot(doc(getDb(),"rooms",roomCode),snap=>{
      const data=snap.data();
      if(data&&data.state) dispatch({type:"__SET_REMOTE_STATE__",state:data.state});
    });
    return unsub;
  },[roomCode]);
  useEffect(()=>{
    // Joiner: once the host has actually configured players, skip straight past the
    // (host-only) setup screen into the live game.
    if(connectMode==="online"&&mySeat!==0&&state.gameStarted) setStarted(true);
  },[connectMode,mySeat,state.gameStarted]);

  useEffect(()=>{
    const a=new Audio(AUDIO_INTRO); a.loop=true;
    const s=new Audio(AUDIO_STORY); s.loop=true;
    const b=new Audio(AUDIO_GAMEPLAY); b.loop=true;
    introAudio.current=a; storyAudio.current=s; gameAudio.current=b;
    return()=>{a.pause();s.pause();b.pause();};
  },[]);
  useEffect(()=>{
    const v=muted?0:volume;
    [introAudio,storyAudio,gameAudio].forEach(r=>{if(r.current) r.current.volume=v;});
  },[volume,muted]);
  // Three-phase soundtrack: loading screen -> story/tutorial -> gameplay. `showingStory`
  // is recomputed below once `started` exists; this effect just reacts to the phase.
  const showingStory=started&&!storyDone;
  useEffect(()=>{
    const all=[introAudio,storyAudio,gameAudio];
    if(!introDone){
      all.forEach(r=>r.current?.pause());
      if(introAudio.current) introAudio.current.currentTime=0;
      introAudio.current?.play().catch(()=>{});
    } else if(showingStory){
      all.forEach(r=>{if(r!==storyAudio) r.current?.pause();});
      if(storyAudio.current) storyAudio.current.currentTime=0;
      storyAudio.current?.play().catch(()=>{});
    } else {
      all.forEach(r=>{if(r!==gameAudio) r.current?.pause();});
      if(gameAudio.current) gameAudio.current.currentTime=0;
      gameAudio.current?.play().catch(()=>{});
    }
  },[introDone,showingStory]);
  const unlockAudio=()=>{ if(!introDone) introAudio.current?.play().catch(()=>{}); };
  // Browsers block audio until a user gesture happens *somewhere* on the page — there's no
  // way around that entirely, so instead of requiring the volume slider specifically, catch
  // the very first click/keypress/touch anywhere and use it to start the intro track.
  useEffect(()=>{
    if(introDone) return;
    const tryPlay=()=>introAudio.current?.play().catch(()=>{});
    document.addEventListener("pointerdown",tryPlay,{capture:true});
    document.addEventListener("keydown",tryPlay,{capture:true});
    return()=>{
      document.removeEventListener("pointerdown",tryPlay,{capture:true});
      document.removeEventListener("keydown",tryPlay,{capture:true});
    };
  },[introDone]);
  // Swap in the grasping-fist cursor for as long as any mouse button is held down,
  // anywhere on the page — not scoped to buttons, so dragging/clicking feels physical.
  // Driven through a CSS custom property (one rule, value swapped in place) rather than
  // toggling between two competing `!important` rules — a class-based version of this
  // was flickering/disappearing, likely a cascade race between the two rules.
  useEffect(()=>{
    const root=document.documentElement.style;
    const grab=()=>root.setProperty("--sfp-cursor",CURSOR_FIST);
    const release=()=>root.setProperty("--sfp-cursor",CURSOR_HAND);
    document.addEventListener("mousedown",grab);
    document.addEventListener("mouseup",release);
    window.addEventListener("blur",release);
    return()=>{
      document.removeEventListener("mousedown",grab);
      document.removeEventListener("mouseup",release);
      window.removeEventListener("blur",release);
    };
  },[]);

  if(!introDone) return <LoadingScreen onBegin={()=>setIntroDone(true)} volume={volume} muted={muted}
    onVolume={setVolume} onMute={()=>setMuted(m=>!m)} onUnlockAudio={unlockAudio}/>;

  if(!connectMode) return <ConnectScreen
    onLocal={()=>setConnectMode("local")}
    onCreate={()=>{const code=makeRoomCode();setRoomCode(code);setMySeat(0);setConnectMode("online");}}
    onJoin={code=>{setRoomCode(code);setMySeat(1);setConnectMode("online");}}
    volume={volume} muted={muted} onVolume={setVolume} onMute={()=>setMuted(m=>!m)}/>;

  if(connectMode==="online"&&mySeat!==0&&!state.gameStarted)
    return <RoomWaiting roomCode={roomCode} volume={volume} muted={muted} onVolume={setVolume} onMute={()=>setMuted(m=>!m)}/>;

  // ── Setup screen ────────────────────────────────────────
  if(!started){
    const[count,setCount]=useState(2);
    const[names,setNames]=useState(["Player 1","Player 2","Player 3","Player 4"]);
    return(
      <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
        <Starfield/>
        <div style={{position:"absolute",top:16,right:20}}>
          <VolumeControl volume={volume} muted={muted} onVolume={setVolume} onMute={()=>setMuted(m=>!m)}/>
        </div>
        <div style={{...S.panel,width:"100%",maxWidth:400,border:"2px solid #134e4a",boxShadow:"0 0 24px rgba(19,78,74,0.4)"}}>
          <div style={{textAlign:"center",marginBottom:26}}>
            <div style={{fontFamily:PIXEL,fontSize:15,color:"#40d9c4",letterSpacing:1,lineHeight:1.8,textShadow:"2px 2px 0 #134e4a"}}>SPACE FARMER<br/>PRO</div>
          </div>
          {connectMode==="online"&&(
            <div style={{...S.panel,marginBottom:16,textAlign:"center",border:"1px solid #facc15"}}>
              <div style={{fontSize:10,color:"#607890"}}>Room code — share this with your friend:</div>
              <div style={{fontFamily:PIXEL,fontSize:20,color:"#facc15",letterSpacing:6,marginTop:8}}>{roomCode}</div>
              <button onClick={copyRoomCode} style={{...S.btnSm,marginTop:10,width:"100%"}}>{copied?"✓ Copied!":"📋 Copy Room Code"}</button>
            </div>
          )}
          {connectMode!=="online"&&(
            <div style={{marginBottom:16}}>
              <div style={S.label}>Players</div>
              <div style={{display:"flex",gap:6,marginTop:6}}>
                {[2,3,4].map(n=><button key={n} onClick={()=>setCount(n)} style={{...S.btn,background:count===n?"#134e4a":"#0a0f1c",color:count===n?"#40d9c4":"#607890"}}>{n}P</button>)}
              </div>
            </div>
          )}
          {Array.from({length:count},(_,i)=>(
            <input key={i} value={names[i]} onChange={e=>{const n=[...names];n[i]=e.target.value;setNames(n);}}
              style={{display:"block",width:"100%",background:"#0a0f1c",color:"#c0ccdd",border:"1px solid #1e2d3d",borderRadius:2,padding:"8px 10px",fontFamily:"monospace",fontSize:16,marginBottom:6,boxSizing:"border-box"}}
              placeholder={`Player ${i+1}`}/>
          ))}
          <button onClick={()=>{D({type:"RESET",names:names.slice(0,count)});setStarted(true);}}
            style={{...S.btn,width:"100%",marginTop:12,fontSize:12,letterSpacing:1}}>
            ▶ LAUNCH MISSION
          </button>
        </div>
      </div>
    );
  }

  // ── Story / how-to-play intro ────────────────────────────
  // Runs once per device after setup, before the first round — separate from the
  // loading-screen intro, and independent per player (each can skip on their own).
  if(showingStory) return <IntroStory onDone={()=>setStoryDone(true)}/>;

  // ── Game over ───────────────────────────────────────────
  if(state.phase==="gameover"){
    const OUTCOMES={
      selfsuff:{icon:"🏙️✨",title:"COLONY ESTABLISHED",sub:`${state.winner} reached full self-sufficiency and wins immediately — every other colony is abandoned, regardless of DP.`,border:"#a16207",titleColor:"#fde047"},
      earthsaved:{icon:"🌍💚",title:"EARTH SAVED",sub:"Six rounds complete, Earth still stands. Final scores, adjusted by Earth's Vitality:",border:"#134e4a",titleColor:"#40d9c4"},
      collapse:{icon:"🥀🧑‍🌾",title:"EARTH HAS FALLEN",sub:"Vitality reached zero. The last transmission from Earth goes silent — no one wins.",border:"#7f1d1d",titleColor:"#f87171"},
    };
    const o=OUTCOMES[state.outcome]||{icon:state.winner?"🏆":"💀",title:state.winner?"MISSION COMPLETE":"MISSION FAILED",sub:state.gameoverMsg,border:"#134e4a",titleColor:"#40d9c4"};
    return(
      <div style={{...S.page,display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative"}}>
        <Starfield/>
        <div style={{position:"absolute",top:16,right:20}}>
          <VolumeControl volume={volume} muted={muted} onVolume={setVolume} onMute={()=>setMuted(m=>!m)}/>
        </div>
        <div style={{...S.panel,width:"100%",maxWidth:480,textAlign:"center",border:`2px solid ${o.border}`,boxShadow:`0 0 28px ${o.border}66`}}>
          <div style={{fontSize:48,marginBottom:12}}>{o.icon}</div>
          <div style={{fontFamily:PIXEL,fontSize:15,color:o.titleColor,marginBottom:16,lineHeight:1.8,letterSpacing:0.5}}>{o.title}</div>
          <div style={{color:"#c0ccdd",marginBottom:20,lineHeight:1.6}}>{o.sub}</div>
          {state.players.map(p=>{
            const dp=calcDP(p,state.vit);
            const{ls,ag,re}=p.colony;
            const isWinner=state.winner===p.name;
            return(
              <div key={p.id} style={{...S.panel,textAlign:"left",marginBottom:8,border:isWinner?"1px solid #fde047":undefined,opacity:state.outcome==="selfsuff"&&!isWinner?0.5:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{color:"#c0ccdd",fontWeight:"bold"}}>{isWinner?"🏆 ":""}{p.name}</span>
                  <span style={{color:"#40d9c4",fontWeight:"bold"}}>{dp} DP</span>
                </div>
                <div style={{fontSize:11,color:"#607890"}}>LS:{ls.filter(Boolean).length}/6 · AG:{ag.filter(Boolean).length}/4 · RE:{re.filter(Boolean).length}/3 · Stock G{p.stockpile.g} Gr{p.stockpile.gr} Ex{p.stockpile.ex} · 🏆×{p.roundWins||0}</div>
              </div>
            );
          })}
          <div style={{fontSize:12,color:"#607890",margin:"12px 0"}}>Earth Vitality: {state.vit}/10 (×{state.vit>=7?1:state.vit>=4?0.5:0.25} DP mult)</div>
          <button onClick={()=>setStarted(false)} style={S.btn}>New Mission</button>
        </div>
      </div>
    );
  }

  const{phase,round,sunPos,vit,players,draft,draftIdx,draftOrder,engIdx,tradePile,event,efx,meteorHit,eventDrawn,meteorResolved,harvestResults,harvestLeaders,shipResult,contribs,contribIdx,contribsRevealed,selCard,log}=state;
  const demand=DEMAND[round]||{g:0,gr:0,ex:0};
  const adjDem={g:demand.g+efx.demG,gr:demand.gr,ex:efx.demExDouble?demand.ex*2:demand.ex};
  // Whose turn it visibly is, for the ship marker in the Players panel — simultaneous
  // phases (event/harvest/trade) have no single active player.
  let activeIdx=null;
  if(phase==="engineering"&&engIdx<players.length) activeIdx=engIdx;
  else if(phase==="contribute"&&!contribsRevealed&&contribIdx<players.length) activeIdx=contribIdx;
  const remoteMode=connectMode==="online";
  const isMyTurn=!remoteMode||activeIdx===null||activeIdx===mySeat;
  const Waiting=({label})=>(
    <div style={{...S.panel,textAlign:"center",padding:24}}>
      <div style={{color:"#607890",fontSize:13}}>⏳ Waiting for <b style={{color:"#c0ccdd"}}>{label}</b>...</div>
    </div>
  );

  return(
    <div style={S.page}>
      <Starfield/>
      {/* HEADER */}
      <div style={{background:"rgba(10,15,28,0.92)",borderBottom:"2px solid #134e4a",boxShadow:"0 2px 0 #042f2e",padding:"10px 20px",display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontFamily:PIXEL,color:"#facc15",fontSize:12}}>R{round}/6</span>
          {remoteMode&&<span style={{fontSize:10,color:"#4b5563"}}>Room {roomCode} · you're {players[mySeat]?.name||`P${mySeat+1}`}</span>}
        </div>
        <VitBar v={vit}/>
        <VolumeControl volume={volume} muted={muted} onVolume={setVolume} onMute={()=>setMuted(m=>!m)}/>
      </div>

      <div style={{display:"flex",flexDirection:isNarrow?"column":"row",gap:16,padding:"16px 24px",width:"min(1700px,96vw)",margin:"0 auto"}}>
        {/* MAIN */}
        <div style={{flex:1,minWidth:0,fontSize:13}}>

          {/* ── EVENT/SUNDIAL ─────────────────────────────── */}
          {phase==="event"&&(
            <div style={S.panel}>
              <div style={S.h2}>Round {round} — Sun & Event</div>
              <div style={{marginBottom:16}}>
                {!eventDrawn?(
                  <div style={{...S.panel,textAlign:"center",padding:28}}>
                    <div style={{color:"#607890",fontSize:13,marginBottom:14}}>This round's Event Card hasn't been drawn yet.</div>
                    <button onClick={()=>D({type:"DRAW_EVENT"})} style={S.btn}>🎴 Draw Event Card</button>
                  </div>
                ):event?(
                  <div style={{...S.panel,border:`1px solid ${event.et==="meteor"?"#7f1d1d":event.et==="bonus"?"#14532d":event.et==="pressure"?"#7c2d12":"#1e3a5a"}`}}>
                    <div style={{fontSize:12,color:"#607890",marginBottom:4}}>EVENT</div>
                    <div style={{fontSize:16,fontWeight:"bold",color:"#f1f5f9",marginBottom:6}}>{event.icon} {event.name}</div>
                    <div style={{fontSize:13,color:"#c0ccdd",lineHeight:1.5}}>{event.desc}</div>
                    {event.et==="meteor"&&!meteorResolved&&(
                      <button onClick={()=>D({type:"RESOLVE_METEOR"})} style={{...S.btn,marginTop:10,background:"#7f1d1d",borderColor:"#f87171",color:"#fecaca"}}>☄️ Activate Strike</button>
                    )}
                    {event.et==="meteor"&&meteorResolved&&<MeteorReveal meteorHit={meteorHit} meteorResolved={meteorResolved} players={players}/>}
                    {efx.solarFlare&&<div style={{color:"#fde047",fontSize:12,marginTop:4}}>⚡ +1L all tiles · Mirrors offline</div>}
                    {efx.embargo&&<div style={{color:"#f87171",fontSize:12,marginTop:4}}>🚫 Trade Embargo active</div>}
                    {efx.seedsOnly&&<div style={{color:"#f97316",fontSize:12,marginTop:4}}>📦 Seeds only in draft</div>}
                    {efx.bumper&&<div style={{color:"#4ade80",fontSize:12,marginTop:4}}>🌾 +1 bonus on all harvests</div>}
                  </div>
                ):(
                  <div style={{...S.panel,color:"#607890"}}>No event card this round.</div>
                )}
              </div>
              {eventDrawn&&(!event||event.et!=="meteor"||meteorResolved)&&(<>
                {/* Grid overview */}
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:10,marginBottom:16}}>
                  {players.map(p=>(
                    <div key={p.id} style={{...S.panel,padding:8}}>
                      <Grid player={p} sunPos={sunPos} efx={efx} isActive={false} selCard={null} onPlace={()=>{}} onLift={()=>{}} onSwap={()=>{}} onSetDir={()=>{}}/>
                      <div style={{fontSize:10,color:"#607890",marginTop:4}}>G{p.stockpile.g} Gr{p.stockpile.gr} Ex{p.stockpile.ex}</div>
                    </div>
                  ))}
                </div>
                <button onClick={()=>D({type:"DEAL_DRAFT"})} style={S.btn}>→ Deal Draft Cards</button>
              </>)}
            </div>
          )}

          {/* ── TRADE ─────────────────────────────────────── */}
          {phase==="trade"&&(
            <div style={S.panel}>
              <div style={S.h2}>Trading Window</div>
              <div style={{fontSize:12,color:"#607890",marginBottom:12}}>
                Offer cards you're willing to trade to the pile below, naming who they're for. Once everyone's happy, hit Initiate Trade to swap everything at once.
              </div>
              <div style={{...S.panel,border:"1px solid #a16207",marginBottom:12}}>
                <div style={{fontSize:11,color:"#facc15",fontWeight:"bold",marginBottom:8}}>
                  🔄 TRADE PILE {tradePile.length?`(${tradePile.length})`:""}
                </div>
                {tradePile.length?(
                  <div style={{display:"flex",flexDirection:"column",gap:6}}>
                    {tradePile.map(o=>(
                      <div key={o.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,background:"rgba(0,0,0,0.3)",borderRadius:2,padding:"7px 10px"}}>
                        <div style={{fontSize:12,color:"#c0ccdd"}}>
                          <span style={{color:"#40d9c4"}}>{players[o.fromIdx]?.name}</span> → <span style={{color:"#facc15"}}>{players[o.toIdx]?.name}</span>: <b>{o.card.name}</b>
                        </div>
                        {(!remoteMode||o.fromIdx===mySeat)&&(
                          <button onClick={()=>D({type:"TRADE_RETRACT",cardId:o.id})} style={{...S.btnSm,fontSize:10,padding:"5px 9px"}}>↩ Retract</button>
                        )}
                      </div>
                    ))}
                  </div>
                ):(
                  <div style={{fontSize:11,color:"#374151"}}>Nobody's offered anything yet.</div>
                )}
              </div>
              {efx.embargo?(
                <div style={{fontSize:12,color:"#f87171",marginBottom:12}}>🚫 Trade Embargo — no trades this round.</div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:8,marginBottom:12}}>
                  {players.map((p,i)=>(
                    <PlayerTradeHand key={p.id} player={p} interactive={!remoteMode||i===mySeat}
                      others={players.map((pp,ii)=>({idx:ii,name:pp.name})).filter(o=>o.idx!==i)}
                      onOffer={(toIdx,cardId)=>D({type:"TRADE_OFFER",fromIdx:i,toIdx,cardId})}/>
                  ))}
                </div>
              )}
              <button onClick={()=>D({type:"TRADE_INITIATE"})} style={S.btn}>
                {tradePile.length?`🤝 Initiate Trade (${tradePile.length})`:"→ Continue (no trades)"}
              </button>
            </div>
          )}

          {/* ── ENGINEERING ────────────────────────────────── */}
          {phase==="engineering"&&(()=>{
            const p=players[engIdx];
            const tv=computeTiles(p,sunPos,efx);
            return(
              <div style={S.panel}>
                <div style={S.h2}>Engineering — {p?.name} ({engIdx+1}/{players.length})</div>
                {remoteMode&&!isMyTurn?<Waiting label={p?.name}/>:(
                <>
                <div style={{fontSize:11,color:"#607890",marginBottom:10}}>Click a card to select → click a tile to place. Click a placed piece to return it to hand.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                  <div>
                    <div style={{...S.label,marginBottom:6}}>Hand ({p?.hand.length} cards) {selCard&&<span style={{color:"#40d9c4"}}>— Selected: {selCard.name}</span>}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14,minHeight:40}}>
                      {p?.hand.map(c=><Chip key={c.id} card={c} sel={selCard?.id===c.id} onClick={()=>D({type:"SEL_CARD",card:c})}/>)}
                      {!p?.hand.length&&<div style={{color:"#374151",fontSize:11}}>No cards in hand.</div>}
                    </div>
                    <Grid player={p} sunPos={sunPos} efx={efx} isActive={true} selCard={selCard}
                      onPlace={tid=>D({type:"PLACE",tileId:tid})}
                      onLift={tid=>D({type:"LIFT",tileId:tid})}
                      onSwap={tid=>D({type:"SWAP",tileId:tid})}
                      onSetDir={(tid,dirs)=>D({type:"SET_DIR",tileId:tid,dirs})}/>
                    {p?.colony.ag.filter(Boolean).length>=2&&p?.colony.agriWater&&(
                      <div style={{marginTop:8,fontSize:11,color:"#60a5fa"}}>
                        ★ +1W bonus on tile:
                        <select value={p.colony.agriWater} onChange={e=>D({type:"SET_AGRI_WATER",pid:p.id,tid:+e.target.value})}
                          style={{marginLeft:6,background:"#0a0f1c",color:"#60a5fa",border:"1px solid #1e3a5a",borderRadius:2,padding:"2px 4px",fontFamily:"monospace"}}>
                          {[1,2,3,4,5,6,7,8,9].map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{...S.label,marginBottom:6}}>Tile values (after hardware)</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3,marginBottom:12}}>
                      {[1,2,3,4,5,6,7,8,9].map(t=>(
                        <div key={t} style={{background:"#0a0f1c",border:"1px solid #1e2d3d",borderRadius:2,padding:"4px 0",textAlign:"center",fontSize:11}}>
                          <div style={{color:"#374151",fontSize:9}}>T{t}</div>
                          <span style={{color:"#facc15"}}>☀{tv[t]?.l||0}</span>{" "}
                          <span style={{color:"#60a5fa"}}>💧{tv[t]?.w||0}</span>
                        </div>
                      ))}
                    </div>
                    {efx.solarFlare&&<div style={{fontSize:11,color:"#fde047",marginBottom:8}}>⚡ Solar Flare: +1L all · Mirrors offline</div>}
                    <Colony player={p}/>
                    <div style={{fontSize:11,color:"#607890",marginTop:8}}>Stock: G{p?.stockpile.g} Gr{p?.stockpile.gr} Ex{p?.stockpile.ex}</div>
                  </div>
                </div>
                <div style={{marginTop:14}}>
                  <button onClick={()=>D({type:"NEXT_ENG"})} style={S.btn}>
                    {engIdx+1>=players.length?"→ Harvest Phase":"Next Player →"}
                  </button>
                </div>
                </>
                )}
              </div>
            );
          })()}

          {/* ── HARVEST ────────────────────────────────────── */}
          {phase==="harvest"&&(
            <div style={S.panel}>
              <div style={S.h2}>Harvest Phase</div>
              {!harvestResults?(
                <>
                  <div style={{fontSize:12,color:"#607890",marginBottom:12}}>Preview: crops meeting L/W requirements will harvest. Others go dormant (max 3 rounds).</div>
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:10,marginBottom:14}}>
                    {players.map(p=>{
                      const tv=computeTiles(p,sunPos,efx);
                      const crops=p.grid.filter(t=>t.c?.t==="seed"&&!t.dmg);
                      return(
                        <div key={p.id} style={{...S.panel,padding:8}}>
                          <div style={{fontSize:11,fontWeight:"bold",color:"#607890",marginBottom:6}}>{p.name}</div>
                          {!crops.length&&<div style={{fontSize:10,color:"#374151"}}>No crops.</div>}
                          {crops.map(tile=>{
                            const{l,w}=tv[tile.id];
                            const ok=l>=tile.c.card.lr&&w>=tile.c.card.wr;
                            return(
                              <div key={tile.id} style={{fontSize:10,color:ok?"#4ade80":"#f87171",marginBottom:3}}>
                                T{tile.id} {tile.c.card.name}: {ok?`✓ +${tile.c.card.yld+(efx.bumper?1:0)}`:`✗ (L${l}W${w}→L${tile.c.card.lr}W${tile.c.card.wr})`}
                                {!ok&&(tile.c.dormant||0)>0&&<span style={{color:"#f97316"}}> 💤{tile.c.dormant}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={()=>D({type:"HARVEST"})} style={S.btn}>→ Resolve Harvest</button>
                </>
              ):(
                <>
                  {!!harvestLeaders?.length&&(
                    <div style={{fontSize:12,color:"#facc15",marginBottom:10}}>
                      🏆 Harvest lead: {harvestLeaders.map(i=>players[i].name).join(", ")} — first pick next round, +2 DP banked
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:10,marginBottom:14}}>
                    {players.map((p,pi)=>{
                      const pLog=harvestResults.filter(h=>h.player===p.name);
                      return(
                        <div key={p.id} style={{...S.panel,padding:8,border:harvestLeaders?.includes(pi)?"1px solid #facc15":undefined}}>
                          <div style={{fontSize:11,fontWeight:"bold",color:"#607890",marginBottom:6}}>{p.name}</div>
                          {!pLog.length&&<div style={{fontSize:10,color:"#374151"}}>No crops to harvest.</div>}
                          {pLog.map((h,i)=>(
                            <div key={i} style={{fontSize:10,color:h.ok?"#4ade80":h.died?"#9f1239":"#f97316",marginBottom:3}}>
                              T{h.tile} {h.name}: {h.ok?`+${h.yld} ✓`:h.died?"💀 died":`💤${h.dormant}/3`}
                            </div>
                          ))}
                          <div style={{fontSize:10,color:"#607890",marginTop:4,borderTop:"1px solid #1e2d3d",paddingTop:4}}>
                            Stock: G{p.stockpile.g} Gr{p.stockpile.gr} Ex{p.stockpile.ex}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={()=>D({type:"HARVEST"})} style={{display:"none"}}/>
                  <div style={{color:"#607890",fontSize:11,marginBottom:10}}>Harvest resolved. Proceed to contributions.</div>
                  <button onClick={()=>{}} style={{...S.btn,opacity:1}} disabled>Phase auto-advances ↓</button>
                  <div style={{fontSize:11,color:"#607890",marginTop:8}}>↓ Scroll to contribution section below</div>
                </>
              )}
            </div>
          )}

          {/* ── CONTRIBUTE ─────────────────────────────────── */}
          {phase==="contribute"&&(
            <div style={S.panel}>
              <div style={S.h2}>Phase V — Earth Contribution</div>
              <div style={{fontSize:11,color:"#607890",marginBottom:12}}>
                Earth needs: <span style={{color:"#4ade80"}}>G{adjDem.g}</span> <span style={{color:"#facc15"}}>Gr{adjDem.gr}</span> <span style={{color:"#c084fc"}}>Ex{adjDem.ex}</span> — each player secretly allocates crops.
              </div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:8,marginBottom:16}}>
                {players.map(p=>(
                  <div key={p.id} style={{...S.panel,padding:8}}>
                    <div style={{fontSize:11,fontWeight:"bold",color:"#607890",marginBottom:4}}>{p.name} — total harvest</div>
                    <span style={{color:"#4ade80"}}>G{p.stockpile.g} </span>
                    <span style={{color:"#facc15"}}>Gr{p.stockpile.gr} </span>
                    <span style={{color:"#c084fc"}}>Ex{p.stockpile.ex}</span>
                  </div>
                ))}
              </div>
              {!contribsRevealed?(
                <div>
                  {remoteMode?(
                    contribs[mySeat]&&!contribs[mySeat].done?(
                      <ContribForm player={players[mySeat]} onSubmit={(id,data)=>D({type:"SUBMIT",id,data})}/>
                    ):contribs.every(c=>c.done)?(
                      <div style={{textAlign:"center",padding:20}}>
                        <div style={{color:"#4ade80",marginBottom:12,fontSize:14}}>All players submitted. Ready to reveal.</div>
                        <button onClick={()=>D({type:"REVEAL"})} style={{...S.btn,fontSize:15,padding:"10px 24px",fontWeight:"bold"}}>🚀 Reveal All</button>
                      </div>
                    ):(
                      <div style={{textAlign:"center",padding:20}}>
                        <div style={{color:"#607890",fontSize:13,marginBottom:10}}>✓ Submitted — waiting for the other player...</div>
                        <div style={{display:"flex",gap:14,justifyContent:"center"}}>
                          {players.map((p,i)=>(
                            <div key={p.id} style={{fontSize:12,color:contribs[i]?.done?"#4ade80":"#607890"}}>{p.name}: {contribs[i]?.done?"✓":"⏳"}</div>
                          ))}
                        </div>
                      </div>
                    )
                  ):(
                    contribIdx<players.length?(
                      <ContribForm
                        player={players[contribIdx]}
                        onSubmit={(id,data)=>D({type:"SUBMIT",id,data})}
                      />
                    ):(
                      <div style={{textAlign:"center",padding:20}}>
                        <div style={{color:"#4ade80",marginBottom:12,fontSize:14}}>All players submitted. Ready to reveal.</div>
                        <button onClick={()=>D({type:"REVEAL"})} style={{...S.btn,fontSize:15,padding:"10px 24px",fontWeight:"bold"}}>🚀 Reveal All</button>
                      </div>
                    )
                  )}
                </div>
              ):(
                <div>
                  {shipResult&&(
                    <div style={{...S.panel,border:`1px solid ${shipResult.allMet?"#14532d":"#7f1d1d"}`,marginBottom:14}}>
                      <div style={{fontSize:14,fontWeight:"bold",color:shipResult.allMet?"#4ade80":"#f87171",marginBottom:8}}>
                        {shipResult.allMet?"✓ Earth's demand met!":"✗ Demand not fully met"}
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:10,textAlign:"center"}}>
                        {[["Greens","g","#4ade80"],["Grain","gr","#facc15"],["Exotics","ex","#c084fc"]].map(([lbl,k,col])=>(
                          <div key={k}>
                            <div style={{fontSize:10,color:"#607890",marginBottom:2}}>{lbl}</div>
                            <div style={{fontSize:18,fontWeight:"bold",color:shipResult[`m${k.charAt(0).toUpperCase()+k.slice(1)}`]||shipResult[`m${k.toUpperCase()}`]||k==="g"?shipResult.mG:k==="gr"?shipResult.mGr:shipResult.mEx?col:"#f87171"}}>
                              {shipResult.tot[k]}/{shipResult.dem[k]}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{textAlign:"center",fontSize:16,fontWeight:"bold",color:shipResult.vd>=0?"#4ade80":"#f87171"}}>
                        Vitality {shipResult.vd>=0?"+":""}{shipResult.vd} → {shipResult.newVit}
                      </div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(players.length,4)},1fr)`,gap:8,marginBottom:12}}>
                    {contribs.map(c=>{
                      const p=players.find(x=>x.id===c.id);
                      return(
                        <div key={c.id} style={{...S.panel,padding:8}}>
                          <div style={{fontSize:11,fontWeight:"bold",color:"#607890",marginBottom:4}}>{p?.name}</div>
                          <div style={{fontSize:10,color:"#4ade80"}}>Ship: G{c.ship.g} Gr{c.ship.gr} Ex{c.ship.ex}</div>
                          <div style={{fontSize:10,color:"#a855f7"}}>Invest: G{c.invest.g} Gr{c.invest.gr} Ex{c.invest.ex}</div>
                          <div style={{marginTop:6}}><Colony player={p}/></div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={()=>D({type:"END_ROUND"})} style={S.btn}>→ End Round {round}</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div style={{width:isNarrow?"100%":300,flexShrink:0,display:"flex",flexDirection:"column",gap:14}}>
          {/* Sun + demand, grouped — this is the "what matters this round" corner */}
          <div style={S.panel}>
            <div style={{...S.label,marginBottom:8,fontSize:11}}>Sun Dial</div>
            <SunDial pos={sunPos}/>
            <div style={{...S.label,margin:"14px 0 8px",paddingTop:12,borderTop:"1px solid #1e2d3d",fontSize:11}}>Demand Schedule</div>
            {DEMAND.slice(1).map((d,i)=>(
              <div key={i} style={{display:"flex",gap:10,fontSize:13,padding:"4px 0",borderBottom:i+1===round?"1px solid #134e4a":"none",color:i+1===round?"#f1f5f9":"#607890",fontWeight:i+1===round?"bold":"normal"}}>
                <span style={{width:24}}>R{i+1}</span>
                <span style={{color:"#4ade80"}}>G{d.g}</span>
                <span style={{color:"#facc15"}}>Gr{d.gr}</span>
                <span style={{color:"#c084fc"}}>Ex{d.ex}</span>
              </div>
            ))}
          </div>
          {/* Player summaries */}
          <div style={S.panel}>
            <div style={{...S.label,marginBottom:8,fontSize:11}}>Players</div>
            {players.map((p,pi)=>{
              const ls=p.colony.ls.filter(Boolean).length, ag=p.colony.ag.filter(Boolean).length, re=p.colony.re.filter(Boolean).length;
              return(
                <div key={p.id} style={{marginBottom:10,paddingBottom:10,borderBottom:"1px solid #0d1526",display:"flex",gap:8,alignItems:"flex-start"}}>
                  {pi===activeIdx&&<PixelShip size={5} still/>}
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:"#c0ccdd",fontWeight:"bold",marginBottom:3}}>{p.name}</div>
                    <div style={{fontSize:12,color:"#607890"}}>
                      <span style={{color:"#4ade80"}}>G{p.stockpile.g}</span>{" "}
                      <span style={{color:"#facc15"}}>Gr{p.stockpile.gr}</span>{" "}
                      <span style={{color:"#c084fc"}}>Ex{p.stockpile.ex}</span>
                    </div>
                    <div style={{fontSize:11,color:"#4b5563"}}>LS{ls} AG{ag} RE{re} · 🏆×{p.roundWins||0}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
