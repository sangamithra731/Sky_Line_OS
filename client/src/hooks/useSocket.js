import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export default function useSocket(event, handler) {
  const socketRef = useRef(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });
    const wrapped = (...args) => handlerRef.current?.(...args);
    socketRef.current.on(event, wrapped);
    return () => {
      socketRef.current?.off(event, wrapped);
      socketRef.current?.disconnect();
    };
  }, [event]);
}