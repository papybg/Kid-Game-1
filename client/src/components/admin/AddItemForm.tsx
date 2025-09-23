import { useState } from "react";
import { useForm } from "react-hook-form";
import { useCreateItem, useAdminCategories, type CreateItemData } from "../../hooks/use-admin-api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { X, Upload, Plus, Volume2 } from "lucide-react";

interface AddItemFormProps {
  onClose: () => void;
}

export default function AddItemForm({ onClose }: AddItemFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableIndexes, setAvailableIndexes] = useState<string[]>([]);
  
  // States за звуковия файл
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  
  const createItemMutation = useCreateItem();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateItemData>();

  const watchedCategory = watch("category");
  const watchedIndex = watch("index");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setValue("image", file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedAudioFile(file);
      setAudioFileName(file.name);
      setValue("audio", file);
    }
  };

  const handleCategoryChange = (category: string) => {
    setValue("category", category);
    setSelectedCategory(category);
    
    // Update available indexes for this category
    if (categories) {
      const categoryIndexes = categories
        .filter(cat => cat.categoryName === category)
        .map(cat => cat.indexValue);
      setAvailableIndexes([...new Set(categoryIndexes)]); // Remove duplicates
    }
    
    // Reset index when category changes
    setValue("index", "");
  };

  const handleIndexChange = (index: string) => {
    setValue("index", index);
  };

  const onSubmit = async (data: CreateItemData) => {
    try {
      await createItemMutation.mutateAsync({
        ...data,
        image: selectedFile || undefined,
        audio: selectedAudioFile || undefined // Добавяме звука
      });
      
      // Reset form and close
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedAudioFile(null);
      setAudioFileName(null);
      onClose();
    } catch (error) {
      console.error("Error creating item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Добави нов обект</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">Име на обекта *</Label>
              <Input
                id="name"
                {...register("name", { 
                  required: "Името е задължително",
                  minLength: { value: 2, message: "Името трябва да е поне 2 символа" }
                })}
                placeholder="напр. Куче"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Category Field - From API */}
            <div className="space-y-2">
              <Label htmlFor="category">Категория *</Label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-gray-600">Зареждане на категориите...</span>
                </div>
              ) : (
                <Select onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Избери категория" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && [...new Set(categories.map(cat => cat.categoryName))].map((categoryName) => (
                      <SelectItem key={categoryName} value={categoryName}>
                        <div className="flex items-center gap-2">
                          <span className="capitalize">{categoryName}</span>
                          <span className="text-xs text-gray-500">
                            ({categories.filter(cat => cat.categoryName === categoryName).length} индекса)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!watchedCategory && (
                <p className="text-sm text-red-600">Категорията е задължителна</p>
              )}
            </div>

            {/* Index Field - Manual Input */}
            <div className="space-y-2">
              <Label htmlFor="index">Индекс * (до 2 символа)</Label>
              <Input
                id="index"
                {...register("index", { 
                  required: "Индексът е задължителен",
                  maxLength: { value: 2, message: "Индексът трябва да е до 2 символа" },
                  pattern: { 
                    value: /^[a-zA-Z0-9]{1,2}$/, 
                    message: "Индексът може да съдържа само букви и цифри" 
                  }
                })}
                placeholder="напр. h, i, ab"
                maxLength={2}
                className="uppercase"
                style={{ textTransform: 'lowercase' }}
              />
              {errors.index && (
                <p className="text-sm text-red-600">{errors.index.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Въведи индекс от 1-2 символа (букви или цифри)
              </p>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image">Снимка</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {previewUrl ? (
                  <div className="space-y-2">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="mx-auto h-20 w-20 object-cover rounded"
                    />
                    <p className="text-sm text-gray-600">{selectedFile?.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setValue("image", undefined);
                      }}
                    >
                      Премахни
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div>
                      <Label
                        htmlFor="image-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        Избери снимка
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG до 5MB
                      </p>
                    </div>
                  </div>
                )}
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Audio Upload */}
            <div className="space-y-2">
              <Label htmlFor="audio">Звук (незадължителен)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {selectedAudioFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Volume2 className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Избран звук</span>
                    </div>
                    <p className="text-sm text-gray-600">{audioFileName}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAudioFile(null);
                        setAudioFileName(null);
                        setValue("audio", undefined);
                      }}
                    >
                      Премахни
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Volume2 className="mx-auto h-8 w-8 text-gray-400" />
                    <div>
                      <Label
                        htmlFor="audio-upload"
                        className="cursor-pointer text-blue-600 hover:text-blue-700"
                      >
                        Избери звуков файл
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        MP3, WAV, OGG до 10MB
                      </p>
                    </div>
                  </div>
                )}
                <Input
                  id="audio-upload"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Отказ
              </Button>
              <Button
                type="submit"
                disabled={createItemMutation.isPending || !watchedCategory}
                className="flex-1"
              >
                {createItemMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Добавяне...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Добави
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}