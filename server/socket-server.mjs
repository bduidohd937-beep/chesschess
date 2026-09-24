import {createServer} from "node:http";import {Server} from "socket.io";import {Chess} from "chess.js";

const httpServer=createServer();
const io=new Server(httpServer,{cors:{origin:"*"}});
const rooms=new Map();
const INITIAL_FEN=new Chess().fen();

function makeRoomId(){const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let id="";do{id=Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join("")}while(rooms.has(id));return id}

io.on("connection",socket=>{
 socket.on("create-room",()=>{
  const roomId=makeRoomId();
  rooms.set(roomId,{white:socket.id,black:null,game:new Chess()});
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
  socket.emit("room-joined",{roomId,color:"b",fen:room.game.fen()});
  io.to(room.white).emit("game-start",{roomId,color:"w"});
 });

 socket.on("new-game",({roomId},reply)=>{
  const room=rooms.get(roomId);
  if(!room||socket.data.roomId!==roomId)return reply?.({ok:false,error:"INVALID ROOM"});
  if(!room.white||!room.black)return reply?.({ok:false,error:"WAITING FOR OPPONENT"});
  room.game=new Chess();
  io.to(roomId).emit("game-reset",{fen:room.game.fen()});
  reply?.({ok:true});
 });

 socket.on("move",({roomId,from,to,promotion},reply)=>{
  const room=rooms.get(roomId);
  if(!room||socket.data.roomId!==roomId)return reply?.({ok:false,error:"INVALID ROOM"});
  if(socket.data.color!==room.game.turn())return reply?.({ok:false,error:"NOT YOUR TURN"});
  if(typeof from!=="string"||typeof to!=="string")return reply?.({ok:false,error:"INVALID MOVE"});
  try{
   const move=room.game.move({from,to,promotion});
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