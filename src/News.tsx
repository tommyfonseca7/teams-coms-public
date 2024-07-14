import React, { useEffect, useState } from "react";
import { auth, db, storage } from "./components/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { Button } from "./components/ui/button";
import TopBar from "./Topbar";
import { Input } from "./components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "./components/ui/form";

const News: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
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
          setLoading(false);
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data: ", error);
        setLoading(false);
      }
    };

    fetchUserData();
    fetchNewsPosts();
  }, []);

  const fetchNewsPosts = async () => {
    try {
      const newsRef = collection(db, "News");
      const querySnapshot = await getDocs(newsRef);
      const news = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNewsPosts(news);
    } catch (error) {
      console.error("Error fetching news posts: ", error);
      alert("There was an error fetching news posts. Please try again later.");
    }
  };

  const FormSchema = z.object({
    title: z
      .string()
      .min(1, "Título necessário")
      .max(100, "Máximo de 100 caracteres"),
    description: z.string().min(1, "Descrição é necessária "),
    image: z.instanceof(FileList).refine((files) => files.length === 1, {
      message: "Imagem é necessária.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setSubmitting(true);
    try {
      const imageFile = data.image[0];
      const storageRef = ref(storage, `images/${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const imageUrl = await getDownloadURL(storageRef);

      // Add news document to Firestore
      const newNewsDoc = await addDoc(collection(db, "News"), {
        title: data.title,
        description: data.description,
        imageUrl,
        createdAt: Timestamp.now(),
        creator: currentUser.name,
        creatorUid: currentUser.uid,
      });

      console.log("News document added with ID: ", newNewsDoc.id);

      // Increment NewsCount for all users
      const usersRef = collection(db, "Users");
      const querySnapshot = await getDocs(usersRef);

      const incrementPromises = querySnapshot.docs.map(async (userDoc) => {
        const userRef = userDoc.ref;
        const userData = userDoc.data();
        const newNewsCount = (userData.NewsCount || 0) + 1;
        await updateDoc(userRef, { NewsCount: newNewsCount });
      });

      await Promise.all(incrementPromises);

      form.reset();
      fetchNewsPosts(); // Refresh the news posts list
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("There was an error adding the news. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNews = async (newsId: string, imageUrl: string) => {
    try {
      // Delete news document from Firestore
      await deleteDoc(doc(db, "News", newsId));
      console.log("News document deleted with ID: ", newsId);

      // Delete image from storage
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log("Image deleted from storage");

      fetchNewsPosts(); // Refresh the news posts list
    } catch (error) {
      console.error("Error deleting document: ", error);
      alert("There was an error deleting the news. Please try again later.");
    }
  };

  return (
    <>
      <TopBar />
      <div className="flex flex-col items-center min-h-screen bg-gray-100 pt-20">
        <div className="w-full flex flex-col items-center p-5 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Notícias</h2>
          {loading ? (
            <p>Loading...</p>
          ) : newsPosts.length > 0 ? (
            newsPosts.map((news) => (
              <div
                key={news.id}
                className="bg-white p-4 rounded shadow mb-4 w-full max-w-md"
              >
                <img
                  src={news.imageUrl}
                  alt={news.title}
                  className="w-full h-auto object-cover mb-4"
                />
                <h3 className="text-lg font-bold">{news.title}</h3>
                <p>{news.description}</p>
                {currentUser &&
                  (currentUser.role === "admin" ||
                    currentUser.role === "moderator") && (
                    <Button
                      onClick={() => handleDeleteNews(news.id, news.imageUrl)}
                      className="mt-2 bg-red-500"
                    >
                      Apagar
                    </Button>
                  )}
              </div>
            ))
          ) : (
            <p>Não há notícias disponiveis.</p>
          )}
        </div>
        <div className="w-full flex justify-center p-5">
          {currentUser &&
            (currentUser.role === "admin" ||
              currentUser.role === "moderator") && (
              <div className="flex flex-col items-center justify-between bg-white p-5 rounded-lg">
                <div className="flex flex-col items-center justify-between">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-8"
                    >
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <div className="flex flex-col">
                            <label className="mb-2">Título da notícia</label>
                            <Input placeholder="Título da notícia" {...field} />
                            {form.formState.errors.title && (
                              <span>{form.formState.errors.title.message}</span>
                            )}
                          </div>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <div className="flex flex-col">
                            <label className="mb-2">Descrição da notícia</label>
                            <textarea
                              className="border rounded p-2 bg-white"
                              placeholder="Descrição da notícia"
                              {...field}
                            />
                            {form.formState.errors.description && (
                              <span>
                                {form.formState.errors.description.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="image"
                        render={({ field }) => (
                          <div className="flex flex-col">
                            <label className="mb-2">Imagem</label>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => field.onChange(e.target.files)}
                              placeholder="Seleciona uma imagem"
                            />
                            {form.formState.errors.image && (
                              <span>{form.formState.errors.image.message}</span>
                            )}
                          </div>
                        )}
                      />
                      <Button type="submit" disabled={submitting}>
                        {submitting ? "A criar..." : "Criar"}
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </>
  );
};

export default News;
