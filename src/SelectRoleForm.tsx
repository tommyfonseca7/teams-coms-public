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
import { useForm, FormProvider } from "react-hook-form"; // Import FormProvider for nested forms
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "./components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./components/ui/button";

const FormSchema = z.object({
  role: z.string({
    required_error: "Selecione uma permissão",
  }),
});

const SelectRoleForm = () => {
  const methods = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const { handleSubmit } = methods;

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    console.log(data); // Replace with your submit logic
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

export default SelectRoleForm;
