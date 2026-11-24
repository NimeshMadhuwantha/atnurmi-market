"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase-client";

export default function UiTestLoginPage() {
  const [message, setMessage] = useState("Preparing test session…");

  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (!firebaseAuth || !token) {
      setMessage("Test session is unavailable.");
      return;
    }
    void signInWithCustomToken(firebaseAuth, token)
      .then(() => window.location.replace("/my-arts"))
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Test sign-in failed."));
  }, []);

  return <main><p id="ui-test-status">{message}</p></main>;
}
