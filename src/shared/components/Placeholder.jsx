import { useEffect, useState } from "react";
import { get } from "../api/client";
import PageHeader from "./PageHeader";

export default function Placeholder({title,endpoint}){
  const [message,setMessage]=useState("Checking backend module…");
  useEffect(()=>{get(endpoint).then(r=>setMessage(r.message||"Endpoint available.")).catch(e=>setMessage(e.message))},[endpoint]);
  return <><PageHeader title={title} description={`Frontend shell for ${endpoint}.`}/><div className="card"><h3>Backend module status</h3><p className="muted">{message}</p><div className="callout">This module is intentionally kept as a UI shell until its corresponding backend service is implemented.</div></div></>
}