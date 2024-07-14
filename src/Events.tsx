"use client";

import React, { useEffect, useState } from "react";
import { auth, db } from "./components/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  deleteDoc,
  increment,
} from "firebase/firestore";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import { Input } from "./components/ui/input";
import { format, addMonths, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod"; // Import zodResolver for form validation

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

// Define a type for events
type Event = {
  id: string;
  eventName: string;
  eventDate: Timestamp; // Assuming eventDate is a Timestamp
  eventDetails: string;
  eventParticipants: string;
  eventField: string;
  eventStartingTime: string;
  eventFinishingTime: string;
  eventCreator: string;
  eventCreatorUid: string;
};

const Events: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
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
    };
    fetchUserData();
    fetchUpcomingEvents(); // Ensure fetchUpcomingEvents is called after setting currentUser
  }, []);

  const fetchUpcomingEvents = async () => {
    const eventsRef = collection(db, "Events");
    const querySnapshot = await getDocs(eventsRef);
    const now = new Date();
    const nextMonth = addMonths(now, 1);

    const events = querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() } as Event)) // Cast each doc.data() to Event type
      .filter((event) => {
        const eventDate = event.eventDate.toDate();
        return isWithinInterval(eventDate, { start: now, end: nextMonth });
      })
      .sort(
        (a, b) =>
          a.eventDate.toDate().getTime() - b.eventDate.toDate().getTime()
      );

    setUpcomingEvents(events);
  };

  async function incrementEventsCreatedForAllUsers() {
    try {
      const usersRef = collection(db, "Users");
      const querySnapshot = await getDocs(usersRef);

      const incrementPromises = querySnapshot.docs.map((userDoc) =>
        updateDoc(userDoc.ref, {
          eventsCreated: increment(1),
        })
      );

      await Promise.all(incrementPromises);
      console.log("Incremented eventsCreated for all users");
    } catch (error) {
      console.error("Error incrementing eventsCreated for all users: ", error);
    }
  }

  const FormSchema = z.object({
    doe: z.date({
      required_error: "A data do evento é necessária.",
    }),
    name: z
      .string()
      .min(1, "É necessário atribuir um nome ao evento")
      .max(35, "Apenas o primeiro e o último nome são necessários"),
    details: z.string(),
    participants: z.string(),
    field: z.string().min(1, "Aroeira I ou Aroeira II"),
    startingTime: z.string(),
    finishingTime: z.string(),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema), // Use zodResolver for form validation
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    try {
      const newEventDoc = await addDoc(collection(db, "Events"), {
        eventName: data.name,
        eventDate: Timestamp.fromDate(data.doe),
        eventDetails: data.details,
        eventParticipants: data.participants,
        eventField: data.field,
        eventStartingTime: data.startingTime,
        eventFinishingTime: data.finishingTime,
        eventCreator: currentUser.name,
        eventCreatorUid: currentUser.uid,
      });
      console.log("Event document added with ID: ", newEventDoc.id);

      // Increment the event count for all users
      await incrementEventsCreatedForAllUsers();

      form.reset();
      fetchUpcomingEvents(); // Refresh the upcoming events list
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteDoc(doc(db, "Events", eventId));
      console.log("Event document deleted with ID: ", eventId);
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
          <h2 className="text-xl font-bold mb-4">Próximos Eventos</h2>
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white p-4 rounded shadow mb-4 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold">{event.eventName}</h3>
                <p>Nº Participantes: {event.eventParticipants}</p>
                <p>Campo: {event.eventField}</p>
                <p>{event.eventDetails}</p>
                <p>
                  {format(event.eventDate.toDate(), "PPP", { locale: pt })} -{" "}
                  {event.eventStartingTime} horas às {event.eventFinishingTime}{" "}
                  horas
                </p>
                {currentUser &&
                  (currentUser.role === "admin" ||
                    currentUser.role === "moderator") && (
                    <Button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="mt-2 bg-red-500"
                    >
                      Delete
                    </Button>
                  )}
              </div>
            ))
          ) : (
            <p>Sem próximos eventos.</p>
          )}
        </div>
        <div className="w-full flex justify-center p-5 ">
          {currentUser &&
          (currentUser.role === "admin" || currentUser.role === "moderator") ? (
            <div className="flex flex-col items-center justify-between bg-white p-5 rounded-lg">
              <div className="flex flex-col items-center justify-between">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-8"
                    >
                      <FormField
                        control={form.control}
                        name="doe"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Data do evento
                            </FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className="w-[240px] pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: pt })
                                    ) : (
                                      <span>Escolher a data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
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
                        name="startingTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Evento começa às:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Hora do início"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="finishingTime"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Evento termina às:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Hora do fim"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Nome do evento:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome do evento"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Detalhes do evento:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Detalhes do evento"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="participants"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Número de participantes do evento:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Número de participantes"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="field"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="mb-2">
                              Campo do evento:
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Aroeira I ou Aroeira II"
                                {...field}
                              ></Input>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="bg-[#23423a]">
                        Submeter
                      </Button>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default Events;
