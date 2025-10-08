import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCreateItem, useUpdateItem, useAdminCategories, useCreateCategoryIndex, useAdminIndices, type CreateItemData, type AdminItem } from "../../hooks/use-admin-api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { X, Upload, Plus, Volume2 } from "lucide-react";

interface AddItemFormProps {
  onClose: () => void;
  editItem?: AdminItem;
}

export default function AddItemForm({ onClose, editItem }: AddItemFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [availableIndexes, setAvailableIndexes] = useState<{ indexValue: string; description: string }[]>([]);
  
  // States за новия индекс
  const [isAddingNewIndex, setIsAddingNewIndex] = useState(false);
  const [newIndexValue, setNewIndexValue] = useState("");
  const [newIndexDescription, setNewIndexDescription] = useState("");
  
  // States за звуковия файл
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const { data: indices, isLoading: indicesLoading } = useAdminIndices();
  const createCategoryIndexMutation = useCreateCategoryIndex();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<CreateItemData>();

  // Initialize form with edit item data
  useEffect(() => {
    if (editItem) {
      setValue("name", editItem.name);
      setValue("category", editItem.category);
      setValue("index", editItem.index);
      setSelectedCategory(editItem.category);
      
      // Set preview for existing image
      if (editItem.image) {
        setPreviewUrl(editItem.image);
      }
      
      // Set audio filename if exists
      if (editItem.audio) {
        setAudioFileName(editItem.audio.split('/').pop() || null);
      }
      
      // Update available indexes for the category using aggregated indices (from game_items)
      if (indices) {
        const categoryIndexes = indices
          .filter(idx => Array.isArray(idx.categories) && idx.categories.includes(editItem.category))
          .map(idx => ({ indexValue: idx.index, description: (idx.descriptions && idx.descriptions[0]) || '' }));
        setAvailableIndexes(categoryIndexes);
      } else if (categories) {
        // fallback to old categories source if indices not loaded yet
        const categoryIndexes = categories
          .filter(cat => cat.categoryName === editItem.category)
          .map(cat => ({ indexValue: cat.indexValue, description: cat.description || '' }));
        setAvailableIndexes(categoryIndexes);
      }
    }
  }, [editItem, categories, setValue]);

  const watchedCategory = watch("category");

  const handleCategoryChange = (category: string) => {
    setValue("category", category);
    setSelectedCategory(category);
    
    // Update available indexes for this category using aggregated indices
    if (indices) {
      const categoryIndexes = indices
        .filter(idx => Array.isArray(idx.categories) && idx.categories.includes(category))
        .map(idx => ({ indexValue: idx.index, description: (idx.descriptions && idx.descriptions[0]) || '' }));
      setAvailableIndexes(categoryIndexes);
    } else if (categories) {
      const categoryIndexes = categories
        .filter(cat => cat.categoryName === category)
        .map(cat => ({ indexValue: cat.indexValue, description: cat.description || '' }));
      setAvailableIndexes(categoryIndexes);
    }
    
    // Reset index when category changes
    setValue("index", "");
  };

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

  const handleAddNewIndex = async () => {
    if (!watchedCategory || !newIndexValue.trim()) return;

    try {
      await createCategoryIndexMutation.mutateAsync({
        categoryName: watchedCategory,
        indexValue: newIndexValue.trim(),
        description: newIndexDescription.trim() || undefined,
      });

      // Close the form
      setIsAddingNewIndex(false);
      setNewIndexValue("");
      setNewIndexDescription("");
    } catch (error) {
      console.error("Error adding new index:", error);
    }
  };

  const onSubmit = async (data: CreateItemData) => {
    try {
      if (editItem) {
        // Update existing item
        const audioData = selectedAudioFile ? selectedAudioFile : 
                         (audioFileName ? editItem.audio : null);
        
        await updateItemMutation.mutateAsync({
          id: editItem.id,
          data: {
            ...data,
            image: selectedFile || undefined,
            audio: audioData
          }
        });
      } else {
        // Create new item
        await createItemMutation.mutateAsync({
          ...data,
          image: selectedFile || undefined,
          audio: selectedAudioFile || undefined
        });
      }
      
      // Reset form and close
      reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedAudioFile(null);
      setAudioFileName(null);
      onClose();
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{editItem ? "Редактирай обект" : "Добави нов обект"}</CardTitle>
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
              <Label htmlFor="item-name">Име на обекта *</Label>
              <Input
                id="item-name"
                autoComplete="off"
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
              <Label htmlFor="item-category">Категория *</Label>
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
                        <span className="capitalize">{categoryName}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!watchedCategory && (
                <p className="text-sm text-red-600">Категорията е задължителна</p>
              )}
            </div>

            {/* Index Field - Select from existing or add new */}
            <div className="space-y-2">
              <Label htmlFor="item-index">Индекс *</Label>
              <div className="flex gap-2">
                <Select onValueChange={(value) => setValue("index", value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Избери индекс" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIndexes.map((idx, i) => (
                      <SelectItem key={selectedCategory + '-' + idx.indexValue + '-' + i} value={idx.indexValue}>
                        {idx.indexValue} {idx.description && `(${idx.description})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setIsAddingNewIndex(true)}
                  title={watchedCategory ? "Добави нов индекс" : "Първо изберете категория"}
                  disabled={!watchedCategory}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {!watch("index") && !isAddingNewIndex && (
                <p className="text-sm text-red-600">Индексът е задължителен</p>
              )}
            </div>

            {/* Add New Index Fields */}
            {isAddingNewIndex && (
              <div className="space-y-2 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium">Добави нов индекс за категория "{watchedCategory}"</h4>
                {!watchedCategory && (
                  <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    ⚠️ Първо трябва да изберете категория за да можете да добавите индекс
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="item-new-index">Индекс *</Label>
                    <Input
                      id="item-new-index"
                      autoComplete="off"
                      value={newIndexValue}
                      onChange={(e) => setNewIndexValue(e.target.value.toLowerCase())}
                      placeholder="напр. z"
                      maxLength={2}
                      disabled={!watchedCategory}
                    />
                  </div>
                  <div>
                    <Label htmlFor="item-new-description">Описание</Label>
                    <Input
                      id="item-new-description"
                      autoComplete="off"
                      value={newIndexDescription}
                      onChange={(e) => setNewIndexDescription(e.target.value)}
                      placeholder="Описание на индекса"
                      disabled={!watchedCategory}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddNewIndex}
                    disabled={!newIndexValue.trim() || createCategoryIndexMutation.isPending || !watchedCategory}
                  >
                    {createCategoryIndexMutation.isPending ? "Добавяне..." : "Добави индекс"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewIndex(false);
                      setNewIndexValue("");
                      setNewIndexDescription("");
                    }}
                  >
                    Отказ
                  </Button>
                </div>
              </div>
            )}

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
                {selectedAudioFile || audioFileName ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Volume2 className="h-6 w-6 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        {selectedAudioFile ? "Избран звук" : "Съществуващ звук"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {selectedAudioFile ? audioFileName : audioFileName}
                    </p>
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
                disabled={(createItemMutation.isPending || updateItemMutation.isPending) || !watchedCategory}
                className="flex-1"
              >
                {(createItemMutation.isPending || updateItemMutation.isPending) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editItem ? "Запазване..." : "Добавяне..."}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editItem ? "Запази" : "Добави"}
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