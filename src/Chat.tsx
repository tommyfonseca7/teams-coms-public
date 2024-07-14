import React, { useEffect, useState, useRef, FormEvent } from "react";
import { auth, db } from "./components/firebase";
import TopBar from "./Topbar";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  getDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  createdAt: any;
  user: string;
  userName: string;
}

const Chat: React.FC = () => {
  const messageRef = collection(db, "messages");
  const usersRef = collection(db, "Users");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const getUserName = async (uid: string) => {
    const userDoc = await getDoc(doc(usersRef, uid));
    if (userDoc.exists()) {
      return userDoc.data().name;
    }
    return "Unknown User";
  };

  const updateUserMessageCount = async (uid: string, messageCount: number) => {
    const userDocRef = doc(usersRef, uid);
    await updateDoc(userDocRef, {
      messagesSeen: messageCount,
    });
  };

  useEffect(() => {
    const queryMessages = query(messageRef, orderBy("createdAt"));
    const unsubscribe = onSnapshot(queryMessages, async (snapshot) => {
      const messages: Message[] = [];
      for (const doc of snapshot.docs) {
        const messageData = doc.data();
        const userName = await getUserName(messageData.user);
        messages.push({ ...messageData, id: doc.id, userName } as Message);
      }
      console.log("messages: ", messages);
      setMessages(messages);

      if (auth.currentUser) {
        // Update message count for the current user
        updateUserMessageCount(auth.currentUser.uid, messages.length);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (newMessage === "") return;
    if (auth.currentUser) {
      await addDoc(messageRef, {
        text: newMessage,
        createdAt: serverTimestamp(),
        user: auth.currentUser.uid,
      });

      setNewMessage("");
    }
  };

  return (
    <>
      <TopBar />

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="flex flex-col w-full max-w-xl">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`shadow-md rounded-lg p-4 my-2 ${
                message.user === auth.currentUser?.uid
                  ? "bg-[#23423a] text-white self-end"
                  : "bg-white text-black self-start"
              }`}
            >
              <div className="font-bold">{message.userName}</div>
              <div>{message.text}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex justify-center mt-4 w-full max-w-xl mx-auto p-4"
      >
        <textarea
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          placeholder="Insira a sua mensagem..."
          className="border rounded-l-lg p-2 w-full bg-white focus:outline-none focus:ring-2 focus:ring-[#23423a] resize-none h-10"
          rows={1}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
        <button
          type="submit"
          className="bg-[#23423a] text-white rounded-r-lg p-2"
        >
          Enviar
        </button>
      </form>
    </>
  );
};

export default Chat;
