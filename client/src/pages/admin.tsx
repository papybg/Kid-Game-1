import { useState, useEffect } from "react";
import { useAdminItems, useDeleteItem } from "../hooks/use-admin-api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import AddItemForm from "../components/admin/AddItemForm";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // API hooks
  const { data: items, isLoading: itemsLoading, error } = useAdminItems();
  const deleteItemMutation = useDeleteItem();

  useEffect(() => {
    const correctPassword = "admin123";
    const enteredPassword = prompt("Моля, въведете парола за достъп:");

    if (enteredPassword === correctPassword) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleDeleteItem = async (id: number, name: string) => {
    if (confirm(`Сигурни ли сте, че искате да изтриете "${name}"?`)) {
      try {
        await deleteItemMutation.mutateAsync(id);
      } catch (error) {
        alert("Грешка при изтриване на обекта!");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-lg">Проверка на достъпа...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Достъпът е отказан</h1>
          <p className="text-gray-600">Нямате права за достъп до админ панела.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Опитай отново
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Админ Панел
          </h1>
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад към играта
          </Button>
        </div>

        {/* Add Item Button */}
        <div className="mb-6">
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4" />
            Добави нов обект
          </Button>
        </div>

        {/* Items List */}
        <Card>
          <CardHeader>
            <CardTitle>Всички обекти в играта</CardTitle>
          </CardHeader>
          <CardContent>
            {itemsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Зареждане на обектите...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                <p>Грешка при зареждане на обектите!</p>
                <p className="text-sm text-gray-500 mt-1">{error.message}</p>
              </div>
            ) : !items?.length ? (
              <div className="text-center py-8 text-gray-500">
                <p>Все още няма добавени обекти.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Item Image */}
                    <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            <div className="text-2xl mb-1">📷</div>
                            <div className="text-xs">Няма снимка</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Индекс: <span className="font-mono bg-gray-100 px-1 rounded">{item.index}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Категория: <span className="text-blue-600">{item.category}</span>
                      </p>
                      <p className="text-xs text-gray-400">
                        ID: {item.id}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-blue-600 hover:text-blue-700"
                        title="Редактирай"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:text-red-700"
                        title="Изтрий"
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        disabled={deleteItemMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Item Form Modal */}
        {showAddForm && (
          <AddItemForm onClose={() => setShowAddForm(false)} />
        )}
      </div>
    </div>
  );
}