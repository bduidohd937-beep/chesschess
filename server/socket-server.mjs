import {createServer} from "node:http";import {Server} from "socket.io";import {Chess} from "chess.js";

const httpServer=createServer();
const io=new Server(httpServer,{cors:{origin:"*"}});
const rooms=new Map();
const INITIAL_FEN=new Chess().fen();

const AUGMENT_TIERS=[
 "silver",
 "gold",
 "prism",
 "transcendent",
];

function weightedAugmentTier(){
 const weights={silver:55,gold:28,prism:13,transcendent:4};
 const entries=Object.entries(weights);
 const total=entries.reduce((sum,[,weight])=>sum+weight,0);
 let roll=Math.random()*total;
 for(const [tier,weight] of entries){
  roll-=weight;
  if(roll<0)return tier;
 }
 return "silver";
}

function createStartAugmentTiers(){
 return Array.from({length:3},()=>weightedAugmentTier());
}

function makeRoomId(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let id="";do{id=Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join("")}while(rooms.has(id));return id}

io.on("connection",socket=>{
 socket.on("create-room",()=>{
  const roomId=makeRoomId();
  rooms.set(roomId,{white:socket.id,black:null,game:new Chess(),startAugmentTiers:createStartAugmentTiers()});
  socket.join(roomId);
  socket.data.roomId=roomId;
  socket.data.color="w";
  socket.emit("room-created",{roomId});
 });

 socket.on("join-room",({roomId},reply)=>{
  const room=rooms.get(roomId);
  if(!room)return reply({ok:false,error:"ROOM NOT FOUND"});
  if(room.black)return reply({ok:false,error:"ROOM FULL"});
  room.black=socket.id;
  socket.join(roomId);
  socket.data.roomId=roomId;
  socket.data.color="b";
  reply({ok:true});
  socket.emit("room-joined",{roomId,color:"b",fen:room.game.fen(),startAugmentTiers:room.startAugmentTiers});
  io.to(room.white).emit("game-start",{roomId,color:"w",startAugmentTiers:room.startAugmentTiers});
 });

 socket.on("new-game",({roomId},reply)=>{
  const room=rooms.get(roomId);
  if(!room||socket.data.roomId!==roomId)return reply?.({ok:false,error:"INVALID ROOM"});
  if(!room.white||!room.black)return reply?.({ok:false,error:"WAITING FOR OPPONENT"});
  room.game=new Chess();
  io.to(roomId).emit("game-reset",{fen:room.game.fen()});
  reply?.({ok:true});
 });

 socket.on("move",({roomId,from,to,promotion,custom,augment},reply)=>{
  const room=rooms.get(roomId);
  if(!room||socket.data.roomId!==roomId)return reply?.({ok:false,error:"INVALID ROOM"});
  if(socket.data.color!==room.game.turn())return reply?.({ok:false,error:"NOT YOUR TURN"});
  if(typeof from!=="string"||typeof to!=="string")return reply?.({ok:false,error:"INVALID MOVE"});
  try{
   let move;
   if(custom === true && augment === "G002"){
    const moving=room.game.get(from);
    const target=room.game.get(to);
    const knightCount=room.game.board().flat().filter(p=>p?.type==="n"&&p.color===socket.data.color).length;
    if(!moving||moving.type!=="n"||moving.color!==socket.data.color||knightCount!==1||(target?.color===moving.color)) throw new Error("INVALID G002 MOVE");
    const df=Math.abs(to.charCodeAt(0)-from.charCodeAt(0));
    const dr=Math.abs(Number(to[1])-Number(from[1]));
    if(!((df===0&&dr>0)||(dr===0&&df>0)||(df===dr&&df>0))) throw new Error("INVALID G002 MOVE");
    const fileStep=Math.sign(to.charCodeAt(0)-from.charCodeAt(0));
    const rankStep=Math.sign(Number(to[1])-Number(from[1]));
    let f=from.charCodeAt(0)+fileStep;
    let r=Number(from[1])+rankStep;
    while(f!==to.charCodeAt(0)||r!==Number(to[1])){
     if(room.game.get(String.fromCharCode(f)+r)) throw new Error("BLOCKED G002 MOVE");
     f+=fileStep;r+=rankStep;
    }
    const next=new Chess(room.game.fen());
    next.remove(from); if(target) next.remove(to);
    next.put({type:"n",color:moving.color},to);
    const fenParts=next.fen().split(" ");
    fenParts[1]=moving.color==="w"?"b":"w"; fenParts[3]="-"; fenParts[4]="0";
    if(moving.color==="b") fenParts[5]=String(Number(fenParts[5])+1);
    const customGame=new Chess(fenParts.join(" "));
    let kingSquare=null;
    const board=customGame.board();
    for(let row=0;row<8;row++) for(let col=0;col<8;col++) if(board[row][col]?.type==="k"&&board[row][col]?.color===moving.color) kingSquare=String.fromCharCode(97+col)+(8-row);
    if(!kingSquare||customGame.isAttacked(kingSquare,moving.color==="w"?"b":"w")) throw new Error("KING IN CHECK");
    room.game=customGame;
    move={from,to,promotion:null};
   }else{
    move=room.game.move({from,to,promotion});
   }
   const fen=room.game.fen();
   reply?.({ok:true,fen,from:move.from,to:move.to,promotion:move.promotion??null});
   socket.to(roomId).emit("opponent-move",{fen,from:move.from,to:move.to,promotion:move.promotion??null});
  }catch{
   reply?.({ok:false,error:"ILLEGAL MOVE"});
  }
 });

 socket.on("disconnect",()=>{
  const id=socket.data.roomId;
  if(!id)return;
  const room=rooms.get(id);
  if(!room)return;
  if(room.white===socket.id)room.white=null;
  if(room.black===socket.id)room.black=null;
  if(!room.white&&!room.black)rooms.delete(id);
  else io.to(id).emit("opponent-disconnected");
 });
});

httpServer.listen(3001,()=>console.log("Chess Socket.IO server listening on http://localhost:3001"));