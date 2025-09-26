import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { X, Save, Trash2 } from 'lucide-react';

interface Slot {
  id: string;
  position: { top: string; left: string };
  diameter: string;
  index: string[];
}

interface PortalEditorProps {
  portalId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PortalEditor({ portalId, isOpen, onClose }: PortalEditorProps) {
  // Portal Settings State
  const [portalName, setPortalName] = useState('');
  const [slotMode, setSlotMode] = useState<'with_cells' | 'without_cells'>('with_cells');
  const [backgroundFileName, setBackgroundFileName] = useState('dolina-large.png');
  const [imageSize, setImageSize] = useState({ width: 1920, height: 1080 });
  
  // Current tab state
  const [activeTab, setActiveTab] = useState('desktop');
  
  // Icon management state
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [availableIcons, setAvailableIcons] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Desktop Canvas State (single source for both desktop and mobile)
  const [desktopSlots, setDesktopSlots] = useState<Slot[]>([]);
  
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const mobileCanvasRef = useRef<HTMLDivElement>(null);
  
  // Mobile adaptation scale factors
  const MOBILE_SIZE_SCALE = 0.7; // Mobile slots are 70% of desktop size
  
  // Auto-generate mobile slots from desktop slots
  const mobileSlots: Slot[] = desktopSlots.map(slot => ({
    ...slot,
    id: slot.id.replace('desktop-slot-', 'mobile-slot-'),
    diameter: `${parseFloat(slot.diameter) * MOBILE_SIZE_SCALE}%`
  }));
  
  // Computed background image path
  const backgroundImage = `/images/backgrounds/${backgroundFileName}`;
  
  // Available background files
  const availableBackgrounds = [
    { value: 'dolina-large.png', label: 'Долина (Голяма)', size: { width: 1920, height: 1080 } },
    { value: 'dolina-small.png', label: 'Долина (Малка)', size: { width: 1280, height: 720 } }
  ];

  // Available indices for dropdown
  const availableIndices = [
    { value: 'h', label: 'h - домашни' },
    { value: 'p', label: 'p - селскостопански' },
    { value: 'i', label: 'i - транспорт (влак)' },
    { value: 'r', label: 'r - транспорт (кола)' },
    { value: 's', label: 's - транспорт/птици' },
    { value: 'j', label: 'j - джунгла' },
    { value: 'l', label: 'l - джунгла (лъв)' },
    { value: 'o', label: 'o - океан' },
    { value: 'd', label: 'd - други' },
    { value: 'f', label: 'f - други' },
    { value: 'z', label: 'z - неясна категория' }
  ];

  // Load existing data when editing
  useEffect(() => {
    if (portalId === 'd1') {
      setPortalName('Зелена долина - Ниво 1');
      // TODO: Load existing slots from API
    }
  }, [portalId]);

  // Slot management functions
  const createSlot = (x: number, y: number) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const xPercent = ((x - rect.left) / rect.width * 100).toFixed(2);
    const yPercent = ((y - rect.top) / rect.height * 100).toFixed(2);
    
    const newSlot: Slot = {
      id: `desktop-slot-${Date.now()}`,
      position: { top: `${yPercent}%`, left: `${xPercent}%` },
      diameter: '11%',
      index: ['h']
    };
    
    setDesktopSlots(prev => [...prev, newSlot]);
    setSelectedSlot(newSlot.id);
  };

  const handleBackgroundChange = (fileName: string) => {
    setBackgroundFileName(fileName);
    const selectedBg = availableBackgrounds.find(bg => bg.value === fileName);
    if (selectedBg) {
      setImageSize(selectedBg.size);
    }
  };

  const updateSlot = (slotId: string, updates: Partial<Slot>) => {
    // Convert mobile slot ID to desktop slot ID if necessary
    const desktopSlotId = slotId.startsWith('mobile-slot-') 
      ? slotId.replace('mobile-slot-', 'desktop-slot-')
      : slotId;
    
    // Update desktop slots - mobile adapts automatically
    setDesktopSlots(prev => prev.map(slot => 
      slot.id === desktopSlotId ? { ...slot, ...updates } : slot
    ));
  };

