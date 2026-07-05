"use client";

import { useState, useEffect, useRef } from "react";

export function useHighlight<T>(data: T, duration = 2000) {
  const [highlight, setHighlight] = useState(false);
  const prevData = useRef(data);

  useEffect(() => {
    if (prevData.current !== data) {
      setHighlight(true);
      prevData.current = data;
      const timer = setTimeout(() => setHighlight(false), duration);
      return () => clearTimeout(timer);
    }
  }, [data, duration]);

  return highlight;
}

export function useRowHighlight<T extends { category?: string; concern_id?: string; item?: string; title?: string }>(
  items: T[] | null,
  duration = 2000
) {
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const prevItems = useRef<T[]>([]);

  useEffect(() => {
    if (!items) return;

    const newIds = new Set<string>();
    const prevMap = new Map<string, T>();

    for (const item of prevItems.current) {
      const key = getItemKey(item);
      if (key) prevMap.set(key, item);
    }

    for (const item of items) {
      const key = getItemKey(item);
      if (key && !prevMap.has(key)) {
        newIds.add(key);
      }
    }

    if (newIds.size > 0) {
      setHighlightedIds(newIds);
      const timer = setTimeout(() => setHighlightedIds(new Set()), duration);
      prevItems.current = [...items];
      return () => clearTimeout(timer);
    }

    prevItems.current = [...items];
  }, [items, duration]);

  return highlightedIds;
}

function getItemKey(item: { category?: string; concern_id?: string; item?: string; title?: string }): string | null {
  if (item.concern_id) return item.concern_id;
  if (item.category && item.item) return `${item.category}-${item.item}`;
  if (item.title) return item.title;
  return null;
}
