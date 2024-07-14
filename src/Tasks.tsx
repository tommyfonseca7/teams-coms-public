"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "./components/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  increment,
} from "firebase/firestore";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import { Input } from "./components/ui/input";
// Datepicker
import { zodResolver } from "@hookform/resolvers/zod";
import { format, addMonths, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Calendar } from "./components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import Select from "react-select"; // Import the react-select library

interface Task {
  id: string;
  taskName: string;
  taskStartingDate: Timestamp;
  taskFinishingDate: Timestamp;
  taskdetails: string;
  taskCreator: string;
  taskCreatorUid: string;
  assignedUsers: string[];
  completed: boolean;
}

const Tasks: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Task[]>([]);
  const [users, setUsers] = useState<any[]>([]); // State to store users

  useEffect(() => {
    const fetchUserData = async () => {
      const usersRef = collection(db, "Users");

      auth.onAuthStateChanged(async (user) => {
        if (user) {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setCurrentUser({ id: docSnap.id, ...docSnap.data() });
          } else {
            console.log("No such document!");
          }
        } else {
          console.log("User is not logged in");
        }
      });

      const currentUserAuth = auth.currentUser;
      if (currentUserAuth) {
        const q = query(usersRef, where("uid", "==", currentUserAuth.uid));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
          setCurrentUser({
            id: doc.id,
            ...doc.data(),
          });
        });
      }

      // Fetch all users for the multi-select input
      const usersSnapshot = await getDocs(usersRef);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    };
    fetchUserData();
    fetchUpcomingEvents();
  }, []);

  const fetchUpcomingEvents = async () => {
    const eventsRef = collection(db, "Tasks");
    const querySnapshot = await getDocs(eventsRef);
    const now = new Date();
    const nextMonth = addMonths(now, 1);

    const tasks = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Task))
      .filter((task) => {
        const taskDate = task.taskStartingDate.toDate();
        return isWithinInterval(taskDate, { start: now, end: nextMonth });
      })
      .sort(
        (a, b) =>
          a.taskStartingDate.toDate().getTime() -
          b.taskStartingDate.toDate().getTime()
      );

    setUpcomingEvents(tasks);
  };

  const FormSchema = z.object({
    startingDate: z.date({
      required_error: "A data de comeco é necessária.",
    }),
    finishingDate: z.date({
      required_error: "A data de fim é necessária.",
    }),
    name: z
      .string()
      .min(1, "É necessário atribuir um nome à tarefa")
      .max(35, "Apenas o primeiro e o último nome são necessários"),
    details: z.string(),
    assignedUsers: z
      .array(
        z.object({
          value: z.string(),
          label: z.string(),
        })
      )
      .optional(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const newEventDoc = await addDoc(collection(db, "Tasks"), {
        taskName: data.name,
        taskStartingDate: Timestamp.fromDate(data.startingDate),
        taskFinishingDate: Timestamp.fromDate(data.finishingDate),
        taskdetails: data.details,
        taskCreator: currentUser.name,
        taskCreatorUid: currentUser.uid,
        assignedUsers: data.assignedUsers
          ? data.assignedUsers.map((user) => user.value)
          : [],
        completed: false, // Add completed field here
      });

      if (data.assignedUsers && data.assignedUsers.length > 0) {
        for (const user of data.assignedUsers) {
          const userRef = doc(db, "Users", user.value);
          await updateDoc(userRef, {
            tasksCount: increment(1),
          });
        }
      } else {
        for (const user of users) {
          const userRef = doc(db, "Users", user.id);
          await updateDoc(userRef, {
            tasksCount: increment(1),
          });
        }
      }

      console.log("Event document added with ID: ", newEventDoc.id);
      form.reset();
      fetchUpcomingEvents(); // Refresh the upcoming events list
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  const handleConfirmCompletion = async (taskId: string) => {
    try {
      const taskRef = doc(db, "Tasks", taskId);
      await updateDoc(taskRef, { completed: true });
      fetchUpcomingEvents(); // Refresh the upcoming events list
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const taskRef = doc(db, "Tasks", taskId);
      const taskSnap = await getDoc(taskRef);

      if (taskSnap.exists()) {
        const taskData = taskSnap.data() as Task;
        if (taskData.assignedUsers && taskData.assignedUsers.length > 0) {
          for (const userId of taskData.assignedUsers) {
            const userRef = doc(db, "Users", userId);
            await updateDoc(userRef, {
              tasksCount: increment(-1),
            });
          }
        }
      }

      await deleteDoc(taskRef);
      fetchUpcomingEvents(); // Refresh the upcoming events list
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  return (
    <>
      <TopBar />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-20">
        <div className="w-full flex flex-col items-center p-5 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Tarefas</h2>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded shadow mb-4 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold">{event.taskName}</h3>
                <p>Detalhes: {event.taskdetails}</p>
                <p>
                  {format(event.taskStartingDate.toDate(), "PPP", {
                    locale: pt,
                  })}{" "}
                  -{" "}
                  {format(event.taskFinishingDate.toDate(), "PPP", {
                    locale: pt,
                  })}
                </p>
                {event.assignedUsers && event.assignedUsers.length > 0 ? (
                  <p>
                    Atribuida a:{" "}
                    {event.assignedUsers
                      .map((userId) => {
                        const user = users.find((u) => u.id === userId);
                        return user ? user.name : userId;
                      })
                      .join(", ")}
                  </p>
                ) : (
                  <p></p>
                )}
                <p>Criada por: {event.taskCreator}</p>
                {event.assignedUsers &&
                  (event.assignedUsers.includes(currentUser?.uid) ||
                    event.assignedUsers.length === 0) && (
                    <div className="mt-2">
                      {event.completed ? (
                        <p className="text-green-600 font-bold">
                          Tarefa Completa
                        </p>
                      ) : (
                        <Button
                          onClick={() => handleConfirmCompletion(event.id)}
                          className="mt-2 bg-[#23423a]"
                        >
                          Confirmar conclusão tarefa
                        </Button>
                      )}
                    </div>
                  )}

                {(currentUser?.role === "admin" ||
                  currentUser?.role === "moderator") && (
                  <Button
                    onClick={() => handleDeleteTask(event.id)}
                    className="mt-2 bg-red-500"
                  >
                    Deletar Tarefa
                  </Button>
                )}
              </div>
            ))
          ) : (
            <p>Não há tarefas nos próximos 30 dias.</p>
          )}
        </div>
        <div className="w-full max-w-md p-5 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Adicionar nova tarefa</h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-2 w-full"
            >
              <FormField
                control={form.control}
                name="startingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Começo</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-[240px] pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: pt })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="finishingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-[240px] pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: pt })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Tarefa</FormLabel>
                    <FormControl>
                      <Input placeholder="Insira o nome da tarefa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detalhes</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Insira os detalhes da tarefa"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assignedUsers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Users</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        isMulti
                        options={users.map((user) => ({
                          value: user.id,
                          label: user.name,
                        }))}
                        placeholder="Select users..."
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="mt-2 bg-[#23423a]">
                Adicionar Tarefa
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </>
  );
};

export default Tasks;
