import { useState, useEffect } from "react";
import { useAdminItems, useDeleteItem, useAdminPortals, useAdminIndices, useDeleteIndices, type IndexInfo } from "../hooks/use-admin-api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Trash2, Edit, Plus, ArrowLeft } from "lucide-react";
import AddItemForm from "../components/admin/AddItemForm";
import { PortalEditor } from "../components/admin/PortalEditor-clean";
import AddIndexForm from "../components/admin/AddIndexForm";
import type { AdminItem } from "../hooks/use-admin-api";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editItem, setEditItem] = useState<AdminItem | null>(null);
  
  // Portal Editor state
  const [showPortalEditor, setShowPortalEditor] = useState(false);
  const [editPortalId, setEditPortalId] = useState<string | undefined>(undefined);

  // Add Index Form state
  const [showAddIndexForm, setShowAddIndexForm] = useState(false);

  // Indices management state
  const [selectedIndices, setSelectedIndices] = useState<string[]>([]);

  // API hooks
  const { data: items, isLoading: itemsLoading, error } = useAdminItems();
  const { data: portals, isLoading: portalsLoading, error: portalsError } = useAdminPortals();
  const { data: indices, isLoading: indicesLoading, error: indicesError } = useAdminIndices();
  const deleteItemMutation = useDeleteItem();
  const deleteIndicesMutation = useDeleteIndices();

  useEffect(() => {
    setIsAuthenticated(true);
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

  const handleEditPortal = (portalId: string) => {
    setEditPortalId(portalId);
    setShowPortalEditor(true);
  };

  const handleCreateNewPortal = () => {
    setEditPortalId(undefined); // Няма ID за нови портали
    setShowPortalEditor(true);
  };

  const handleClosePortalEditor = () => {
    setShowPortalEditor(false);
    setEditPortalId(undefined);
  };

  const handleDeleteSelectedIndices = async () => {
    if (selectedIndices.length === 0) return;
    
    const confirmMessage = `Сигурни ли сте, че искате да изтриете ${selectedIndices.length} индекс${selectedIndices.length !== 1 ? 'а' : ''}?\n\nТова ще изтрие всички предмети с тези индекси и техните файлове!\n\nИзбрани индекси: ${selectedIndices.join(', ')}`;
    
    if (confirm(confirmMessage)) {
      try {
        await deleteIndicesMutation.mutateAsync(selectedIndices);
        setSelectedIndices([]); // Clear selection after successful deletion
        alert(`Успешно изтрити ${selectedIndices.length} индекс${selectedIndices.length !== 1 ? 'а' : ''}!`);
      } catch (error) {
        alert("Грешка при изтриване на индексите!");
        console.error("Delete indices error:", error);
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

        {/* Admin Tabs */}
        <Tabs defaultValue="items" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items">Обекти</TabsTrigger>
            <TabsTrigger value="portals">Портали</TabsTrigger>
            <TabsTrigger value="indices">Индекси</TabsTrigger>
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
                onClick={handleCreateNewPortal}
              >
                <Plus className="w-4 h-4" />
                Добави нов портал
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Всички портали в играта</CardTitle>
              </CardHeader>
              <CardContent>
                {portalsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Зареждане на порталите...</p>
                  </div>
                ) : portalsError ? (
                  <div className="text-center py-8 text-red-600">
                    <p>Грешка при зареждане на порталите!</p>
                    <p className="text-sm text-gray-500 mt-1">{portalsError.message}</p>
                  </div>
                ) : !portals?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Все още няма създадени портали.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Име</TableHead>
                          <TableHead>Desktop Слотове</TableHead>
                          <TableHead>Mobile Слотове</TableHead>
                          <TableHead>Статус</TableHead>
                          <TableHead className="w-32">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portals.map((portal) => (
                          <TableRow key={portal.id}>
                            <TableCell className="font-medium">{portal.id}</TableCell>
                            <TableCell>{portal.portalName}</TableCell>
                            <TableCell>{portal.cellCount} слота</TableCell>
                            <TableCell>{portal.cellCount} слота</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                portal.isLocked 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {portal.isLocked ? 'Заключен' : 'Активен'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditPortal(portal.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  disabled
                                >
                                  <Trash2 className="w-4 h-4" />
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

          {/* Indices Tab */}
          <TabsContent value="indices" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-700">Управление на индекси</h2>
              <div className="flex gap-2">
                <Button 
                  className="flex items-center gap-2"
                  onClick={() => setShowAddIndexForm(true)}
                >
                  <Plus className="w-4 h-4" />
                  Добави нов индекс
                </Button>
                {selectedIndices.length > 0 && (
                  <Button 
                    variant="destructive"
                    onClick={handleDeleteSelectedIndices}
                    disabled={deleteIndicesMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Изтрий избрани ({selectedIndices.length})
                  </Button>
                )}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Всички индекси в играта</CardTitle>
                <p className="text-sm text-gray-600">
                  Изберете индексите които искате да изтриете. Ще бъдат премахнати всички записи за тези индекси от таблицата с категории.
                </p>
              </CardHeader>
              <CardContent>
                {indicesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Зареждане на индексите...</p>
                  </div>
                ) : indicesError ? (
                  <div className="text-center py-8 text-red-600">
                    <p>Грешка при зареждане на индексите!</p>
                    <p className="text-sm text-gray-500 mt-1">{indicesError.message}</p>
                  </div>
                ) : !indices?.length ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Няма намерени индекси.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {indices.map((indexInfo) => (
                      <div key={indexInfo.index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            id={`index-${indexInfo.index}`}
                            checked={selectedIndices.includes(indexInfo.index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIndices(prev => [...prev, indexInfo.index]);
                              } else {
                                setSelectedIndices(prev => prev.filter(idx => idx !== indexInfo.index));
                              }
                            }}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                          />
                          <label htmlFor={`index-${indexInfo.index}`} className="flex items-center gap-3 cursor-pointer">
                            <span className="font-mono bg-gray-100 px-3 py-1 rounded text-sm font-semibold">
                              {indexInfo.index}
                            </span>
                            <div className="text-sm text-gray-600">
                              <div>{indexInfo.count} запис{indexInfo.count !== 1 ? 'а' : ''}</div>
                              {indexInfo.descriptions && indexInfo.descriptions.length > 0 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Описания: {indexInfo.descriptions.filter(d => d).join(', ')}
                                </div>
                              )}
                              {indexInfo.categories && indexInfo.categories.length > 0 && (
                                <div className="text-xs text-green-600">
                                  Категории: {[...new Set(indexInfo.categories)].join(', ')}
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            indexInfo.count > 1 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {indexInfo.count > 1 ? 'Дублиран' : 'Уникален'}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {selectedIndices.length > 0 && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="text-sm font-semibold text-red-800 mb-2">
                          Избрани за изтриване ({selectedIndices.length}):
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedIndices.map(index => (
                            <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-mono">
                              {index}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-red-600 mt-2">
                          ⚠️ Това действие ще изтрие всички записи за тези индекси от таблицата с категории!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        {showAddForm && (
          <AddItemForm 
            onClose={handleCloseForm} 
            editItem={editItem || undefined} 
          />
        )}

        {/* Portal Editor Modal */}
        {showPortalEditor && (
          <PortalEditor
            portalId={editPortalId}
            isOpen={showPortalEditor}
            onClose={handleClosePortalEditor}
          />
        )}

        {/* Add Index Form Modal */}
        {showAddIndexForm && (
          <AddIndexForm 
            onClose={() => setShowAddIndexForm(false)} 
          />
        )}
      </div>
    </div>
  );
}