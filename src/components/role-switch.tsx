"use client";
import { useApp } from "./app-provider";
export function RoleSwitch() { const { role, accountRole, toggleRoleView } = useApp(); if (accountRole !== "artist") return null; return <button className="role-switch" onClick={toggleRoleView}><span><strong>Viewing as {role === "artist" ? "artist" : "user"}</strong><small>Switch to {role === "artist" ? "user" : "artist"} view</small></span><i className={role === "artist" ? "switch active" : "switch"}/></button>; }

