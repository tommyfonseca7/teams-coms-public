import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./components/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import CircularIndeterminate from "./CircularIndeterminate";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  getDownloadURL,
  listAll,
  ref,
  uploadBytes,
  deleteObject,
} from "firebase/storage";
import { v4 } from "uuid";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";

const months = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const getCurrentMonthInPortuguese = (monthIndex: number) => {
  return months[monthIndex];
};

const Horario: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horarioUpload, setHorarioUpload] = useState<File | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [lastUploadedFileRef, setLastUploadedFileRef] = useState<any>(null);
  const [colaborador, setColaborador] = useState<string>("");
  const [mudancas, setMudancas] = useState<string>("");
  const [changes, setChanges] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth()
  );

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

          setLoading(false);
        } else {
          console.log("User is not logged in");
          setLoading(false);
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

      setLoading(false);
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Fetch the latest horario based on the selected year and month
    const fetchLatestHorario = () => {
      const horarioListRef = ref(
        storage,
        `horario/${selectedYear}/${selectedMonth}/`
      );
      listAll(horarioListRef).then((response) => {
        if (response.items.length > 0) {
          const lastItem = response.items[response.items.length - 1];
          getDownloadURL(lastItem).then((url) => {
            setLastUploadedUrl(url);
            setLastUploadedFileRef(lastItem);
          });
        } else {
          setLastUploadedUrl(null);
          setLastUploadedFileRef(null);
        }
      });
    };

    fetchLatestHorario();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    // Fetch changes from Firestore
    const fetchChanges = () => {
      const changesRef = collection(db, "Changes");
      const unsubscribe = onSnapshot(changesRef, (snapshot) => {
        const changesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChanges(changesData);
      });

      return unsubscribe;
    };

    const unsubscribeChanges = fetchChanges();

    return () => {
      unsubscribeChanges(); // Unsubscribe from Firestore listener on component unmount
    };
  }, []);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      // Validate data (if necessary)
      if (!currentUser || !colaborador || !mudancas) {
        console.error("Required fields are missing.");
        return;
      }

      // Save data to Firestore
      const newChangeDoc = await addDoc(collection(db, "Changes"), {
        userName: currentUser.name,
        colaborador: colaborador,
        mudancas: mudancas,
        timestamp: new Date(),
      });

      console.log("Change document added with ID: ", newChangeDoc.id);

      // Increment numberOfChanges for all users
      const usersRef = collection(db, "Users");
      const querySnapshot = await getDocs(usersRef);

      const incrementPromises = querySnapshot.docs.map(async (userDoc) => {
        const userRef = userDoc.ref;
        const userData = userDoc.data();
        const newNumberOfChanges = (userData.numberOfChanges || 0) + 1;
        await updateDoc(userRef, { numberOfChanges: newNumberOfChanges });
      });

      await Promise.all(incrementPromises);

      // Clear form fields after submission
      setColaborador("");
      setMudancas("");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const uploadHorario = () => {
    if (!horarioUpload) {
      return;
    }
    const horarioRef = ref(
      storage,
      `horario/${selectedYear}/${selectedMonth}/${horarioUpload.name + v4()}`
    );
    uploadBytes(horarioRef, horarioUpload).then(() => {
      alert("File uploaded successfully");
      getDownloadURL(horarioRef).then((url) => {
        setLastUploadedUrl(url); // Update last uploaded URL after upload
        setLastUploadedFileRef(horarioRef);
      });
    });
  };

  const deleteHorario = async () => {
    if (!lastUploadedFileRef) return;

    try {
      await deleteObject(lastUploadedFileRef);
      setLastUploadedUrl(null);
      setLastUploadedFileRef(null);
      alert("Horário deleted successfully");
    } catch (error) {
      console.error("Error deleting horário: ", error);
    }
  };

  const deleteChange = async (changeId: string) => {
    try {
      await deleteDoc(doc(db, "Changes", changeId));
      alert("Change deleted successfully");
    } catch (error) {
      console.error("Error deleting change: ", error);
    }
  };

  if (loading) {
    return <CircularIndeterminate />;
  }

  return (
    <>
      <TopBar />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-20">
        <div className="w-full flex justify-center p-5">
          <div className="flex flex-col items-center justify-between">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="col-span-4"
              />
              <Label htmlFor="month">Mês</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="col-span-4 bg-white p-1"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              {currentUser &&
                (currentUser.role === "admin" ||
                  currentUser.role === "moderator") && (
                  <>
                    <Label htmlFor="horarioUpload">Horário</Label>
                    <Input
                      id="horarioUpload"
                      type="file"
                      placeholder="Selecione um ficheiro"
                      onChange={(event) => {
                        if (event.target.files?.length) {
                          setHorarioUpload(event.target.files[0]);
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      className="flex items-center text-[#23423a] border-[#23423a] mx-3 mt-5"
                      onClick={uploadHorario}
                    >
                      Enviar
                    </Button>
                    {lastUploadedUrl && (
                      <Button
                        variant="outline"
                        className="flex items-center text-red-500 border-red-500 mx-3 mt-5"
                        onClick={deleteHorario}
                      >
                        Apagar Horário
                        <DeleteIcon
                          sx={{ color: "red", marginLeft: "0.5rem" }}
                        />
                      </Button>
                    )}
                  </>
                )}
            </div>
          </div>
        </div>
        <div className="w-full flex justify-center m-5">
          <Card className="w-full max-w-4xl p-5 mx-4">
            <CardHeader>
              <CardTitle className="mb-2">
                Horário de {getCurrentMonthInPortuguese(selectedMonth)}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {lastUploadedUrl ? (
                <a
                  href={lastUploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="flex items-center text-[#23423a] border-[#23423a]"
                  >
                    <span className="ml-2">Download PDF</span>
                    <DownloadIcon
                      sx={{ color: "#23423a", marginLeft: "0.5rem" }}
                    />
                  </Button>
                </a>
              ) : (
                <p>Ainda não existe um horário.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                Anotar mudança horário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Mudança no Horário</DialogTitle>
                <DialogDescription>
                  Seleciona o colaborador com quem vais trocar e explica as
                  mudanças
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleFormSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Colaborador
                    </Label>
                    <Input
                      id="name"
                      value={colaborador}
                      onChange={(e) => setColaborador(e.target.value)}
                      className="col-span-4"
                      placeholder="Colaborador para trocar"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="changes" className="text-right">
                      Mudanças
                    </Label>
                    <Input
                      id="changes"
                      type="text"
                      value={mudancas}
                      onChange={(e) => setMudancas(e.target.value)}
                      placeholder="Descreve as mudanças aqui"
                      className="col-span-5 px-3 py-2 border rounded-lg resize-y"
                      style={{ minHeight: "70px" }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="w-full flex flex-col justify-center m-5">
          {changes.length > 0 ? (
            changes.map((change) => (
              <Card key={change.id} className="max-w-4xl p-5 mx-3 mb-4">
                <CardHeader>
                  <CardTitle className="mb-2">
                    Mudança de {change.userName || "Unknown User"} com{" "}
                    {" " + change.colaborador}
                  </CardTitle>
                  <p className="text-gray-500 text-sm">
                    {change.timestamp?.toDate().toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                  <p>{change.mudancas}</p>
                  {currentUser &&
                    (currentUser.role === "admin" ||
                      currentUser.role === "moderator") && (
                      <Button
                        variant="outline"
                        className="flex items-center text-red-500 border-red-500"
                        onClick={() => deleteChange(change.id)}
                      >
                        Apagar
                        <DeleteIcon
                          sx={{ color: "red", marginLeft: "0.5rem" }}
                        />
                      </Button>
                    )}
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center">Sem mudanças registradas.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Horario;
