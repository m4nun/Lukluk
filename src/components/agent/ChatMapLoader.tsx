"use client";

import dynamic from "next/dynamic";
import type { MapPlace } from "@/lib/agent/tool-results";

interface ChatMapProps {
  places: MapPlace[];
  center: { lat: number; lng: number };
  zoom: number;
}

const ChatMap = dynamic(() => import("./ChatMap"), { ssr: false });

export default function ChatMapLoader(props: ChatMapProps) {
  return <ChatMap {...props} />;
}