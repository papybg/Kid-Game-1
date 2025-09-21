import { useState } from "react";import { useState, useRef } from "react";import { useState, useRef } from "react";import { useState, useRef } from "react";

import { Button } from "../ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";import { Button } from "../ui/button";



interface AddItemFormProps {import { Input } from "../ui/input";import { Button } from "../ui/button";import { Button } from "@/components/ui/button";

  onSuccess?: () => void;

}import { Label } from "../ui/label";



export default function AddItemForm({ onSuccess }: AddItemFormProps) {import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";import { Input } from "../ui/input";import { Input } from "@/components/ui/input";

  const [isSubmitting, setIsSubmitting] = useState(false);

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();import { Alert, AlertDescription } from "../ui/alert";import { Label } from "../ui/label";import { Label } from "@/components/ui/label";

    setIsSubmitting(true);

    import { Loader2, Upload, X } from "lucide-react";

    // TODO: Implement form submission

    setTimeout(() => {import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

      setIsSubmitting(false);

      onSuccess?.();interface AddItemFormProps {

    }, 1000);

  };  onSuccess?: () => void;import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";



  return (}

    <Card>

      <CardHeader>import { Alert, AlertDescription } from "../ui/alert";import { Alert, AlertDescription } from "@/components/ui/alert";

        <CardTitle>Добавяне на нов предмет</CardTitle>

      </CardHeader>export default function AddItemForm({ onSuccess }: AddItemFormProps) {

      <CardContent>

        <form onSubmit={handleSubmit} className="space-y-4">  const [isSubmitting, setIsSubmitting] = useState(false);import { Loader2, Upload, X } from "lucide-react";import { Loader2, Upload, X } from "lucide-react";

          <div>

            <label htmlFor="name" className="block text-sm font-medium mb-1">  const [error, setError] = useState<string | null>(null);

              Име на предмета

            </label>  const [success, setSuccess] = useState(false);

            <input

              id="name"

              type="text"

              className="w-full px-3 py-2 border border-gray-300 rounded-md"  // Form datainterface AddItemFormProps {interface AddItemFormProps {

              placeholder="напр. Котка, Влак, Кокошка"

              required  const [formData, setFormData] = useState({

            />

          </div>    name: "",  onSuccess?: () => void;  onSuccess?: () => void;



          <div>    index: "",

            <label htmlFor="index" className="block text-sm font-medium mb-1">

              Индекс (буква)    category: "",}}

            </label>

            <input  });

              id="index"

              type="text"

              maxLength={1}

              className="w-full px-3 py-2 border border-gray-300 rounded-md"  // File states

              placeholder="напр. к, в, с"

              required  const [imageFile, setImageFile] = useState<File | null>(null);export default function AddItemForm({ onSuccess }: AddItemFormProps) {export default function AddItemForm({ onSuccess }: AddItemFormProps) {

            />

          </div>  const [audioFile, setAudioFile] = useState<File | null>(null);



          <Button  const [imagePreview, setImagePreview] = useState<string | null>(null);  const [isSubmitting, setIsSubmitting] = useState(false);  const [isSubmitting, setIsSubmitting] = useState(false);

            type="submit"

            disabled={isSubmitting}

            className="w-full"

          >  // File refs  const [error, setError] = useState<string | null>(null);  const [error, setError] = useState<string | null>(null);

            {isSubmitting ? "Добавяне..." : "Добави предмет"}

          </Button>  const imageInputRef = useRef<HTMLInputElement>(null);

        </form>

      </CardContent>  const audioInputRef = useRef<HTMLInputElement>(null);  const [success, setSuccess] = useState(false);  const [success, setSuccess] = useState(false);

    </Card>

  );

}
  const handleInputChange = (field: string, value: string) => {

    setFormData(prev => ({ ...prev, [field]: value }));

  };  // Form data  // Form data



  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {  const [formData, setFormData] = useState({  const [formData, setFormData] = useState({

    const file = e.target.files?.[0];

    console.log('Image file selected:', file);    name: "",    name: "",

    if (file) {

      setImageFile(file);    index: "",    index: "",

      // Create preview

      const reader = new FileReader();    category: "",    category: "",

      reader.onload = (e) => {

        setImagePreview(e.target?.result as string);  });  });

      };

      reader.readAsDataURL(file);

    }

  };  // File states  // File states



  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {  const [imageFile, setImageFile] = useState<File | null>(null);  const [imageFile, setImageFile] = useState<File | null>(null);

    const file = e.target.files?.[0];

    console.log('Audio file selected:', file);  const [audioFile, setAudioFile] = useState<File | null>(null);  const [audioFile, setAudioFile] = useState<File | null>(null);

    if (file) {

      setAudioFile(file);  const [imagePreview, setImagePreview] = useState<string | null>(null);  const [imagePreview, setImagePreview] = useState<string | null>(null);

    }

  };



  const removeImage = () => {  // File refs  // File refs

    setImageFile(null);

    setImagePreview(null);  const imageInputRef = useRef<HTMLInputElement>(null);  const imageInputRef = useRef<HTMLInputElement>(null);

  };

  const audioInputRef = useRef<HTMLInputElement>(null);  const audioInputRef = useRef<HTMLInputElement>(null);

  const removeAudio = () => {

    setAudioFile(null);

  };

  const handleInputChange = (field: string, value: string) => {  const handleInputChange = (field: string, value: string) => {

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();    setFormData(prev => ({ ...prev, [field]: value }));    setFormData(prev => ({ ...prev, [field]: value }));

    setIsSubmitting(true);

    setError(null);  };  };

    setSuccess(false);



    try {

      // Validate required fields  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {

      if (!formData.name.trim()) {

        throw new Error("Името е задължително");    const file = e.target.files?.[0];    const file = e.target.files?.[0];

      }

      if (!formData.index.trim()) {    console.log('Image file selected:', file);    console.log('Image file selected:', file);

        throw new Error("Индексът е задължителен");

      }    if (file) {    if (file) {

      if (!imageFile) {

        throw new Error("Изображението е задължително");      setImageFile(file);      setImageFile(file);

      }

      // Create preview      // Create preview

      // Create FormData for multipart upload

      const submitData = new FormData();      const reader = new FileReader();      const reader = new FileReader();

      submitData.append("name", formData.name.trim());

      submitData.append("index", formData.index.trim());      reader.onload = (e) => {      reader.onload = (e) => {

      if (formData.category.trim()) {

        submitData.append("category", formData.category.trim());        setImagePreview(e.target?.result as string);        setImagePreview(e.target?.result as string);

      }

      submitData.append("image", imageFile);      };      };

      if (audioFile) {

        submitData.append("audio", audioFile);      reader.readAsDataURL(file);      reader.readAsDataURL(file);

      }

    }    }

      console.log('Submitting form data:', {

        name: formData.name.trim(),  };  };

        index: formData.index.trim(),

        category: formData.category.trim(),

        imageFile: imageFile.name,

        audioFile: audioFile?.name  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {

      });

    const file = e.target.files?.[0];    const file = e.target.files?.[0];

      // Submit to API

      const response = await fetch("/api/game-items", {    console.log('Audio file selected:', file);    console.log('Audio file selected:', file);

        method: "POST",

        body: submitData,    if (file) {    if (file) {

      });

      setAudioFile(file);      setAudioFile(file);

      if (!response.ok) {

        const errorData = await response.json();    }    }

        throw new Error(errorData.message || "Грешка при създаване на предмет");

      }  };  };



      const newItem = await response.json();

      setSuccess(true);

  const removeImage = () => {  const removeImage = () => {

      // Reset form

      setFormData({ name: "", index: "", category: "" });    setImageFile(null);    setImageFile(null);

      setImageFile(null);

      setAudioFile(null);    setImagePreview(null);    setImagePreview(null);

      setImagePreview(null);

  };  };

      // Call success callback

      onSuccess?.();



    } catch (err) {  const removeAudio = () => {  const removeAudio = () => {

      setError(err instanceof Error ? err.message : "Неочаквана грешка");

    } finally {    setAudioFile(null);    setAudioFile(null);

      setIsSubmitting(false);

    }  };  };

  };



  return (

    <Card>  const handleSubmit = async (e: React.FormEvent) => {  const handleSubmit = async (e: React.FormEvent) => {

      <CardHeader>

        <CardTitle className="flex items-center gap-2">    e.preventDefault();    e.preventDefault();

          <Upload className="h-5 w-5" />

          Добавяне на нов предмет    setIsSubmitting(true);    setIsSubmitting(true);

        </CardTitle>

        <CardDescription>    setError(null);    setError(null);

          Добавете нов предмет към играта с изображение и опционално аудио файл

        </CardDescription>    setSuccess(false);    setSuccess(false);

      </CardHeader>

      <CardContent>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Name field */}    try {    try {

          <div className="space-y-2">

            <Label htmlFor="name">Име на предмета *</Label>      // Validate required fields      // Validate required fields

            <Input

              id="name"      if (!formData.name.trim()) {      if (!formData.name.trim()) {

              type="text"

              placeholder="напр. Котка, Влак, Кокошка"        throw new Error("Името е задължително");        throw new Error("Името е задължително");

              value={formData.name}

              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}      }      }

              required

            />      if (!formData.index.trim()) {      if (!formData.index.trim()) {

          </div>

        throw new Error("Индексът е задължителен");        throw new Error("Индексът е задължителен");

          {/* Index field */}

          <div className="space-y-2">      }      }

            <Label htmlFor="index">Индекс (буква) *</Label>

            <Input      if (!imageFile) {      if (!imageFile) {

              id="index"

              type="text"        throw new Error("Изображението е задължително");        throw new Error("Изображението е задължително");

              placeholder="напр. к, в, с"

              value={formData.index}      }      }

              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("index", e.target.value)}

              maxLength={1}

              required

            />      // Create FormData for multipart upload      // Create FormData for multipart upload

            <p className="text-sm text-gray-500">

              Една буква, която определя позицията на предмета в играта      const submitData = new FormData();      const submitData = new FormData();

            </p>

          </div>      submitData.append("name", formData.name.trim());      submitData.append("name", formData.name.trim());



          {/* Category field */}      submitData.append("index", formData.index.trim());      submitData.append("index", formData.index.trim());

          <div className="space-y-2">

            <Label htmlFor="category">Категория</Label>      if (formData.category.trim()) {      if (formData.category.trim()) {

            <Select value={formData.category} onValueChange={(value: string) => handleInputChange("category", value)}>

              <SelectTrigger>        submitData.append("category", formData.category.trim());        submitData.append("category", formData.category.trim());

                <SelectValue placeholder="Изберете категория" />

              </SelectTrigger>      }      }

              <SelectContent>

                <SelectItem value="домашни">Домашни животни</SelectItem>      submitData.append("image", imageFile);      submitData.append("image", imageFile);

                <SelectItem value="селскостопански">Селскостопански животни</SelectItem>

                <SelectItem value="транспорт">Транспорт</SelectItem>      if (audioFile) {      if (audioFile) {

                <SelectItem value="птици">Птици</SelectItem>

                <SelectItem value="други">Други</SelectItem>        submitData.append("audio", audioFile);        submitData.append("audio", audioFile);

              </SelectContent>

            </Select>      }      }

          </div>



          {/* Image upload */}

          <div className="space-y-2">      console.log('Submitting form data:', {      console.log('Submitting form data:', {

            <Label>Изображение *</Label>

            {!imageFile ? (        name: formData.name.trim(),        name: formData.name.trim(),

              <div

                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"        index: formData.index.trim(),        index: formData.index.trim(),

                onClick={() => {

                  console.log('Image upload area clicked');        category: formData.category.trim(),        category: formData.category.trim(),

                  imageInputRef.current?.click();

                }}        imageFile: imageFile.name,        imageFile: imageFile.name,

              >

                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />        audioFile: audioFile?.name        audioFile: audioFile?.name

                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете изображение</p>

                <input      });      });

                  ref={imageInputRef}

                  type="file"

                  accept="image/*"

                  onChange={handleImageChange}      // Submit to API      // Submit to API

                  className="hidden"

                  id="image-upload"      const response = await fetch("/api/game-items", {      const response = await fetch("/api/game-items", {

                />

                <Button type="button" variant="outline" size="sm">        method: "POST",        method: "POST",

                  Избери файл

                </Button>        body: submitData,        body: submitData,

              </div>

            ) : (      });      });

              <div className="relative">

                <div className="border rounded-lg p-4 bg-gray-50">

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-sm font-medium">{imageFile.name}</span>      if (!response.ok) {      if (!response.ok) {

                    <Button

                      type="button"        const errorData = await response.json();        const errorData = await response.json();

                      variant="ghost"

                      size="sm"        throw new Error(errorData.message || "Грешка при създаване на предмет");        throw new Error(errorData.message || "Грешка при създаване на предмет");

                      onClick={removeImage}

                      className="h-6 w-6 p-0"      }      }

                    >

                      <X className="h-4 w-4" />

                    </Button>

                  </div>      const newItem = await response.json();      const newItem = await response.json();

                  {imagePreview && (

                    <img      setSuccess(true);      setSuccess(true);

                      src={imagePreview}

                      alt="Preview"

                      className="w-full h-32 object-contain rounded border"

                    />      // Reset form      // Reset form

                  )}

                </div>      setFormData({ name: "", index: "", category: "" });      setFormData({ name: "", index: "", category: "" });

              </div>

            )}      setImageFile(null);      setImageFile(null);

          </div>

      setAudioFile(null);      setAudioFile(null);

          {/* Audio upload */}

          <div className="space-y-2">      setImagePreview(null);      setImagePreview(null);

            <Label>Аудио файл (опционално)</Label>

            {!audioFile ? (

              <div

                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"      // Call success callback      // Call success callback

                onClick={() => {

                  console.log('Audio upload area clicked');      onSuccess?.();      onSuccess?.();

                  audioInputRef.current?.click();

                }}

              >

                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />    } catch (err) {    } catch (err) {

                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете аудио файл</p>

                <input      setError(err instanceof Error ? err.message : "Неочаквана грешка");      setError(err instanceof Error ? err.message : "Неочаквана грешка");

                  ref={audioInputRef}

                  type="file"    } finally {    } finally {

                  accept="audio/*"

                  onChange={handleAudioChange}      setIsSubmitting(false);      setIsSubmitting(false);

                  className="hidden"

                  id="audio-upload"    }    }

                />

                <Button type="button" variant="outline" size="sm">  };  };

                  Избери файл

                </Button>

              </div>

            ) : (  return (  return (

              <div className="border rounded-lg p-4 bg-gray-50">

                <div className="flex items-center justify-between">    <Card>    <Card>

                  <span className="text-sm font-medium">{audioFile.name}</span>

                  <Button      <CardHeader>      <CardHeader>

                    type="button"

                    variant="ghost"        <CardTitle className="flex items-center gap-2">        <CardTitle className="flex items-center gap-2">

                    size="sm"

                    onClick={removeAudio}          <Upload className="h-5 w-5" />          <Upload className="h-5 w-5" />

                    className="h-6 w-6 p-0"

                  >          Добавяне на нов предмет          Добавяне на нов предмет

                    <X className="h-4 w-4" />

                  </Button>        </CardTitle>        </CardTitle>

                </div>

              </div>        <CardDescription>        <CardDescription>

            )}

          </div>          Добавете нов предмет към играта с изображение и опционално аудио файл          Добавете нов предмет към играта с изображение и опционално аудио файл



          {/* Error message */}        </CardDescription>        </CardDescription>

          {error && (

            <Alert variant="destructive">      </CardHeader>      </CardHeader>

              <AlertDescription>{error}</AlertDescription>

            </Alert>      <CardContent>      <CardContent>

          )}

        <form onSubmit={handleSubmit} className="space-y-6">        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Success message */}

          {success && (          {/* Name field */}          {/* Name field */}

            <Alert>

              <AlertDescription className="text-green-600">          <div className="space-y-2">          <div className="space-y-2">

                Предметът беше успешно добавен!

              </AlertDescription>            <Label htmlFor="name">Име на предмета *</Label>            <Label htmlFor="name">Име на предмета *</Label>

            </Alert>

          )}            <Input            <Input



          {/* Submit button */}              id="name"              id="name"

          <Button

            type="submit"              type="text"              type="text"

            disabled={isSubmitting}

            className="w-full"              placeholder="напр. Котка, Влак, Кокошка"              placeholder="напр. Котка, Влак, Кокошка"

          >

            {isSubmitting ? (              value={formData.name}              value={formData.name}

              <>

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("name", e.target.value)}              onChange={(e) => handleInputChange("name", e.target.value)}

                Добавяне...

              </>              required              required

            ) : (

              "Добави предмет"            />            />

            )}

          </Button>          </div>          </div>

        </form>

      </CardContent>

    </Card>

  );          {/* Index field */}          {/* Index field */}

}
          <div className="space-y-2">          <div className="space-y-2">

            <Label htmlFor="index">Индекс (буква) *</Label>            <Label htmlFor="index">Индекс (буква) *</Label>

            <Input            <Input

              id="index"              id="index"

              type="text"              type="text"

              placeholder="напр. к, в, с"              placeholder="напр. к, в, с"

              value={formData.index}              value={formData.index}

              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange("index", e.target.value)}              onChange={(e) => handleInputChange("index", e.target.value)}

              maxLength={1}              maxLength={1}

              required              required

            />            />

            <p className="text-sm text-gray-500">            <p className="text-sm text-gray-500">

              Една буква, която определя позицията на предмета в играта              Една буква, която определя позицията на предмета в играта

            </p>            </p>

          </div>          </div>



          {/* Category field */}          {/* Category field */}

          <div className="space-y-2">          <div className="space-y-2">

            <Label htmlFor="category">Категория</Label>            <Label htmlFor="category">Категория</Label>

            <Select value={formData.category} onValueChange={(value: string) => handleInputChange("category", value)}>            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>

              <SelectTrigger>              <SelectTrigger>

                <SelectValue placeholder="Изберете категория" />                <SelectValue placeholder="Изберете категория" />

              </SelectTrigger>              </SelectTrigger>

              <SelectContent>              <SelectContent>

                <SelectItem value="домашни">Домашни животни</SelectItem>                <SelectItem value="домашни">Домашни животни</SelectItem>

                <SelectItem value="селскостопански">Селскостопански животни</SelectItem>                <SelectItem value="селскостопански">Селскостопански животни</SelectItem>

                <SelectItem value="транспорт">Транспорт</SelectItem>                <SelectItem value="транспорт">Транспорт</SelectItem>

                <SelectItem value="птици">Птици</SelectItem>                <SelectItem value="птици">Птици</SelectItem>

                <SelectItem value="други">Други</SelectItem>                <SelectItem value="други">Други</SelectItem>

              </SelectContent>              </SelectContent>

            </Select>            </Select>

          </div>          </div>



          {/* Image upload */}          {/* Image upload */}

          <div className="space-y-2">          <div className="space-y-2">

            <Label>Изображение *</Label>            <Label>Изображение *</Label>

            {!imageFile ? (            {!imageFile ? (

              <div              <div

                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"

                onClick={() => {                onClick={() => {

                  console.log('Image upload area clicked');                  console.log('Image upload area clicked');

                  imageInputRef.current?.click();                  imageInputRef.current?.click();

                }}                }}

              >              >

                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />

                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете изображение</p>                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете изображение</p>

                <input                <input

                  ref={imageInputRef}                  ref={imageInputRef}

                  type="file"                  type="file"

                  accept="image/*"                  accept="image/*"

                  onChange={handleImageChange}                  onChange={handleImageChange}

                  className="hidden"                  className="hidden"

                  id="image-upload"                  id="image-upload"

                />                />

                <Button type="button" variant="outline" size="sm">                <Button type="button" variant="outline" size="sm">

                  Избери файл                  Избери файл

                </Button>                </Button>

              </div>              </div>

            ) : (            ) : (

              <div className="relative">              <div className="relative">

                <div className="border rounded-lg p-4 bg-gray-50">                <div className="border rounded-lg p-4 bg-gray-50">

                  <div className="flex items-center justify-between mb-2">                  <div className="flex items-center justify-between mb-2">

                    <span className="text-sm font-medium">{imageFile.name}</span>                    <span className="text-sm font-medium">{imageFile.name}</span>

                    <Button                    <Button

                      type="button"                      type="button"

                      variant="ghost"                      variant="ghost"

                      size="sm"                      size="sm"

                      onClick={removeImage}                      onClick={removeImage}

                      className="h-6 w-6 p-0"                      className="h-6 w-6 p-0"

                    >                    >

                      <X className="h-4 w-4" />                      <X className="h-4 w-4" />

                    </Button>                    </Button>

                  </div>                  </div>

                  {imagePreview && (                  {imagePreview && (

                    <img                    <img

                      src={imagePreview}                      src={imagePreview}

                      alt="Preview"                      alt="Preview"

                      className="w-full h-32 object-contain rounded border"                      className="w-full h-32 object-contain rounded border"

                    />                    />

                  )}                  )}

                </div>                </div>

              </div>              </div>

            )}            )}

          </div>          </div>



          {/* Audio upload */}          {/* Audio upload */}

          <div className="space-y-2">          <div className="space-y-2">

            <Label>Аудио файл (опционално)</Label>            <Label>Аудио файл (опционално)</Label>

            {!audioFile ? (            {!audioFile ? (

              <div              <div

                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors"

                onClick={() => {                onClick={() => {

                  console.log('Audio upload area clicked');                  console.log('Audio upload area clicked');

                  audioInputRef.current?.click();                  audioInputRef.current?.click();

                }}                }}

              >              >

                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />

                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете аудио файл</p>                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете аудио файл</p>

                <input                <input

                  ref={audioInputRef}                  ref={audioInputRef}

                  type="file"                  type="file"

                  accept="audio/*"                  accept="audio/*"

                  onChange={handleAudioChange}                  onChange={handleAudioChange}

                  className="hidden"                  className="hidden"

                  id="audio-upload"                  id="audio-upload"

                />                />

                <Button type="button" variant="outline" size="sm">                <Button type="button" variant="outline" size="sm">

                  Избери файл                  Избери файл

                </Button>                </Button>

              </div>              </div>

            ) : (            ) : (

              <div className="border rounded-lg p-4 bg-gray-50">              <div className="border rounded-lg p-4 bg-gray-50">

                <div className="flex items-center justify-between">                <div className="flex items-center justify-between">

                  <span className="text-sm font-medium">{audioFile.name}</span>                  <span className="text-sm font-medium">{audioFile.name}</span>

                  <Button                  <Button

                    type="button"                    type="button"

                    variant="ghost"                    variant="ghost"

                    size="sm"                    size="sm"

                    onClick={removeAudio}                    onClick={removeAudio}

                    className="h-6 w-6 p-0"                    className="h-6 w-6 p-0"

                  >                  >

                    <X className="h-4 w-4" />                    <X className="h-4 w-4" />

                  </Button>                  </Button>

                </div>                </div>

              </div>              </div>

            )}            )}

          </div>          </div>



          {/* Error message */}          {/* Error message */}

          {error && (          {error && (

            <Alert variant="destructive">            <Alert variant="destructive">

              <AlertDescription>{error}</AlertDescription>              <AlertDescription>{error}</AlertDescription>

            </Alert>            </Alert>

          )}          )}



          {/* Success message */}          {/* Success message */}

          {success && (          {success && (

            <Alert>            <Alert>

              <AlertDescription className="text-green-600">              <AlertDescription className="text-green-600">

                Предметът беше успешно добавен!                Предметът беше успешно добавен!

              </AlertDescription>              </AlertDescription>

            </Alert>            </Alert>

          )}          )}



          {/* Submit button */}          {/* Submit button */}

          <Button          <Button

            type="submit"            type="submit"

            disabled={isSubmitting}            disabled={isSubmitting}

            className="w-full"            className="w-full"

          >          >

            {isSubmitting ? (            {isSubmitting ? (

              <>              <>

                <Loader2 className="mr-2 h-4 w-4 animate-spin" />                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                Добавяне...                Добавяне...

              </>              </>

            ) : (            ) : (

              "Добави предмет"              "Добави предмет"

            )}            )}

          </Button>          </Button>

        </form>        </form>

      </CardContent>      </CardContent>

    </Card>    </Card>

  );  );

}}