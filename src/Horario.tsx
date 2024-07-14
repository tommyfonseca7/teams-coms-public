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
  onSnapshot,
} from "firebase/firestore";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import CircularIndeterminate from "./CircularIndeterminate";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import DownloadIcon from "@mui/icons-material/Download";
import { getDownloadURL, listAll, ref, uploadBytes } from "firebase/storage";
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

const getCurrentMonthInPortuguese = () => {
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
  const currentMonthIndex = new Date().getMonth();
  return months[currentMonthIndex];
};

const Horario: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [horarioUpload, setHorarioUpload] = useState<File | null>(null);
  const [lastUploadedUrl, setLastUploadedUrl] = useState<string | null>(null);
  const [colaborador, setColaborador] = useState<string>("");
  const [mudancas, setMudancas] = useState<string>("");
  const [changes, setChanges] = useState<any[]>([]);

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

    const horarioListRef = ref(storage, "horario/");
    listAll(horarioListRef).then((response) => {
      response.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          setLastUploadedUrl(url); // Set only the last uploaded URL
        });
      });
    });

    fetchUserData();
  }, []);

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
    const horarioRef = ref(storage, `horario/${horarioUpload.name + v4()}`);
    uploadBytes(horarioRef, horarioUpload).then(() => {
      alert("File uploaded successfully");
      getDownloadURL(horarioRef).then((url) => {
        setLastUploadedUrl(url); // Update last uploaded URL after upload
      });
    });
  };

  if (loading) {
    return <CircularIndeterminate />;
  }

  return (
    <>
      <TopBar />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-20">
        <div className="w-full flex justify-center p-5">
          {currentUser &&
          (currentUser.role === "admin" || currentUser.role === "moderator") ? (
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center justify-between">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="horarioUpload">Horario</Label>
                  <Input
                    id="horarioUpload"
                    type="file"
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        setHorarioUpload(event.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="flex items-center text-[#23423a] border-[#23423a] mx-3 mt-5"
                onClick={uploadHorario}
              >
                Enviar
              </Button>
            </div>
          ) : null}
        </div>
        <div className="w-full flex justify-center m-5">
          <Card className="w-full max-w-4xl p-5 mx-4">
            <CardHeader>
              <CardTitle className="mb-2">
                Horário de {getCurrentMonthInPortuguese()}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              {lastUploadedUrl && (
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
                      className="col-span-5 px-3 py-2 border rounded-lg resize-y" // Adjust padding and border as needed
                      style={{ minHeight: "70px" }} // Adjust minimum height as needed
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
                    Mudança de {change.userName || "Unknown User"} com
                    {" " + change.colaborador}{" "}
                  </CardTitle>
                  <p className="text-gray-500 text-sm">
                    {change.timestamp?.toDate().toLocaleDateString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p>{change.mudancas}</p>
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
