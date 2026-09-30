/**
 * lib/hooks/useChatRealtime.js
 *
 * Menggantikan setInterval polling dengan Supabase Realtime WebSocket & Broadcast.
 * Subscribe ke perubahan tabel `order_rooms` dan `chat_messages` di PostgreSQL.
 * Ketika ada INSERT, UPDATE, atau DELETE, fetch ulang room secara efisien tanpa drop event.
 */
"use client";

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { authService } from "@/lib/services/authService";

/**
 * @param {Object}       opts
 * @param {string|null}  opts.currentUserId  - ID user yang sedang login
 * @param {string|null}  opts.roomParam      - roomId dari URL (opsional)
 * @param {Function}     opts.onRoomsUpdate  - callback(rooms[], isInitial) dipanggil ketika data baru tiba
 * @param {boolean}      opts.enabled        - aktifkan subscription (default: true)
 */
export function useChatRealtime({ currentUserId, roomParam, onRoomsUpdate, enabled = true }) {
  const channelRef = useRef(null);
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef(null);

  // ---- Fetch Rooms -----------------------------------------------------------
  const fetchRooms = useCallback(async (isInitial = false) => {
    try {
      let token = await authService.getValidAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const url = roomParam
        ? `/api/chat/rooms?roomId=${encodeURIComponent(roomParam)}`
        : "/api/chat/rooms";

      const res = await fetch(url, { headers });
      if (!res.ok || !isMountedRef.current) return;

      const json = await res.json();
      if (json.success && Array.isArray(json.data) && isMountedRef.current) {
        onRoomsUpdate(json.data, isInitial);
      }
    } catch (e) {
      console.warn("[useChatRealtime] fetch failed:", e);
    }
  }, [roomParam, onRoomsUpdate]);

  // Debounce dengan trailing timer: menjamin event tidak pernah terdrop
  const triggerFetch = useCallback((isInitial = false) => {
    if (isInitial) {
      fetchRooms(true);
      return;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        fetchRooms(false);
      }
    }, 250);
  }, [fetchRooms]);

  // ---- Subscribe Supabase Realtime -------------------------------------------
  useEffect(() => {
    if (!enabled) return;
    isMountedRef.current = true;

    // Load awal
    triggerFetch(true);

    const channelName = "chat-rt-global-sync";

    const channel = supabase
      .channel(channelName)
      // Listen to all changes on chat_messages (INSERT, UPDATE, DELETE)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () => {
        triggerFetch(false);
      })
      // Listen to all changes on order_rooms (INSERT, UPDATE, DELETE)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_rooms" }, () => {
        triggerFetch(false);
      })
      // Listen to Broadcast events for instant cross-tab/client updates
      .on("broadcast", { event: "chat_update" }, () => {
        triggerFetch(false);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.info("[useChatRealtime] WebSocket Realtime aktif:", channelName);
        }
      });

    channelRef.current = channel;

    // Listener event lokal jendela untuk pembaruan cepat di tab yang sama
    const handleLocalUpdate = () => triggerFetch(false);
    window.addEventListener("bantuin_chat_update", handleLocalUpdate);

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener("bantuin_chat_update", handleLocalUpdate);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, currentUserId, roomParam, triggerFetch]);

  // Helper fungsi untuk broadcast sinyal pembaruan ke seluruh client lain
  const notifyChatUpdate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_chat_update"));
    }
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "chat_update",
        payload: { timestamp: Date.now() },
      }).catch(() => null);
    }
  }, []);

  return { notifyChatUpdate };
}

