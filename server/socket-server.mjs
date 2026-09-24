import {createServer} from "node:http";
import {Server} from "socket.io";
import {Chess} from "chess.js";

const httpServer=createServer();
const io=new Server(httpServer,{cors:{origin:"*"}});
const rooms=new Map();

function makeRoomId(){
  const c="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id="";
  do{id=Array.from({length:5},()=>c[Math.floor(Math.random()*c.length)]).join("")}while(rooms.has(id));
  return id;
}
function createStartAugmentTiers(){
  const weights={silver:55,gold:28,prism:13,transcendent:4};
  return Array.from({length:3},()=>{
    let roll=Math.random()*100;
    for(const [tier,weight] of Object.entries(weights)){roll-=weight;if(roll<0)return tier;}
    return "silver";
  });
}
function kingSafe(game,color){
  let king=null;
  const board=game.board();
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    if(board[row][col]?.type==="k"&&board[row][col]?.color===color) king=String.fromCharCode(97+col)+(8-row);
  }
  return Boolean(king)&&!game.isAttacked(king,color==="w"?"b":"w");
}
function customPosition(game,from,to){
  const moving=game.get(from);
  const target=game.get(to);
  if(!moving||target?.color===moving.color) throw new Error("INVALID CUSTOM MOVE");
  const next=new Chess(game.fen());
  next.remove(from);
  if(target) next.remove(to);
  if(!next.put({type:moving.type,color:moving.color},to)) throw new Error("INVALID CUSTOM MOVE");
  const fen=next.fen().split(" ");
  fen[1]=moving.color==="w"?"b":"w";
  fen[3]="-";
  fen[4]="0";
  if(moving.color==="b") fen[5]=String(Number(fen[5])+1);
  const result=new Chess(fen.join(" "));
  if(!kingSafe(result,moving.color)) throw new Error("KING IN CHECK");
  return result;
}
function clearRay(game,from,to){
  const fileStep=Math.sign(to.charCodeAt(0)-from.charCodeAt(0));
  const rankStep=Math.sign(Number(to[1])-Number(from[1]));
  let f=from.charCodeAt(0)+fileStep;
  let r=Number(from[1])+rankStep;
  while(f!==to.charCodeAt(0)||r!==Number(to[1])){
    if(game.get(String.fromCharCode(f)+r)) return false;
    f+=fileStep;r+=rankStep;
  }
  return true;
}

io.on("connection",socket=>{
  socket.on("create-room",()=>{
    const roomId=makeRoomId();
    rooms.set(roomId,{white:socket.id,black:null,game:new Chess(),startAugmentTiers:createStartAugmentTiers()});
    socket.join(roomId);socket.data.roomId=roomId;socket.data.color="w";
    socket.emit("room-created",{roomId});
  });

  socket.on("join-room",({roomId},reply)=>{
    const room=rooms.get(roomId);
    if(!room)return reply({ok:false,error:"ROOM NOT FOUND"});
    if(room.black)return reply({ok:false,error:"ROOM FULL"});
    room.black=socket.id;socket.join(roomId);socket.data.roomId=roomId;socket.data.color="b";
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
      const before=room.game;
      const moving=before.get(from);
      const target=before.get(to);
      let move={from,to,promotion:null};

      if(custom===true&&augment==="G001"){
        if(!moving||moving.type!=="b"||moving.color!==socket.data.color||!target||target.color===moving.color||target.type!=="p") throw new Error("INVALID G001 MOVE");
        const df=Math.abs(to.charCodeAt(0)-from.charCodeAt(0));
        const dr=Math.abs(Number(to[1])-Number(from[1]));
        if(df!==dr||df===0||!clearRay(before,from,to)) throw new Error("INVALID G001 MOVE");
        const next=new Chess(before.fen());
        next.remove(to);
        const fen=next.fen().split(" ");
        fen[1]=moving.color==="w"?"b":"w";fen[3]="-";fen[4]="0";
        if(moving.color==="b")fen[5]=String(Number(fen[5])+1);
        const result=new Chess(fen.join(" "));
        if(!kingSafe(result,moving.color))throw new Error("KING IN CHECK");
        room.game=result;
      }else if(custom===true&&augment==="G002"){
        const knightCount=before.board().flat().filter(p=>p?.type==="n"&&p.color===socket.data.color).length;
        if(!moving||moving.type!=="n"||moving.color!==socket.data.color||knightCount!==1)throw new Error("INVALID G002 MOVE");
        const df=Math.abs(to.charCodeAt(0)-from.charCodeAt(0));
        const dr=Math.abs(Number(to[1])-Number(from[1]));
        if(!((df===0&&dr>0)||(dr===0&&df>0)||(df===dr&&df>0))||!clearRay(before,from,to))throw new Error("INVALID G002 MOVE");
        room.game=customPosition(before,from,to);
      }else if(custom===true&&augment==="S001"){
        if(!moving||moving.type!=="p"||moving.color!==socket.data.color)throw new Error("INVALID S001 MOVE");
        const direction=moving.color==="w"?1:-1;
        const startRank=moving.color==="w"?2:7;
        const fromRank=Number(from[1]);
        const toRank=Number(to[1]);
        if(from[0]!==to[0]||fromRank!==startRank||toRank-fromRank!==direction*2)throw new Error("INVALID S001 MOVE");
        const middle=from[0]+(fromRank+direction);
        if(before.get(middle)||target)throw new Error("BLOCKED S001 MOVE");
        const next=customPosition(before,from,to);
        const fen=next.fen().split(" ");
        fen[3]=to[0]+(toRank-direction);
        room.game=new Chess(fen.join(" "));
      }else if(custom===true&&augment==="S002"){
        if(!moving||moving.type!=="n"||moving.color!==socket.data.color)throw new Error("INVALID S002 MOVE");
        const direction=moving.color==="w"?1:-1;
        if(to[0]!==from[0]||Number(to[1])-Number(from[1])!==direction)throw new Error("INVALID S002 MOVE");
        room.game=customPosition(before,from,to);
      }else{
        const legal=before.moves({square:from,verbose:true}).find(m=>m.to===to);
        if(!legal)throw new Error("ILLEGAL MOVE");
        room.game=before.move({from,to,promotion});
        move={from:move.from,to:move.to,promotion:room.game.history({verbose:true}).at(-1)?.promotion??null};
      }

      const captured=Boolean(target);
      const fen=room.game.fen();
      reply?.({ok:true,fen,from:move.from,to:move.to,promotion:move.promotion??null,captured});
      socket.to(roomId).emit("opponent-move",{fen,from:move.from,to:move.to,promotion:move.promotion??null,captured});
    }catch{
      reply?.({ok:false,error:"ILLEGAL MOVE"});
    }
  });

  socket.on("disconnect",()=>{
    const id=socket.data.roomId;if(!id)return;
    const room=rooms.get(id);if(!room)return;
    if(room.white===socket.id)room.white=null;
    if(room.black===socket.id)room.black=null;
    if(!room.white&&!room.black)rooms.delete(id);
    else io.to(id).emit("opponent-disconnected");
  });
});

httpServer.listen(3001,()=>console.log("Chess Socket.IO server listening on http://localhost:3001"));