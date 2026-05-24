"use client";

import { useEffect, useState } from "react";

export default function TypingText() {
  const words = [
    "Plywood",
    "Laminate",
    "Glass",
    "Wood",
    "Hardware",
    "Aluminium section",
    "UPVC windows"
  ];

  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (index === words.length) return setIndex(0);

    if (subIndex === words[index].length + 1 && !isDeleting) {
      setTimeout(() => setIsDeleting(true), 1000);
      return;
    }

    if (subIndex === 0 && isDeleting) {
      setIsDeleting(false);
      setIndex((prev) => prev + 1);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (isDeleting ? -1 : 1));
      setText(words[index].substring(0, subIndex));
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [subIndex, index, isDeleting]);

  return (
    <h1 className="text-2xl font-bold">
      {text}
      <span className="animate-pulse">|</span>
    </h1>
  );
}