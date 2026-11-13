"use client";
import { useApp } from "./app-provider";
export function RoleSwitch() { const { role, setRole } = useApp(); return <button className="role-switch" onClick={() => setRole(role === "artist" ? "customer" : "artist")}><span><strong>Viewing as {role === "artist" ? "artist" : "collector"}</strong><small>Switch to {role === "artist" ? "collector" : "artist"} view</small></span><i className={role === "artist" ? "switch active" : "switch"}/></button>; }

