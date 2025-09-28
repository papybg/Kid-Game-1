import React, { useRef, useState } from 'react';
import apiPath from '../../lib/config';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Upload, X } from 'lucide-react';

interface AddItemFormProps {
  onSuccess?: () => void;
}

export default function AddItemForm({ onSuccess }: AddItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({ name: '', index: '', category: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeAudio = () => {
    setAudioFile(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!formData.name.trim()) return setError('Името е задължително');
    if (!formData.index.trim()) return setError('Индексът е задължителен');
    if (!imageFile) return setError('Изображението е задължително');

    setIsSubmitting(true);

    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('index', formData.index.trim());
      if (formData.category.trim()) submitData.append('category', formData.category.trim());
      submitData.append('image', imageFile as Blob);
      if (audioFile) submitData.append('audio', audioFile as Blob);

      const res = await fetch(apiPath('/api/game-items'), { method: 'POST', body: submitData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data && (data as any).message) || 'Грешка при създаване на предмет');
      }

      setSuccess(true);
      setFormData({ name: '', index: '', category: '' });
      setImageFile(null);
      setImagePreview(null);
      setAudioFile(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неочаквана грешка');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Добавяне на нов предмет
        </CardTitle>
        <CardDescription>Добавете нов предмет към играта с изображение и опционално аудио файл</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Име на предмета *</Label>
            <Input id="name" type="text" placeholder="напр. Котка, Влак, Кокошка" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="index">Индекс (буква) *</Label>
            <Input id="index" type="text" placeholder="напр. к, в, с" value={formData.index} onChange={(e) => handleInputChange('index', e.target.value)} maxLength={1} required />
            <p className="text-sm text-gray-500">Една буква, която определя позицията на предмета в играта</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория</Label>
            <Select value={formData.category} onValueChange={(value: string) => handleInputChange('category', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Изберете категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="домашни">Домашни животни</SelectItem>
                <SelectItem value="селскостопански">Селскостопански животни</SelectItem>
                <SelectItem value="транспорт">Транспорт</SelectItem>
                <SelectItem value="птици">Птици</SelectItem>
                <SelectItem value="други">Други</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Изображение *</Label>
            {!imageFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors" onClick={() => imageInputRef.current?.click()}>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете изображение</p>
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" id="image-upload" />
                <Button type="button" variant="outline" size="sm">Избери файл</Button>
              </div>
            ) : (
              <div className="relative">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{imageFile.name}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeImage} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
                  </div>
                  {imagePreview && <img src={imagePreview} alt="Preview" className="w-full h-32 object-contain rounded border" />}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Аудио файл (опционално)</Label>
            {!audioFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors" onClick={() => audioInputRef.current?.click()}>
                <Upload className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-2">Кликнете за да изберете аудио файл</p>
                <input ref={audioInputRef} type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" id="audio-upload" />
                <Button type="button" variant="outline" size="sm">Избери файл</Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{audioFile.name}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={removeAudio} className="h-6 w-6 p-0"><X className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription className="text-green-600">Предметът беше успешно добавен!</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Добавяне...
              </>
            ) : (
              'Добави предмет'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}