import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function RequireAuth({ children, fallback=null }){
  const [user,setUser]=useState(undefined);
  useEffect(()=>onAuthStateChanged(auth,setUser),[]);
  if(user===undefined) return <div className="p-4">Chargement…</div>;
  if(!user) return fallback ?? <div className="p-4">Non autorisé</div>;
  return children;
}
