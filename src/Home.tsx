import React, { useEffect, useState } from "react";
import { auth, db } from "./components/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import CircularIndeterminate from "./CircularIndeterminate";

const Home: React.FC = () => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const fetchUserData = async () => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "Users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserDetails(docSnap.data());
        } else {
          console.log("User data not found.");
        }
      } else {
        console.log("User is not logged in.");
      }
    });
  };

  const fetchMessagesCount = async () => {
    const messagesRef = collection(db, "messages");
    const messagesSnap = await getDocs(messagesRef);
    return messagesSnap.size;
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchUserNotifications = async () => {
      if (userDetails && userDetails.uid) {
        const messagesCount = await fetchMessagesCount(); // Removed userDetails.uid from here

        const newNotifications: string[] = [];

        if (
          userDetails.latestNewCount !== undefined &&
          userDetails.NewsCount !== undefined &&
          userDetails.latestNewCount < userDetails.NewsCount
        ) {
          const count = userDetails.NewsCount - userDetails.latestNewCount;
          newNotifications.push(
            `Estão ${count} novas notícias para verificar.`
          );
        }

        if (
          userDetails.latestEventsCreated !== undefined &&
          userDetails.eventsCreated !== undefined &&
          userDetails.latestEventsCreated < userDetails.eventsCreated
        ) {
          const count =
            userDetails.eventsCreated - userDetails.latestEventsCreated;
          newNotifications.push(`Estão ${count} novos eventos para verificar.`);
        }

        if (
          userDetails.latestNumberOfChanges !== undefined &&
          userDetails.numberOfChanges !== undefined &&
          userDetails.latestNumberOfChanges < userDetails.numberOfChanges
        ) {
          const count =
            userDetails.numberOfChanges - userDetails.latestNumberOfChanges;
          newNotifications.push(
            `Estão ${count} novas mudanças de horário para verificar.`
          );
        }

        if (
          userDetails.latestTaskCount !== undefined &&
          userDetails.tasksCount !== undefined &&
          userDetails.latestTaskCount < userDetails.tasksCount
        ) {
          const count = userDetails.tasksCount - userDetails.latestTaskCount;
          newNotifications.push(`Estão ${count} novas tarefas para verificar.`);
        }

        if (
          userDetails.messagesSeen !== undefined &&
          userDetails.messagesSeen < messagesCount
        ) {
          const count = messagesCount - userDetails.messagesSeen;
          setUnreadMessagesCount(count);
          console.log("nr msgs firebase: ", messagesCount);
          console.log("nr msgs user: ", userDetails.messagesSeen);
          console.log("dif: ", count);
        }

        setNotifications(newNotifications);
      }
    };

    fetchUserNotifications();
  }, [userDetails]);

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/";
      console.log("User logged out successfully!");
    } catch (error) {
      console.log("Error logging out", error);
    }
  }

  return (
    <>
      <TopBar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="p-8  w-full max-w-md">
          {userDetails ? (
            <>
              <h3 className="text-2xl text-[#23423a] font-bold mb-4">
                Bem vindo, {userDetails.name}
              </h3>

              {notifications.length > 0 && (
                <div className="mt-4 p-4 border border-gray-300 rounded mb-4">
                  <h4 className="mb-2 text-lg font-medium">Notificações</h4>
                  {notifications.map((notification, index) => (
                    <div key={index} className="mb-2">
                      {notification}
                    </div>
                  ))}
                  {unreadMessagesCount > 0 && (
                    <div className="mt-2">
                      Estão {unreadMessagesCount} novas mensagens por ler.
                    </div>
                  )}
                </div>
              )}

              <Button
                className="mt-6 w-full bg-[#23423a] text-white py-2 px-4 rounded"
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </>
          ) : (
            <CircularIndeterminate />
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
