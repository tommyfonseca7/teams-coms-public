import React, { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import CircularIndeterminate from "./CircularIndeterminate";

import { auth, db } from "./components/firebase";
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import EditIcon from "@mui/icons-material/Edit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { useForm, FormProvider } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "./components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const FormSchema = z.object({
  role: z.string({
    required_error: "Selecione uma permissão",
  }),
});

const SelectRoleForm: React.FC<{ userId: string }> = ({ userId }) => {
  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  const { handleSubmit, reset } = methods;

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      // Update user role in Firestore
      const userRef = doc(db, "Users", userId);
      await updateDoc(userRef, {
        role: data.role,
      });

      console.log("User role updated successfully!");

      // Reset form after submission
      reset();
    } catch (error) {
      console.error("Error updating user role: ", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger className="absolute bottom-2 right-2 p-1 m-2">
        <EditIcon sx={{ color: "#23423a" }} />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar permissões</DialogTitle>
          <DialogDescription>
            Selecione uma das opções para atribuir permissões
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="w-2/3 space-y-6">
            <div className="grid gap-4 py-4 w-full">
              <FormField
                control={methods.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione uma permissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="moderator">Moderador</SelectItem>
                        <SelectItem value="worker">Colaborador</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Guardar Alterações</Button>
              </DialogFooter>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

const Team: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Fetch all users from Firestore
        const usersRef = collection(db, "Users");
        const snapshot = await getDocs(usersRef);

        // Fetch current user from Authentication
        const currentUserAuth = auth.currentUser;
        if (currentUserAuth) {
          // Query Firestore to find the user document that matches the current user's UID
          const q = query(usersRef, where("uid", "==", currentUserAuth.uid));
          const querySnapshot = await getDocs(q);

          // Assuming there's only one matching document, set it as the currentUser state
          querySnapshot.forEach((doc) => {
            setCurrentUser({
              id: doc.id,
              ...doc.data(),
            });
          });

          console.log(currentUser);
        }

        const fetchedUsers = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            role: doc.data().role, // Assuming 'role' is a field in your Firestore document
          }))
          .filter((user) => user.id !== currentUserAuth?.uid); // Exclude the current user

        setUsers(fetchedUsers);
      } catch (error) {
        console.error("Error fetching users: ", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <TopBar />
      <div className="w-full flex flex-col items-center justify-center min-h-screen bg-gray-100">
        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {users.map((user) => (
              <div key={user.id} className="w-full">
                <Card className="h-full flex flex-col relative">
                  <CardHeader>
                    <CardTitle>{user.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <Badge
                      variant="outline"
                      className="bg-[#23423a] text-white capitalize p-2"
                    >
                      {user.role ? user.role : "None"}
                    </Badge>

                    {currentUser.role === "admin" ||
                    currentUser.role === "moderator" ? (
                      <SelectRoleForm userId={user.id} />
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <CircularIndeterminate />
        )}
      </div>
    </>
  );
};

export default Team;
