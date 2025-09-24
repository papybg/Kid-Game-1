import { useState, useEffect } from "react";
import { useAdminItems, useDeleteItem } from "../hooks/use-admin-api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import AddItemForm from "../components/admin/AddItemForm";
import type { AdminItem } from "../hooks/use-admin-api";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState<AdminItem | null>(null);

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

  const handleEditItem = (item: AdminItem) => {
    setEditItem(item);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditItem(null);
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

        {/* Admin Tabs */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items">Обекти</TabsTrigger>
            <TabsTrigger value="portals">Портали</TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-6">
            {/* Add Item Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-700">Управление на обекти</h2>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Снимка</TableHead>
                          <TableHead>Име</TableHead>
                          <TableHead className="w-20">Индекс</TableHead>
                          <TableHead className="w-24">Категория</TableHead>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead className="w-32">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-gray-400 text-xs">📷</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                {item.index}
                              </span>
                            </TableCell>
                            <TableCell className="text-blue-600">{item.category}</TableCell>
                            <TableCell className="text-sm text-gray-500">{item.id}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-blue-600 hover:text-blue-700"
                                  title="Редактирай"
                                  onClick={() => handleEditItem(item)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-2 text-red-600 hover:text-red-700"
                                  title="Изтрий"
                                  onClick={() => handleDeleteItem(item.id, item.name)}
                                  disabled={deleteItemMutation.isPending}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Portals Tab */}
          <TabsContent value="portals" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-700">Управление на портали</h2>
              <Button 
                className="flex items-center gap-2"
                disabled
              >
                <Plus className="w-4 h-4" />
                Добави нов портал (скоро)
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Всички портали в играта</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Функционалността за управление на портали ще бъде добавена скоро.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Item Form Modal */}
        {showAddForm && (
          <AddItemForm 
            onClose={handleCloseForm} 
            editItem={editItem || undefined} 
          />
        )}
      </div>
    </div>
  );
}