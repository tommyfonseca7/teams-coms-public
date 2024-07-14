"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import logo from "./assets/aroeira_logo.png";
import { Button } from "./components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./components/ui/form";
import { Input } from "./components/ui/input";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "./components/firebase";

const FormSchema = z.object({
  nome: z
    .string()
    .min(1, "Nome é necessário")
    .max(35, "Apenas primeiro e último nome necessário"),
  email: z.string().min(1, "Email é necessário").email("Email inválido"),
  password: z
    .string()
    .min(1, "Password é necessário")
    .min(8, "Password têm de ter mais de 8 caracteres"),
  password2: z
    .string()
    .min(1, "Password é necessário")
    .min(8, "Password têm de ter mais de 8 caracteres"),
});

function Register() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log(data);
    if (data.password != data.password2) {
      console.log("pass diferentes");
      alert("Passwords diferentes, tenta outra vez");
    } else {
      try {
        await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, "Users", user.uid), {
            email: user.email,
            name: data.nome,
            uid: user.uid,
            role: "admin",
          });
        }
        console.log("User Registered Successfully!!");
        window.location.href = "/home";
      } catch (error) {
        console.log(error);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 w-full">
      <img src={logo} alt="Logo" className="mb-20 w-32 h-32" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite a password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar a Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Digite a password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button className="mt-6 w-full bg-[#23423a]" type="submit">
            Registrar
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default Register;
