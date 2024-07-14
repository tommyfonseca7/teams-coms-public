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
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./components/firebase";

const FormSchema = z.object({
  email: z.string().min(1, "Email é necessário").email("Email inválido"),
  password: z
    .string()
    .min(1, "Password é necessário")
    .min(8, "Password têm de ter mais de 8 caracteres"),
});

function LogIn() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const handleSubmit = async (data: z.infer<typeof FormSchema>) => {
    console.log(data);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("User logged in Successfully");
      window.location.href = "/home";
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <img src={logo} alt="Logo" className="mb-20 w-32 h-32" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-2">
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
          </div>

          <Button className="mt-6 w-full bg-[#23423a]" type="submit">
            Log In
          </Button>
          <div className="mx-auto my-4 flex w-full items-center justify-evenly before:mr-4 before:block before:h-px before:flex-grow before:bg-stone-400 after:ml-4 after:block after:h-px after:flex-grow after:bg-stone-400">
            ou
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Se ainda não têm conta,&nbsp;
            <Link className="text-[#23423a] hover:underline" to={"/sign-up"}>
              Registrar
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}

export default LogIn;
