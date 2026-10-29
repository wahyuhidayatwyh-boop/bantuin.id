/**
 * lib/hooks/useChatRealtime.js
 *
 * Menggantikan broadcast global dengan Channel Realtime terisolasi per-user dan per-room.
 * Menjamin isolasi penuh: hanya partisipan percakapan yang menerima pembaruan secara realtime.
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
  const userChannelRef = useRef(null);
  const roomChannelRef = useRef(null);
  const isMountedRef = useRef(true);
  const debounceTimerRef = useRef(null);
  const onRoomsUpdateRef = useRef(onRoomsUpdate);

  // Selalu perbarui ref tanpa memicu re-render atau re-subscribe
  useEffect(() => {
    onRoomsUpdateRef.current = onRoomsUpdate;
  });

  // ---- Fetch Rooms -----------------------------------------------------------
  const fetchRooms = useCallback(async (isInitial = false) => {
    try {
      let token = await authService.getValidAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      // Selalu ambil seluruh daftar bilik obrolan pengguna agar daftar obrolan sidebar tetap utuh
      const url = "/api/chat/rooms";

      const res = await fetch(url, { headers });
      if (!isMountedRef.current) return;

      if (!res.ok) {
        onRoomsUpdateRef.current?.([], isInitial);
        return;
      }

      const json = await res.json();
      if (!isMountedRef.current) return;

      if (json.success && Array.isArray(json.data)) {
        onRoomsUpdateRef.current?.(json.data, isInitial);
      } else {
        onRoomsUpdateRef.current?.([], isInitial);
      }
    } catch (e) {
      console.warn("[useChatRealtime] fetch failed:", e);
      if (isMountedRef.current) {
        onRoomsUpdateRef.current?.([], isInitial);
      }
    }
  }, []);

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

  // ---- Subscribe Supabase Realtime Scoped -------------------------------------
  useEffect(() => {
    if (!enabled) return;
    isMountedRef.current = true;

    // Load awal
    triggerFetch(true);

    // 1. Channel Terisolasi User: untuk menerima pesan baru dari partner manapun
    if (currentUserId) {
      const userChannelName = `user-rt-${currentUserId}`;
      const uChannel = supabase
        .channel(userChannelName)
        .on("broadcast", { event: "chat_update" }, () => {
          triggerFetch(false);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            // Channel user aktif
          }
        });
      userChannelRef.current = uChannel;
    }

    // 2. Channel Terisolasi Room: untuk sync instan di dalam bilik percakapan spesifik
    const isUuid = roomParam && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomParam);
    if (roomParam) {
      const roomChannelName = `room-rt-${roomParam}`;
      let rChannel = supabase
        .channel(roomChannelName)
        .on("broadcast", { event: "chat_update" }, () => {
          triggerFetch(false);
        });

      // Jika roomParam adalah UUID OrderRoom, subscribe postgres_changes khusus room ini
      if (isUuid) {
        rChannel = rChannel
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "chat_messages",
              filter: `order_room_id=eq.${roomParam}`,
            },
            () => {
              triggerFetch(false);
            }
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "order_rooms",
              filter: `id=eq.${roomParam}`,
            },
            () => {
              triggerFetch(false);
            }
          );
      }

      // Listener event chat_read untuk sinkronisasi centang biru seketika
      rChannel = rChannel.on("broadcast", { event: "chat_read" }, () => {
        triggerFetch(false);
      });

      rChannel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // Channel room aktif
        }
      });
      roomChannelRef.current = rChannel;
    }

    // Heartbeat kehadiran online ke server setiap 25 detik saat tab aktif
    const sendHeartbeat = () => {
      if (currentUserId && typeof document !== "undefined" && document.visibilityState === "visible") {
        fetch("/api/chat/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUserId }),
        }).catch(() => null);
      }
    };
    sendHeartbeat();
    const heartbeatInterval = setInterval(sendHeartbeat, 25000);

    // Listener event lokal jendela untuk pembaruan cepat di tab yang sama
    const handleLocalUpdate = () => triggerFetch(false);
    window.addEventListener("bantuin_chat_update", handleLocalUpdate);

    // Segera perbarui saat tab aktif kembali dari background
    const handleVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        sendHeartbeat();
        triggerFetch(false);
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    // Auto-polling interval: sinkronisasi berkala yang efisien tanpa membebani server
    const pollInterval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "hidden") {
        triggerFetch(false);
      }
    }, 3000);

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      window.removeEventListener("bantuin_chat_update", handleLocalUpdate);
      if (userChannelRef.current) {
        supabase.removeChannel(userChannelRef.current);
        userChannelRef.current = null;
      }
      if (roomChannelRef.current) {
        supabase.removeChannel(roomChannelRef.current);
        roomChannelRef.current = null;
      }
    };
  }, [enabled, currentUserId, roomParam, triggerFetch]);

  // Helper fungsi untuk broadcast sinyal pembaruan terisolasi ke partner & room
  const notifyChatUpdate = useCallback((opts = {}) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_chat_update"));
    }

    const targetRoomId = opts?.roomId || roomParam;
    const targetPartnerId = opts?.partnerId;

    if (targetRoomId) {
      const roomChannel = supabase.channel(`room-rt-${targetRoomId}`);
      roomChannel
        .send({
          type: "broadcast",
          event: "chat_update",
          payload: { roomId: targetRoomId, timestamp: Date.now() },
        })
        .catch(() => null);
    }

    if (targetPartnerId) {
      const partnerChannel = supabase.channel(`user-rt-${targetPartnerId}`);
      partnerChannel
        .send({
          type: "broadcast",
          event: "chat_update",
          payload: { partnerId: targetPartnerId, timestamp: Date.now() },
        })
        .catch(() => null);
    }
  }, [roomParam]);

  // Helper fungsi untuk broadcast tanda telah dibaca (read receipt) seketika
  const notifyChatRead = useCallback((opts = {}) => {
    const targetRoomId = opts?.roomId || roomParam;
    const targetPartnerId = opts?.partnerId;

    if (targetRoomId) {
      const roomChannel = supabase.channel(`room-rt-${targetRoomId}`);
      roomChannel
        .send({
          type: "broadcast",
          event: "chat_read",
          payload: { roomId: targetRoomId, readerId: currentUserId, timestamp: Date.now() },
        })
        .catch(() => null);
    }

    if (targetPartnerId) {
      const partnerChannel = supabase.channel(`user-rt-${targetPartnerId}`);
      partnerChannel
        .send({
          type: "broadcast",
          event: "chat_read",
          payload: { roomId: targetRoomId, readerId: currentUserId, timestamp: Date.now() },
        })
        .catch(() => null);
    }
  }, [roomParam, currentUserId]);

  return { notifyChatUpdate, notifyChatRead };
}
