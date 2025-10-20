import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, AlertTriangle, Users, Clock } from 'lucide-react';

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_type: string;
  content: string;
  translated_content?: any;
  is_emergency: boolean;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
}

interface ChatRoom {
  id: string;
  room_type: string;
  room_name: string;
  created_by: string;
  participants: string[];
  is_active: boolean;
  emergency_level: number;
  created_at: string;
}

interface RealTimeChatProps {
  roomId?: string;
  roomType?: string;
  onRoomCreated?: (roomId: string) => void;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ roomId, roomType = 'general', onRoomCreated }) => {
  const { user } = useAuth();
  const { currentLanguage, translate } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
      if (roomId) {
        setCurrentRoomById(roomId);
      }
    }
  }, [user, roomId]);

  useEffect(() => {
    if (currentRoom) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [currentRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms_2025_10_17_16_02')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
      
      if (data && data.length > 0 && !currentRoom) {
        setCurrentRoom(data[0]);
      }
    } catch (error) {
      console.error('Chat rooms fetch error:', error);
      toast({
        title: "채팅방 조회 실패",
        description: "채팅방 목록을 불러올 수 없습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setCurrentRoomById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms_2025_10_17_16_02')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCurrentRoom(data);
    } catch (error) {
      console.error('Room fetch error:', error);
    }
  };

  const fetchMessages = async () => {
    if (!currentRoom) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages_2025_10_17_16_02')
        .select(`
          *,
          user_profiles_2025_10_13_08_09!chat_messages_2025_10_17_16_02_sender_id_fkey (
            full_name
          )
        `)
        .eq('room_id', currentRoom.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const messagesWithSenderNames = (data || []).map(msg => ({
        ...msg,
        sender_name: msg.user_profiles_2025_10_13_08_09?.full_name || '알 수 없음'
      }));
      
      setMessages(messagesWithSenderNames);
    } catch (error) {
      console.error('Messages fetch error:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!currentRoom) return;

    const subscription = supabase
      .channel(`room_${currentRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_2025_10_17_16_02',
          filter: `room_id=eq.${currentRoom.id}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const createNewRoom = async (type: string, name: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms_2025_10_17_16_02')
        .insert({
          room_type: type,
          room_name: name,
          created_by: user?.id,
          participants: [user?.id]
        })
        .select()
        .single();

      if (error) throw error;

      setRooms(prev => [data, ...prev]);
      setCurrentRoom(data);
      
      if (onRoomCreated) {
        onRoomCreated(data.id);
      }

      toast({
        title: "채팅방 생성 완료",
        description: `${name} 채팅방이 생성되었습니다.`,
      });

    } catch (error) {
      console.error('Room creation error:', error);
      toast({
        title: "채팅방 생성 실패",
        description: "채팅방 생성에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentRoom || !user) return;

    setSending(true);

    try {
      const { error } = await supabase
        .from('chat_messages_2025_10_17_16_02')
        .insert({
          room_id: currentRoom.id,
          sender_id: user.id,
          message_type: 'text',
          content: newMessage.trim(),
          is_emergency: currentRoom.room_type === 'emergency'
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Send message error:', error);
      toast({
        title: "메시지 전송 실패",
        description: "메시지 전송에 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getRoomTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-500';
      case 'feedback': return 'bg-blue-500';
      case 'support': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'emergency': return '긴급';
      case 'feedback': return '피드백';
      case 'support': return '지원';
      case 'general': return '일반';
      default: return type;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">채팅을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col h-full max-h-[600px] sm:max-h-[700px]">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
        {/* 채팅방 목록 */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>채팅방</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => createNewRoom('feedback', '피드백 채팅')}
                  className="stable-button text-xs flex-1"
                >
                  피드백
                </Button>
                <Button
                  size="sm"
                  onClick={() => createNewRoom('support', '지원 요청')}
                  className="stable-button text-xs flex-1"
                >
                  지원
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <ScrollArea className="h-32 sm:h-48">
                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-2 sm:p-3 border rounded-lg cursor-pointer transition-colors ${
                        currentRoom?.id === room.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setCurrentRoom(room)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-xs sm:text-sm truncate">{room.room_name}</h4>
                        <Badge className={`${getRoomTypeColor(room.room_type)} text-white text-xs`}>
                          {getRoomTypeText(room.room_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Users className="h-3 w-3" />
                        <span>{room.participants.length}명</span>
                        <Clock className="h-3 w-3" />
                        <span>{new Date(room.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 채팅 영역 */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                {currentRoom && (
                  <>
                    <Badge className={`${getRoomTypeColor(currentRoom.room_type)} text-white`}>
                      {getRoomTypeText(currentRoom.room_type)}
                    </Badge>
                    <span className="truncate">{currentRoom.room_name}</span>
                    {currentRoom.emergency_level > 0 && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-2 sm:p-4">
              {/* 메시지 영역 */}
              <ScrollArea className="flex-1 mb-4 h-64 sm:h-80">
                <div className="space-y-3 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] sm:max-w-[70%] p-2 sm:p-3 rounded-lg ${
                          message.sender_id === user?.id
                            ? 'bg-blue-500 text-white'
                            : message.is_emergency
                            ? 'bg-red-100 border border-red-300'
                            : 'bg-gray-100'
                        }`}
                      >
                        {message.sender_id !== user?.id && (
                          <div className="text-xs font-medium mb-1 text-gray-600">
                            {message.sender_name}
                          </div>
                        )}
                        <div className="text-sm sm:text-base break-words">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-1 ${
                          message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 메시지 입력 */}
              {currentRoom && (
                <div className="flex space-x-2">
                  <Input
                    placeholder="메시지를 입력하세요..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sending}
                    className="flex-1 text-sm sm:text-base"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="stable-button touch-target"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RealTimeChat;