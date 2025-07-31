import { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { config } from '@/lib/config';

const WS_URL = config.websocket.url;

export function usePresence(researchId) {
  const [editors, setEditors] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const supabase = useSupabaseClient();

  const connect = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const socket = new WebSocket(WS_URL);
    setWs(socket);

    socket.onopen = () => {
      setIsConnected(true);
      // Send initial start_edit message
      socket.send(JSON.stringify({
        type: 'start_edit',
        researchId,
        username: user.user_metadata.username || user.email
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'editors_update' && data.editors[researchId]) {
        setEditors(data.editors[researchId]);
      }
    };

    socket.onclose = () => {
      setIsConnected(false);
      setEditors([]);
    };

    return socket;
  }, [researchId, supabase]);

  useEffect(() => {
    const socket = connect();

    return () => {
      if (socket) {
        // Send stop_edit message before closing
        socket.send(JSON.stringify({
          type: 'stop_edit',
          researchId,
          username: supabase.auth.user()?.user_metadata?.username
        }));
        socket.close();
      }
    };
  }, [connect, researchId]);

  return {
    editors,
    isConnected
  };
} 