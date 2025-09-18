import { useState, useEffect } from "react";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const correctPassword = "admin123";
    const enteredPassword = prompt("Моля, въведете парола за достъп:");

    if (enteredPassword === correctPassword) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

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
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Админ Панел
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Добавяне на нов предмет */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              ➕ Добавяне на нов предмет
            </h2>
            <p className="text-gray-600 mb-4">
              Тук ще можете да добавяте нови предмети към играта.
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500 italic">
                Функционалността ще бъде имплементирана скоро...
              </p>
            </div>
          </div>

          {/* Редактор на нива */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              🎮 Редактор на нива
            </h2>
            <p className="text-gray-600 mb-4">
              Тук ще можете да редактирате и създавате нови нива.
            </p>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-500 italic">
                Функционалността ще бъде имплементирана скоро...
              </p>
            </div>
          </div>
        </div>

        {/* Назад към играта */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Назад към играта
          </button>
        </div>
      </div>
    </div>
  );
}