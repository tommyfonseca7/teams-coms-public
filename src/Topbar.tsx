import { useEffect, useState } from "react";
import { auth, db } from "./components/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Button } from "./components/ui/button";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import logo from "./assets/aroeira_logo.png";
import GroupIcon from "@mui/icons-material/Group";
import PunchClockIcon from "@mui/icons-material/PunchClock";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import ChatIcon from "@mui/icons-material/Chat";
import EventIcon from "@mui/icons-material/Event";
import TaskIcon from "@mui/icons-material/Task";
import { Separator } from "./components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet";

interface User {
  id: string;
  NewsCount?: number;
  eventsCreated?: number;
  numberOfChanges?: number;
  taskCount?: number;
  [key: string]: any;
}

const TopBar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
          } else {
            console.log("No such document!");
          }
        } else {
          console.log("User is not logged in");
        }
      });
    };

    fetchUserData();
  }, []);

  const handleRedirect = (path: string) => {
    return async () => {
      try {
        // Update user counts in Firestore
        if (currentUser) {
          const userRef = doc(db, "Users", currentUser.id);
          const updateFields = {
            latestNewCount: currentUser.NewsCount || 0,
            latestEventsCreated: currentUser.eventsCreated || 0,
            latestNumberOfChanges: currentUser.numberOfChanges || 0,
            latestTaskCount: currentUser.taskCount || 0,
          };

          await updateDoc(userRef, updateFields);
          setCurrentUser((prevUser) => {
            if (prevUser) {
              return {
                ...prevUser,
                ...updateFields,
              };
            }
            return null;
          });

          // Redirect after update
          window.location.href = path;
        }
      } catch (error) {
        console.log("Error redirecting or updating user counts", error);
      }
    };
  };

  const formatDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between relative">
          <div className="flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" className="fixed top-0 left-0 m-4">
                  <HamburgerMenuIcon className="h-4 w-4"></HamburgerMenuIcon>
                </Button>
              </SheetTrigger>
              <SheetContent side={"left"}>
                <SheetHeader>
                  <SheetTitle>Aroeira Team</SheetTitle>
                  <SheetDescription>{formatDate()}</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/team")}
                  >
                    <GroupIcon className="fixed left-0 m-10" />
                    Equipa
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/horario")}
                  >
                    <PunchClockIcon className="fixed left-0 m-10" />
                    Horário
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/noticias")}
                  >
                    <NewspaperIcon className="fixed left-0 m-10" />
                    Notícias
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/chat")}
                  >
                    <ChatIcon className="fixed left-0 m-10" />
                    Chat
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/eventos")}
                  >
                    <EventIcon className="fixed left-0 m-10" />
                    Eventos
                  </Button>
                  <Separator />
                  <Button
                    variant="ghost"
                    className="w-full mt-3"
                    onClick={handleRedirect("/tarefas")}
                  >
                    <TaskIcon className="fixed left-0 m-10" />
                    Tarefas
                  </Button>
                </div>
                <SheetFooter></SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <img
              src={logo}
              alt="Logo"
              className="w-10 h-10 cursor-pointer"
              onClick={() => handleRedirect("/home")()}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