  const deleteSlot = (slotId: string) => {
    // Convert mobile slot ID to desktop slot ID if necessary
    const desktopSlotId = slotId.startsWith('mobile-slot-') 
      ? slotId.replace('mobile-slot-', 'desktop-slot-')
      : slotId;
    
    // Delete from desktop slots - mobile adapts automatically
    setDesktopSlots(prev => prev.filter(slot => slot.id !== desktopSlotId));
    if (selectedSlot === slotId || selectedSlot === desktopSlotId) {
      setSelectedSlot(null);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.shiftKey) {
      createSlot(e.clientX, e.clientY);
    }
  };

  const handleSlotClick = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSlot(slotId);
  };

  const handleSlotMouseDown = (slotId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedSlot(slotId);
    setIsDragging(true);
    
    const slot = desktopSlots.find(s => s.id === slotId);
    if (slot && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const slotX = (parseFloat(slot.position.left) / 100) * rect.width + rect.left;
      const slotY = (parseFloat(slot.position.top) / 100) * rect.height + rect.top;
      
      setDragOffset({
        x: e.clientX - slotX,
        y: e.clientY - slotY
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedSlot) return;
      
      // Determine which canvas is active based on active tab
      let currentCanvas = null;
      if (activeTab === 'desktop' && canvasRef.current) {
        currentCanvas = canvasRef.current;
      } else if (activeTab === 'mobile' && mobileCanvasRef.current) {
        currentCanvas = mobileCanvasRef.current;
      }
      
      if (!currentCanvas) return;
      
      const rect = currentCanvas.getBoundingClientRect();
      const x = e.clientX - dragOffset.x - rect.left;
      const y = e.clientY - dragOffset.y - rect.top;
      
      const xPercent = (x / rect.width * 100).toFixed(2);
      const yPercent = (y / rect.height * 100).toFixed(2);
      
      updateSlot(selectedSlot, {
        position: { top: `${yPercent}%`, left: `${xPercent}%` }
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, selectedSlot, dragOffset]);

  // Computed selected slot data (works for both desktop and mobile views)
  const selectedSlotData = selectedSlot ? 
    desktopSlots.find(slot => slot.id === selectedSlot || slot.id === selectedSlot.replace('mobile-slot-', 'desktop-slot-')) || null 
    : null;

  const handleSave = async () => {
    if (!portalId) {
      alert('Няма избран портал за записване');
      return;
    }

    setIsSaving(true);
    
    try {
      // Prepare data for save
      const saveData = {
        name: portalName,
        backgroundLarge: backgroundImage,
        backgroundSmall: backgroundImage.replace('large', 'small'), 
        slots_desktop: desktopSlots,
        slots_mobile: mobileSlots,
        ...(selectedIcon && { iconFileName: selectedIcon })
      };

      console.log('Saving portal data:', saveData);

      // Save to backend
      const response = await fetch(`http://localhost:3005/api/layouts/${portalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saveData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Save successful:', result);
      
      alert('Портала е запазен успешно!');
      onClose();
    } catch (error) {
      console.error('Failed to save portal:', error);
      alert('Грешка при запазване на портала. Моля опитайте отново.');
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing portal data when component mounts or portalId changes
  useEffect(() => {
    const loadPortalData = async () => {
      if (!portalId || !isOpen) return;
      
      try {
        // Fetch layout data from API (contains slots)
        const response = await fetch(`http://localhost:3005/api/layouts/${portalId}`);
        if (response.ok) {
          const layoutData = await response.json();
          
          // Load portal settings
          setPortalName(layoutData.name || '');
          // setSlotMode - not in API data yet
          // setBackgroundFileName - extract from backgroundLarge path
          if (layoutData.backgroundLarge) {
            const fileName = layoutData.backgroundLarge.split('/').pop() || 'dolina-large.png';
            setBackgroundFileName(fileName);
          }
          
          // Load desktop slots
          if (layoutData.slots_desktop && Array.isArray(layoutData.slots_desktop)) {
            setDesktopSlots(layoutData.slots_desktop);
          }
          
          console.log('Loaded layout data:', layoutData);
          console.log('Desktop slots loaded:', layoutData.slots_desktop);
        }
      } catch (error) {
        console.error('Failed to load portal data:', error);
      }
    };

    loadPortalData();
  }, [portalId, isOpen]);

  // Load available icons
  useEffect(() => {
    const loadIcons = async () => {
      try {
        // Get icons from API or hardcoded list for now
        const icons = [
          '1758682345806-robin.png',
          '1758683309594-wolf.png', 
          '1758684157766-train1.png',
          '1758684433340-train2.png',
          '1758686243635-train3.png',
          '1758686331550-dove.png',
          '1758689691831-firetruck.png',
          '1758693122489-balloon.png',
          '1758750796740-lion.png',
          'airplane.png',
          'bus.png',
          'cat.png',
          'chicken.png',
          'cow.png',
          'crow.png',
          'dog.png',
          'firetruck.png',
          'train.png'
        ];
        setAvailableIcons(icons);
      } catch (error) {
        console.error('Failed to load icons:', error);
      }
    };

    if (isOpen) {
      loadIcons();
    }
  }, [isOpen]);

  const handleIconSelect = (iconFileName: string) => {
    setSelectedIcon(iconFileName);
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Моля изберете изображение файл (PNG, JPG)');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файлът е твърде голям. Максимален размер: 5MB');
      return;
    }

    console.log('Uploading icon:', file.name);
    // TODO: Implement actual upload to server
    alert(`Upload на "${file.name}" ще бъде имплементиран в следващата фаза.`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] h-[98vh] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <DialogHeader className="p-4 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                {portalId ? `Редактиране на портал: ${portalId}` : 'Създаване на нов портал'}
              </DialogTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 h-8"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Запазва...' : 'Запази'}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Portal Settings Section */}
          <div className="p-3 border-b bg-gray-50">
            <h3 className="text-lg font-semibold mb-3">Настройки на портал</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Portal Name */}
              <div className="space-y-2">
                <Label htmlFor="portal-name" className="text-sm">Име на портала</Label>
                <Input
                  id="portal-name"
                  className="h-8"
                  value={portalName}
                  onChange={(e) => setPortalName(e.target.value)}
                  placeholder="Въведете име на портала..."
                />
              </div>

              {/* Background File */}
              <div className="space-y-2">
                <Label className="text-sm">Фонова картина</Label>
                <Select value={backgroundFileName} onValueChange={handleBackgroundChange}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBackgrounds.map(bg => (
                      <SelectItem key={bg.value} value={bg.value}>
                        {bg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Image Size Display */}
              <div className="space-y-2">
                <Label className="text-sm">Размер (пиксели)</Label>
                <div className="h-8 px-3 py-1 border rounded-md bg-white text-sm flex items-center text-gray-600">
                  {imageSize.width} × {imageSize.height}
                </div>
              </div>

              {/* Slot Mode */}
              <div className="space-y-2">
                <Label className="text-sm">Режим на фона</Label>
                <RadioGroup value={slotMode} onValueChange={(value) => setSlotMode(value as any)} className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="with_cells" id="with_cells" />
                    <Label htmlFor="with_cells" className="text-xs">С клетки</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="without_cells" id="without_cells" />
                    <Label htmlFor="without_cells" className="text-xs">Без клетки</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-3 mt-2 mb-0">
                <TabsTrigger value="desktop" className="text-sm">Desktop</TabsTrigger>
                <TabsTrigger value="mobile" className="text-sm">Mobile</TabsTrigger>
                <TabsTrigger value="icon" className="text-sm">Икони</TabsTrigger>
              </TabsList>

              {/* Desktop Tab */}
              <TabsContent value="desktop" className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full p-3">
                  {/* Canvas Area - Left Half */}
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        <strong>Shift+Click</strong> нов slot | <strong>Click</strong> селекция | <strong>Drag</strong> преместване
                      </p>
                    </div>
                    
                    <div 
                      ref={canvasRef}
                      className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair flex-1"
                      style={{ 
                        minHeight: '400px',
                        backgroundImage: `url('${backgroundImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      onClick={handleCanvasClick}
                    >
                      {/* Render Slots */}
                      {desktopSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 cursor-pointer transition-all ${
                            selectedSlot === slot.id 
                              ? 'border-blue-500 bg-blue-200' 
                              : 'border-white bg-white/20 hover:bg-white/40'
                          }`}
                          style={{
                            top: slot.position.top,
                            left: slot.position.left,
                            width: slot.diameter,
                            height: slot.diameter,
                          }}
                          onClick={(e) => handleSlotClick(slot.id, e)}
                          onMouseDown={(e) => handleSlotMouseDown(slot.id, e)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {slot.index.join(',')}
                          </div>
                        </div>
                      ))}
                      
                      {/* Canvas Overlay Info */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                        Desktop Slots: {desktopSlots.length}
                      </div>
                    </div>
                  </div>

                  {/* Properties Panel - Right Half */}
                  <div className="flex flex-col">
                    <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto">
                      <h3 className="font-semibold mb-4 text-lg">Properties</h3>
                      
                      {selectedSlotData ? (
                        <div className="space-y-4">
                          {/* Slot ID */}
                          <div>
                            <Label className="text-sm text-gray-500">Slot ID</Label>
                            <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                              {selectedSlotData.id}
                            </p>
                          </div>

                          {/* Index Selection */}
                          <div>
                            <Label className="text-sm font-medium">Index</Label>
                            <Select 
                              value={selectedSlotData.index[0]} 
                              onValueChange={(value) => updateSlot(selectedSlotData.id, { index: [value] })}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIndices.map(indexItem => (
                                  <SelectItem key={indexItem.value} value={indexItem.value}>
                                    {indexItem.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium">Top (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.top)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, top: `${e.target.value}%` }
                                })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Left (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.left)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, left: `${e.target.value}%` }
                                })}
                              />
                            </div>
                          </div>

                          {/* Diameter */}
                          <div>
                            <Label className="text-sm font-medium">Diameter (%)</Label>
                            <Input 
                              type="number" 
                              step="0.5"
                              className="h-10"
                              value={parseFloat(selectedSlotData.diameter)} 
                              onChange={(e) => updateSlot(selectedSlotData.id, { diameter: `${e.target.value}%` })}
                            />
                          </div>

                          {/* Delete Button */}
                          <Button 
                            variant="destructive" 
                            className="w-full mt-6"
                            onClick={() => deleteSlot(selectedSlotData.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Slot
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-12">
                          <p className="text-lg mb-2">Селектирайте slot за редактиране</p>
                          <p className="text-sm">Shift+Click върху canvas за създаване на нов slot</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Mobile Tab */}
              <TabsContent value="mobile" className="flex-1 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full p-3">
                  {/* Mobile Canvas Area - Left Half */}
                  <div className="flex flex-col">
                    <div className="mb-2">
                      <p className="text-xs text-gray-600">
                        <strong>Shift+Click</strong> нов slot | <strong>Click</strong> селекция | <strong>Drag</strong> преместване
                      </p>
                    </div>
                    
                    <div 
                      ref={mobileCanvasRef}
                      className="relative w-full bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden cursor-crosshair flex-1"
                      style={{ 
                        minHeight: '400px',
                        backgroundImage: `url('${backgroundImage}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                      onClick={handleCanvasClick}
                    >
                      {/* Render Mobile Slots */}
                      {mobileSlots.map((slot) => (
                        <div
                          key={slot.id}
                          className={`absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-4 cursor-pointer transition-all ${
                            selectedSlot === slot.id 
                              ? 'border-green-500 bg-green-200' 
                              : 'border-white bg-white/20 hover:bg-white/40'
                          }`}
                          style={{
                            top: slot.position.top,
                            left: slot.position.left,
                            width: slot.diameter,
                            height: slot.diameter,
                          }}
                          onClick={(e) => handleSlotClick(slot.id, e)}
                          onMouseDown={(e) => handleSlotMouseDown(slot.id, e)}
                        >
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                            {slot.index.join(',')}
                          </div>
                        </div>
                      ))}
                      
                      {/* Canvas Overlay Info */}
                      <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                        Mobile Slots: {mobileSlots.length}
                      </div>
                    </div>
                  </div>

                  {/* Properties Panel - Right Half (shared with Desktop) */}
                  <div className="flex flex-col">
                    <div className="bg-gray-50 p-4 rounded-lg flex-1 overflow-y-auto">
                      <h3 className="font-semibold mb-4 text-lg">Properties</h3>
                      
                      {selectedSlotData ? (
                        <div className="space-y-4">
                          {/* Slot ID */}
                          <div>
                            <Label className="text-sm text-gray-500">Slot ID</Label>
                            <p className="text-sm font-mono bg-white p-2 rounded border break-all">
                              {selectedSlotData.id}
                            </p>
                          </div>

                          {/* Index Selection */}
                          <div>
                            <Label className="text-sm font-medium">Index</Label>
                            <Select 
                              value={selectedSlotData.index[0]} 
                              onValueChange={(value) => updateSlot(selectedSlotData.id, { index: [value] })}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {availableIndices.map(indexItem => (
                                  <SelectItem key={indexItem.value} value={indexItem.value}>
                                    {indexItem.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm font-medium">Top (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.top)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, top: `${e.target.value}%` }
                                })}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Left (%)</Label>
                              <Input 
                                type="number" 
                                step="0.1"
                                className="h-10"
                                value={parseFloat(selectedSlotData.position.left)} 
                                onChange={(e) => updateSlot(selectedSlotData.id, { 
                                  position: { ...selectedSlotData.position, left: `${e.target.value}%` }
                                })}
                              />
                            </div>
                          </div>

                          {/* Diameter */}
                          <div>
                            <Label className="text-sm font-medium">Diameter (%)</Label>
                            <Input 
                              type="number" 
                              step="0.5"
                              className="h-10"
                              value={parseFloat(selectedSlotData.diameter)} 
                              onChange={(e) => updateSlot(selectedSlotData.id, { diameter: `${e.target.value}%` })}
                            />
                          </div>

                          {/* Delete Button */}
                          <Button 
                            variant="destructive" 
                            className="w-full mt-6"
                            onClick={() => deleteSlot(selectedSlotData.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Slot
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 mt-12">
                          <p className="text-lg mb-2">Селектирайте slot за редактиране</p>
                          <p className="text-sm">Shift+Click върху canvas за създаване на нов slot</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Icon Tab */}
              <TabsContent value="icon" className="flex-1 overflow-hidden">
                <div className="h-full p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Icon Gallery</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Изберете икона за портала. Избраната икона: 
                      <span className="font-semibold ml-1">
                        {selectedIcon || 'Няма избрана'}
                      </span>
                    </p>
                  </div>
                  
                  {/* Icon Grid */}
                  <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 h-full overflow-y-auto pr-2">
                    {availableIcons.map((iconFile) => (
                      <div
                        key={iconFile}
                        className={`relative aspect-square border-2 rounded-lg cursor-pointer transition-all hover:scale-105 group ${
                          selectedIcon === iconFile 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onClick={() => handleIconSelect(iconFile)}
                        title={iconFile}
                      >
                        {/* Icon Image */}
                        <img
                          src={`/images/${iconFile}`}
                          alt={iconFile}
                          className="w-full h-full object-contain p-1 rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        
                        {/* Selected Indicator */}
                        {selectedIcon === iconFile && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </div>
                        )}
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {iconFile.replace(/^\d+-/, '').replace('.png', '')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Upload Zone */}
                  <div 
                    className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('icon-upload')?.click()}
                  >
                    <div className="text-gray-500">
                      <p className="text-sm font-medium">Upload нова икона</p>
                      <p className="text-xs mt-1">Drag & drop файл тук или кликнете за избор</p>
                      <p className="text-xs text-gray-400 mt-2">Поддържани формати: PNG, JPG (препоръчително 128x128px)</p>
                    </div>
                    <input
                      id="icon-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleIconUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}