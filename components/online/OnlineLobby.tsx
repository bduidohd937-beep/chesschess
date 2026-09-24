"use client";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
type Props={onBack:()=>void;onGameStart:(socket:Socket,roomId:string,color:"w"|"b")=>void};
const URL=process.env.NEXT_PUBLIC_SOCKET_URL||"http://localhost:3001";
export default function OnlineLobby({onBack,onGameStart}:Props){
 const [socket,setSocket]=useState<Socket|null>(null),[code,setCode]=useState(""),[created,setCreated]=useState(""),[status,setStatus]=useState("READY"),[busy,setBusy]=useState(false);
 useEffect(()=>{const s=io(URL,{transports:["websocket"]});setSocket(s);s.on("connect_error",()=>setStatus("SERVER OFFLINE"));s.on("room-created",({roomId})=>{setCreated(roomId);setStatus("WAITING FOR OPPONENT");setBusy(false)});s.on("room-joined",({roomId})=>{setBusy(false);onGameStart(s,roomId,"b")});s.on("game-start",({roomId})=>onGameStart(s,roomId,"w"));return()=>s.disconnect()},[onGameStart]);
 const create=()=>{if(!socket)return;setBusy(true);setStatus("CREATING ROOM");socket.emit("create-room")};
 const join=()=>{if(!socket||code.length!==5)return;setBusy(true);setStatus("JOINING ROOM");socket.emit("join-room",{roomId:code},(r:{ok:boolean;error?:string})=>{if(!r.ok){setBusy(false);setStatus(r.error||"JOIN FAILED")}})};
 return <main className="online-lobby"><div className="online-card"><div className="eyebrow">ONLINE 1V1</div><h1>Play Online</h1><p className="online-subtitle">Create a room or join your friend's room code.</p><button className="online-primary" onClick={create} disabled={busy||!socket}>CREATE ROOM</button>{created&&<div className="room-code-box"><span>ROOM CODE</span><strong>{created}</strong><small>Send this code to your opponent.</small></div>}<div className="online-divider"><span>OR</span></div><div className="join-row"><input value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,5))} placeholder="ABCDE" maxLength={5}/><button className="online-secondary" onClick={join} disabled={busy||code.length!==5}>JOIN</button></div><div className="online-status">{status}</div><button className="online-back" onClick={onBack}>← BACK</button></div></main>
}