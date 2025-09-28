import { useState } from "react";
import { useAdminCategories, useCreateCategoryIndex } from "../../hooks/use-admin-api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { X, Plus } from "lucide-react";

interface AddIndexFormProps {
  onClose: () => void;
}

export default function AddIndexForm({ onClose }: AddIndexFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [indexValue, setIndexValue] = useState("");
  const [description, setDescription] = useState("");

  const { data: categories, isLoading: categoriesLoading } = useAdminCategories();
  const createCategoryIndexMutation = useCreateCategoryIndex();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || !indexValue.trim()) return;

    try {
      await createCategoryIndexMutation.mutateAsync({
        categoryName: selectedCategory,
        indexValue: indexValue.trim().toLowerCase(),
        description: description.trim() || undefined,
      });

      // Reset form and close
      setSelectedCategory("");
      setIndexValue("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error creating index:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Добави нов индекс</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Field */}
            <div className="space-y-2">
              <Label htmlFor="category">Категория *</Label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 p-2 border rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                  <span className="text-sm text-gray-600">Зареждане на категориите...</span>
                </div>
              ) : (
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
              {!selectedCategory && (
                <p className="text-sm text-red-600">Категорията е задължителна</p>
              )}
            </div>

            {/* Index Value Field */}
            <div className="space-y-2">
              <Label htmlFor="index-value">Индекс *</Label>
              <Input
                id="index-value"
                value={indexValue}
                onChange={(e) => setIndexValue(e.target.value.toLowerCase())}
                placeholder="напр. z"
                maxLength={2}
                autoComplete="off"
              />
              {!indexValue.trim() && (
                <p className="text-sm text-red-600">Индексът е задължителен</p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Описание на индекса (незадължително)"
                autoComplete="off"
              />
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
                disabled={createCategoryIndexMutation.isPending || !selectedCategory || !indexValue.trim()}
                className="flex-1"
              >
                {createCategoryIndexMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Добавяне...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Добави индекс
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